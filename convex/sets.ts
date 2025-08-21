import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all sets for a session
export const list = query({
    args: { sessionId: v.id("sessions") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const session = await ctx.db.get(args.sessionId);
        if (!session || session.userId !== userId) {
            throw new Error("Session not found or not authorized");
        }

        return await ctx.db
            .query("sets")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .collect();
    },
});

// Update a set
export const update = mutation({
    args: {
        setId: v.id("sets"),
        reps: v.number(),
        weight: v.optional(v.number()),
        weightUnit: v.optional(v.union(v.literal("kg"), v.literal("lbs"))),
        effectiveWeight: v.optional(v.number()),
        isBodyweight: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const set = await ctx.db.get(args.setId);
        if (!set) {
            throw new Error("Set not found");
        }

        const session = await ctx.db.get(set.sessionId);
        if (!session || session.userId !== userId) {
            throw new Error("Not authorized");
        }

        await ctx.db.patch(args.setId, {
            reps: args.reps,
            weight: args.weight,
            weightUnit: args.weightUnit,
            effectiveWeight: args.effectiveWeight,
            isBodyweight: args.isBodyweight,
            updatedAt: Date.now(),
        });
    },
});

// Bulk finalize sets (effectiveWeight + isBodyweight)
export const bulkFinalize = mutation({
    args: {
        updates: v.array(
            v.object({
                setId: v.id("sets"),
                effectiveWeight: v.number(),
                isBodyweight: v.boolean(),
            })
        ),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        for (const u of args.updates) {
            const set = await ctx.db.get(u.setId);
            if (!set) continue;
            const session = await ctx.db.get(set.sessionId);
            if (!session || session.userId !== userId) continue;
            await ctx.db.patch(u.setId, {
                effectiveWeight: u.effectiveWeight,
                isBodyweight: u.isBodyweight,
                updatedAt: Date.now(),
            });
        }
        return null;
    },
});

// Mark a set as completed
export const complete = mutation({
    args: { setId: v.id("sets") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const set = await ctx.db.get(args.setId);
        if (!set) {
            throw new Error("Set not found");
        }

        const session = await ctx.db.get(set.sessionId);
        if (!session || session.userId !== userId) {
            throw new Error("Not authorized");
        }

        await ctx.db.patch(args.setId, {
            completed: true,
            completedAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

// Complete a set with weight and unit information
export const completeWithWeight = mutation({
    args: {
        setId: v.id("sets"),
        weight: v.optional(v.number()),
        weightUnit: v.optional(v.union(v.literal("kg"), v.literal("lbs"))),
        effectiveWeight: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const set = await ctx.db.get(args.setId);
        if (!set) {
            throw new Error("Set not found");
        }

        const session = await ctx.db.get(set.sessionId);
        if (!session || session.userId !== userId) {
            throw new Error("Not authorized");
        }

        await ctx.db.patch(args.setId, {
            weight: args.weight,
            weightUnit: args.weightUnit,
            effectiveWeight: args.effectiveWeight,
            completed: true,
            completedAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

// Add a new set to an exercise
export const add = mutation({
    args: {
        sessionId: v.id("sessions"),
        exerciseName: v.string(),
        reps: v.number(),
        weight: v.optional(v.number()),
        weightUnit: v.optional(v.union(v.literal("kg"), v.literal("lbs"))),
        effectiveWeight: v.optional(v.number()),
        isBodyweight: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const session = await ctx.db.get(args.sessionId);
        if (!session || session.userId !== userId) {
            throw new Error("Session not found or not authorized");
        }

        // Find the highest set number for this exercise
        const existingSets = await ctx.db
            .query("sets")
            .withIndex("by_session_and_exercise", (q) =>
                q
                    .eq("sessionId", args.sessionId)
                    .eq("exerciseName", args.exerciseName)
            )
            .collect();

        const maxSetNumber = Math.max(
            0,
            ...existingSets.map((s) => s.setNumber)
        );

        await ctx.db.insert("sets", {
            sessionId: args.sessionId,
            userId,
            exerciseName: args.exerciseName,
            setNumber: maxSetNumber + 1,
            reps: args.reps,
            weight: args.weight,
            weightUnit: args.weightUnit,
            effectiveWeight: args.effectiveWeight,
            isBodyweight: args.isBodyweight,
            completed: false,
            updatedAt: Date.now(),
        });
    },
});

// Remove a set
export const remove = mutation({
    args: { setId: v.id("sets") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const set = await ctx.db.get(args.setId);
        if (!set) {
            throw new Error("Set not found");
        }

        const session = await ctx.db.get(set.sessionId);
        if (!session || session.userId !== userId) {
            throw new Error("Not authorized");
        }

        await ctx.db.delete(args.setId);
    },
});
