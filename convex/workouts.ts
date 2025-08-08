import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// List (exclude soft-deleted)
export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const docs = await ctx.db
            .query("workouts")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        return docs.filter((d) => d.deletedAt === undefined);
    },
});

// List since updatedAt (for sync)
export const listSince = query({
    args: { since: v.number() },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const docs = await ctx.db
            .query("workouts")
            .withIndex("by_user_and_updatedAt", (q) => q.eq("userId", userId))
            .collect();

        return docs.filter((d) => d.updatedAt > args.since);
    },
});

// Create
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
        clientId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");
        const now = Date.now();

        return await ctx.db.insert("workouts", {
            name: args.name,
            description: args.description,
            exercises: args.exercises,
            userId,
            clientId: args.clientId,
            updatedAt: now,
        });
    },
});

// Update
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
        if (!userId) throw new Error("Not authenticated");

        const doc = await ctx.db.get(args.id);
        if (!doc || doc.userId !== userId)
            throw new Error("Workout not found or not authorized");

        await ctx.db.patch(args.id, {
            name: args.name,
            description: args.description,
            exercises: args.exercises,
            updatedAt: Date.now(),
        });
    },
});

// Soft delete
export const remove = mutation({
    args: { id: v.id("workouts") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Not authenticated");

        const doc = await ctx.db.get(args.id);
        if (!doc || doc.userId !== userId)
            throw new Error("Workout not found or not authorized");

        await ctx.db.patch(args.id, {
            deletedAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});
