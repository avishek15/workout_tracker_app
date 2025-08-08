import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// List (exclude deleted)
export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const sessions = await ctx.db
            .query("sessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();

        const filtered = sessions.filter((s) => s.deletedAt === undefined);
        const withDetails = await Promise.all(
            filtered.map(async (session) => {
                const workout = await ctx.db.get(session.workoutId);
                const sets = (
                    await ctx.db
                        .query("sets")
                        .withIndex("by_session", (q) =>
                            q.eq("sessionId", session._id)
                        )
                        .collect()
                ).filter((set) => set.deletedAt === undefined);
                return { ...session, workout, sets };
            })
        );

        return withDetails;
    },
});

// List since updatedAt (for sync)
export const listSince = query({
    args: { since: v.number() },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const docs = await ctx.db
            .query("sessions")
            .withIndex("by_user_and_updatedAt", (q) => q.eq("userId", userId))
            .collect();

        return docs.filter((d) => d.updatedAt > args.since);
    },
});

// Active session (exclude deleted sets)
export const getActive = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const activeSession = await ctx.db
            .query("sessions")
            .withIndex("by_user_and_status", (q) =>
                q.eq("userId", userId).eq("status", "active")
            )
            .first();

        if (!activeSession || activeSession.deletedAt) return null;

        const workout = await ctx.db.get(activeSession.workoutId);
        const sets = (
            await ctx.db
                .query("sets")
                .withIndex("by_session", (q) =>
                    q.eq("sessionId", activeSession._id)
                )
                .collect()
        ).filter((set) => set.deletedAt === undefined);

        return { ...activeSession, workout, sets };
    },
});

// Start
export const start = mutation({
    args: { workoutId: v.id("workouts"), clientId: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const active = await ctx.db
            .query("sessions")
            .withIndex("by_user_and_status", (q) =>
                q.eq("userId", userId).eq("status", "active")
            )
            .first();
        if (active)
            throw new Error("You already have an active workout session");

        const workout = await ctx.db.get(args.workoutId);
        if (!workout || workout.userId !== userId)
            throw new Error("Workout not found or not authorized");

        const now = Date.now();
        const sessionId = await ctx.db.insert("sessions", {
            workoutId: args.workoutId,
            userId,
            startTime: now,
            status: "active",
            clientId: args.clientId,
            updatedAt: now,
        });

        for (const exercise of workout.exercises) {
            for (
                let setNumber = 1;
                setNumber <= exercise.targetSets;
                setNumber++
            ) {
                await ctx.db.insert("sets", {
                    sessionId,
                    exerciseName: exercise.name,
                    setNumber,
                    reps: exercise.targetReps || 0,
                    weight: exercise.targetWeight,
                    completed: false,
                    updatedAt: now,
                });
            }
        }

        return sessionId;
    },
});

// Complete
export const complete = mutation({
    args: { sessionId: v.id("sessions"), notes: v.optional(v.string()) },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const session = await ctx.db.get(args.sessionId);
        if (!session || session.userId !== userId)
            throw new Error("Session not found or not authorized");

        await ctx.db.patch(args.sessionId, {
            status: "completed",
            endTime: Date.now(),
            notes: args.notes,
            updatedAt: Date.now(),
        });
    },
});

// Cancel
export const cancel = mutation({
    args: { sessionId: v.id("sessions") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const session = await ctx.db.get(args.sessionId);
        if (!session || session.userId !== userId)
            throw new Error("Session not found or not authorized");

        await ctx.db.patch(args.sessionId, {
            status: "cancelled",
            endTime: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

// Soft delete session (and mark sets deleted too)
export const deleteSession = mutation({
    args: { sessionId: v.id("sessions") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const session = await ctx.db.get(args.sessionId);
        if (!session || session.userId !== userId)
            throw new Error("Session not found or not authorized");

        const now = Date.now();
        const sets = await ctx.db
            .query("sets")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .collect();

        for (const set of sets) {
            await ctx.db.patch(set._id, { deletedAt: now, updatedAt: now });
        }
        await ctx.db.patch(args.sessionId, { deletedAt: now, updatedAt: now });
    },
});
