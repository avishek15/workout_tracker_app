import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get body weights for a session
export const listBySession = query({
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
            .query("bodyWeights")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .order("desc")
            .collect();
    },
});

// Get the latest body weight for the authenticated user
export const latestForUser = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const latest = await ctx.db
            .query("bodyWeights")
            .withIndex("by_user_and_date", (q) => q.eq("userId", userId))
            .order("desc")
            .take(1);

        return latest.length > 0 ? latest[0] : null;
    },
});

// Add a body weight measurement
export const add = mutation({
    args: {
        sessionId: v.id("sessions"),
        weight: v.number(),
        weightUnit: v.union(v.literal("kg"), v.literal("lbs")),
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

        if (args.weight <= 0) {
            throw new Error("Weight must be greater than 0");
        }

        // One weight per session: upsert by sessionId
        const existing = await ctx.db
            .query("bodyWeights")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .order("desc")
            .collect();

        if (existing.length > 0) {
            await ctx.db.patch(existing[0]._id, {
                weight: args.weight,
                weightUnit: args.weightUnit,
                updatedAt: Date.now(),
            });
            return existing[0]._id;
        }

        const newId = await ctx.db.insert("bodyWeights", {
            sessionId: args.sessionId,
            userId,
            weight: args.weight,
            weightUnit: args.weightUnit,
            measuredAt: Date.now(),
            updatedAt: Date.now(),
        });
        return newId;
    },
});

// Update a body weight measurement
export const update = mutation({
    args: {
        weightId: v.id("bodyWeights"),
        weight: v.number(),
        weightUnit: v.union(v.literal("kg"), v.literal("lbs")),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const weightEntry = await ctx.db.get(args.weightId);
        if (!weightEntry || weightEntry.userId !== userId) {
            throw new Error("Weight measurement not found or not authorized");
        }

        if (args.weight <= 0) {
            throw new Error("Weight must be greater than 0");
        }

        await ctx.db.patch(args.weightId, {
            weight: args.weight,
            weightUnit: args.weightUnit,
            updatedAt: Date.now(),
        });
    },
});

// Delete a body weight measurement
export const remove = mutation({
    args: { weightId: v.id("bodyWeights") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const weight = await ctx.db.get(args.weightId);
        if (!weight || weight.userId !== userId) {
            throw new Error("Weight measurement not found or not authorized");
        }

        await ctx.db.delete(args.weightId);
    },
});
