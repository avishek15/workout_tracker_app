import Dexie, { Table } from "dexie";

export type OpType = "create" | "update" | "delete";
export type TableName = "workouts" | "sessions" | "sets";

export interface LocalWorkout {
    clientId: string;
    serverId?: string;
    userId: string;
    name: string;
    description?: string;
    exercises: Array<{
        name: string;
        targetSets: number;
        targetReps?: number;
        targetWeight?: number;
        restTime?: number;
    }>;
    updatedAt: number;
    deletedAt?: number;
    dirty: boolean;
}
export interface LocalSession {
    clientId: string;
    serverId?: string;
    userId: string;
    workoutClientId?: string;
    workoutServerId?: string;
    startTime: number;
    endTime?: number;
    status: "active" | "completed" | "cancelled";
    notes?: string;
    updatedAt: number;
    deletedAt?: number;
    dirty: boolean;
}
export interface LocalSet {
    clientId: string;
    serverId?: string;
    sessionClientId?: string;
    sessionServerId?: string;
    exerciseName: string;
    setNumber: number;
    reps: number;
    weight?: number;
    completed: boolean;
    completedAt?: number;
    updatedAt: number;
    deletedAt?: number;
    dirty: boolean;
}
export interface SyncQueueItem {
    id?: number; // auto
    table: TableName;
    op: OpType;
    clientId: string;
    payload: any;
    ts: number;
    attempts?: number;
}
export interface MetaKV {
    key: string;
    value: any;
}

class AppDB extends Dexie {
    workouts!: Table<LocalWorkout, string>;
    sessions!: Table<LocalSession, string>;
    sets!: Table<LocalSet, string>;
    syncQueue!: Table<SyncQueueItem, number>;
    meta!: Table<MetaKV, string>;

    constructor() {
        super("FitFlowOffline");
        this.version(1).stores({
            workouts: "clientId, serverId, updatedAt, deletedAt",
            sessions:
                "clientId, serverId, updatedAt, deletedAt, workoutClientId, workoutServerId",
            sets: "clientId, serverId, updatedAt, deletedAt, sessionClientId, sessionServerId",
            syncQueue: "++id, table, op, clientId, ts",
            meta: "key",
        });
    }
}

export const db = new AppDB();

export async function getLastSyncAt(table: TableName): Promise<number> {
    const kv = await db.meta.get(`lastSyncAt.${table}`);
    return kv?.value ?? 0;
}
export async function setLastSyncAt(table: TableName, ts: number) {
    await db.meta.put({ key: `lastSyncAt.${table}`, value: ts });
}
