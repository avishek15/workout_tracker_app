import { convex } from "./convexClient";
import { api } from "../../convex/_generated/api";
import {
    db,
    getLastSyncAt,
    setLastSyncAt,
    type TableName,
    type SyncQueueItem,
} from "./db";

let reachable = true;
const reachabilityListeners = new Set<(r: boolean) => void>();

function setReachable(r: boolean) {
    if (reachable !== r) {
        reachable = r;
        reachabilityListeners.forEach((fn) => fn(r));
    }
}

export function subscribeReachability(listener: (r: boolean) => void) {
    reachabilityListeners.add(listener);
    // emit current value immediately
    listener(reachable);
    return () => reachabilityListeners.delete(listener);
}

export function isBackendReachable() {
    return reachable;
}

async function pushDirty() {
    const queue = await db.syncQueue.orderBy("ts").toArray();
    let failed = false;
    for (const item of queue) {
        try {
            if (item.table === "workouts") {
                if (item.op === "create") {
                    const res = await convex.mutation(api.workouts.create, {
                        ...item.payload,
                    });
                    await db.workouts.update(item.clientId, {
                        serverId: res as any,
                        dirty: false,
                    });
                } else if (item.op === "update") {
                    await convex.mutation(api.workouts.update, item.payload);
                    await db.workouts.update(item.clientId, { dirty: false });
                } else if (item.op === "delete") {
                    await convex.mutation(api.workouts.remove, item.payload);
                    await db.workouts.update(item.clientId, { dirty: false });
                }
            } else if (item.table === "sessions") {
                if (item.op === "create") {
                    const res = await convex.mutation(
                        api.sessions.start,
                        item.payload
                    );
                    const serverSessionId = res as any;

                    // mark session as synced
                    await db.sessions.update(item.clientId, {
                        serverId: serverSessionId,
                        dirty: false,
                    });

                    // Fetch server sets for this session
                    const serverSets = await convex.query(
                        api.sets.listBySessionSince,
                        { sessionId: serverSessionId, since: 0 }
                    );

                    // Map local sets to server sets by (exerciseName, setNumber)
                    const localSets = await db.sets
                        .where("sessionClientId")
                        .equals(item.clientId)
                        .toArray();

                    for (const s of serverSets as any[]) {
                        const match = localSets.find(
                            (ls) =>
                                !ls.serverId &&
                                ls.exerciseName === s.exerciseName &&
                                ls.setNumber === s.setNumber
                        );
                        if (match) {
                            await db.sets.update(match.clientId, {
                                serverId: s._id,
                                sessionServerId: serverSessionId,
                                // align base values, keep local dirty if local differs
                                reps: match.reps,
                                weight: match.weight,
                                completed: match.completed,
                                completedAt: match.completed
                                    ? (match.completedAt ?? Date.now())
                                    : s.completedAt,
                                updatedAt: Date.now(),
                            });
                        }
                    }

                    // Enqueue pending set mutations now that we have server ids
                    const updatedLocalSets = await db.sets
                        .where("sessionClientId")
                        .equals(item.clientId)
                        .toArray();
                    for (const ls of updatedLocalSets) {
                        if (!ls.serverId || !ls.dirty) continue;
                        // If completed locally, ensure server gets it
                        if (ls.completed) {
                            await db.syncQueue.add({
                                table: "sets",
                                op: "complete",
                                clientId: ls.clientId,
                                payload: { setId: ls.serverId },
                                ts: Date.now(),
                                attempts: 0,
                            });
                        } else {
                            // If reps/weight changed
                            await db.syncQueue.add({
                                table: "sets",
                                op: "update",
                                clientId: ls.clientId,
                                payload: {
                                    setId: ls.serverId,
                                    reps: ls.reps,
                                    weight: ls.weight,
                                },
                                ts: Date.now(),
                                attempts: 0,
                            });
                        }
                    }

                    await db.syncQueue.delete(item.id!);
                } else if (item.op === "update") {
                    const { sessionId, ...rest } = item.payload;
                    await convex.mutation(api.sessions.complete, {
                        sessionId,
                        ...rest,
                    });
                    await db.sessions.update(item.clientId, { dirty: false });
                } else if (item.op === "delete") {
                    await convex.mutation(
                        api.sessions.deleteSession,
                        item.payload
                    );
                    await db.sessions.update(item.clientId, { dirty: false });
                }
            } else if (item.table === "sets") {
                if (item.op === "create") {
                    await convex.mutation(api.sets.add, item.payload);
                    await db.sets.update(item.clientId, { dirty: false });
                } else if (item.op === "update") {
                    await convex.mutation(api.sets.update, item.payload);
                    await db.sets.update(item.clientId, { dirty: false });
                } else if (item.op === "delete") {
                    await convex.mutation(api.sets.remove, item.payload);
                    await db.sets.update(item.clientId, { dirty: false });
                } else if (item.op === "complete") {
                    await convex.mutation(api.sets.complete, item.payload);
                    await db.sets.update(item.clientId, { dirty: false });
                }
            }
            await db.syncQueue.delete(item.id!);
        } catch {
            const attempts = (item.attempts ?? 0) + 1;
            await db.syncQueue.update(item.id!, { attempts });
            if (attempts >= 5) await db.syncQueue.delete(item.id!);
            failed = true;
            break; // stop this round
        }
    }
    if (failed) throw new Error("push failed");
}

async function pullSince(table: TableName) {
    const since = await getLastSyncAt(table);
    if (table === "workouts") {
        const rows = await convex.query(api.workouts.listSince, { since });
        for (const r of rows as any[]) {
            const existing = await db.workouts
                .where("serverId")
                .equals(r._id)
                .first();
            if (existing) {
                await db.workouts.update(existing.clientId, {
                    name: r.name,
                    description: r.description,
                    exercises: r.exercises,
                    updatedAt: r.updatedAt ?? r._creationTime,
                    deletedAt: r.deletedAt,
                    dirty: false,
                    serverId: r._id,
                });
            } else {
                await db.workouts.put({
                    clientId: crypto.randomUUID(),
                    serverId: r._id,
                    userId: r.userId,
                    name: r.name,
                    description: r.description,
                    exercises: r.exercises,
                    updatedAt: r.updatedAt ?? r._creationTime,
                    deletedAt: r.deletedAt,
                    dirty: false,
                });
            }
        }
        const maxTs = Math.max(
            since,
            ...rows.map((r: any) => r.updatedAt ?? r._creationTime)
        );
        await setLastSyncAt("workouts", maxTs);
    } else if (table === "sessions") {
        const rows = await convex.query(api.sessions.listSince, { since });
        for (const r of rows as any[]) {
            const existing = await db.sessions
                .where("serverId")
                .equals(r._id)
                .first();
            const base = {
                userId: r.userId,
                startTime: r.startTime,
                endTime: r.endTime,
                status: r.status,
                notes: r.notes,
                workoutServerId: r.workoutId,
                updatedAt: r.updatedAt ?? r._creationTime,
                deletedAt: r.deletedAt,
                dirty: false,
                serverId: r._id,
            };
            if (existing) {
                await db.sessions.update(existing.clientId, base);
            } else {
                await db.sessions.put({
                    clientId: crypto.randomUUID(),
                    ...base,
                });
            }
            // Pull sets for this session incrementally
            const setsSince = await getLastSyncAt("sets");
            const sets = await convex.query(api.sets.listBySessionSince, {
                sessionId: r._id,
                since: setsSince,
            });
            for (const s of sets as any[]) {
                const ex = await db.sets
                    .where("serverId")
                    .equals(s._id)
                    .first();
                const sbase = {
                    sessionServerId: s.sessionId,
                    exerciseName: s.exerciseName,
                    setNumber: s.setNumber,
                    reps: s.reps,
                    weight: s.weight,
                    completed: s.completed,
                    completedAt: s.completedAt,
                    updatedAt: s.updatedAt ?? s._creationTime,
                    deletedAt: s.deletedAt,
                    dirty: false,
                    serverId: s._id,
                };
                if (ex) {
                    await db.sets.update(ex.clientId, sbase);
                } else {
                    // try composite match for local-only rows
                    const comp = await db.sets
                        .where("sessionServerId")
                        .equals(s.sessionId)
                        .toArray();
                    const byComposite = comp.find(
                        (c) =>
                            !c.serverId &&
                            c.exerciseName === s.exerciseName &&
                            c.setNumber === s.setNumber
                    );
                    if (byComposite) {
                        await db.sets.update(byComposite.clientId, sbase);
                    } else {
                        await db.sets.put({
                            clientId: crypto.randomUUID(),
                            ...sbase,
                        });
                    }
                }
            }
            const maxSetTs = Math.max(
                setsSince,
                ...((sets as any[]) || []).map(
                    (s) => s.updatedAt ?? s._creationTime
                )
            );
            await setLastSyncAt("sets", maxSetTs);
        }
        const maxTs = Math.max(
            since,
            ...rows.map((r: any) => r.updatedAt ?? r._creationTime)
        );
        await setLastSyncAt("sessions", maxTs);
    }
}

export async function syncOnce() {
    if (!navigator.onLine) {
        setReachable(false);
        return;
    }
    try {
        await pushDirty();
        await pullSince("workouts");
        await pullSince("sessions");
        setReachable(true);
    } catch {
        setReachable(false);
    }
}

export function startBackgroundSync() {
    const run = () => {
        void syncOnce();
    };
    run();
    const onOnline = () => run();
    const onVisible = () => {
        if (document.visibilityState === "visible") run();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    const interval = window.setInterval(run, 30000);
    return () => {
        window.removeEventListener("online", onOnline);
        document.removeEventListener("visibilitychange", onVisible);
        window.clearInterval(interval);
    };
}

export async function enqueue(item: Omit<SyncQueueItem, "id" | "ts">) {
    await db.syncQueue.add({ ...item, ts: Date.now(), attempts: 0 });
}
