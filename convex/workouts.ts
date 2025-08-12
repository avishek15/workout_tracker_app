import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all workouts for the current user
export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        return await ctx.db
            .query("workouts")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
    },
});

// Create a new workout template
export const create = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        exercises: v.array(
            v.object({
                name: v.string(),
                targetSets: v.number(),
                targetReps: v.optional(v.number()),
                targetWeight: v.optional(v.number()),
                restTime: v.optional(v.number()),
            })
        ),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        return await ctx.db.insert("workouts", {
            ...args,
            userId,
            updatedAt: Date.now(),
        });
    },
});

// Update a workout template
export const update = mutation({
    args: {
        id: v.id("workouts"),
        name: v.string(),
        description: v.optional(v.string()),
        exercises: v.array(
            v.object({
                name: v.string(),
                targetSets: v.number(),
                targetReps: v.optional(v.number()),
                targetWeight: v.optional(v.number()),
                restTime: v.optional(v.number()),
            })
        ),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const workout = await ctx.db.get(args.id);
        if (!workout || workout.userId !== userId) {
            throw new Error("Workout not found or not authorized");
        }

        const { id, ...updates } = args;
        await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
    },
});

// Delete a workout template
export const remove = mutation({
    args: { id: v.id("workouts") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const workout = await ctx.db.get(args.id);
        if (!workout || workout.userId !== userId) {
            throw new Error("Workout not found or not authorized");
        }

        await ctx.db.delete(args.id);
    },
});
