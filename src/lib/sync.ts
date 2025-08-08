import { convex } from "./convexClient";
import { api } from "../../convex/_generated/api";
import {
    db,
    getLastSyncAt,
    setLastSyncAt,
    type TableName,
    type SyncQueueItem,
} from "./db";

async function pushDirty() {
    const queue = await db.syncQueue.orderBy("ts").toArray();
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
                    await db.sessions.update(item.clientId, {
                        serverId: res as any,
                        dirty: false,
                    });
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
                }
            }
            await db.syncQueue.delete(item.id!);
        } catch {
            const attempts = (item.attempts ?? 0) + 1;
            await db.syncQueue.update(item.id!, { attempts });
            if (attempts >= 5) await db.syncQueue.delete(item.id!);
            break; // stop on first failure this round
        }
    }
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
                if (ex) await db.sets.update(ex.clientId, sbase);
                else
                    await db.sets.put({
                        clientId: crypto.randomUUID(),
                        ...sbase,
                    });
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
    if (!navigator.onLine) return;
    await pushDirty();
    await pullSince("workouts");
    await pullSince("sessions");
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
