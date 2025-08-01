import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Update a set's reps and weight
export const update = mutation({
  args: {
    setId: v.id("sets"),
    reps: v.number(),
    weight: v.optional(v.number()),
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
    });
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
        q.eq("sessionId", args.sessionId).eq("exerciseName", args.exerciseName)
      )
      .collect();

    const maxSetNumber = Math.max(0, ...existingSets.map(s => s.setNumber));

    await ctx.db.insert("sets", {
      sessionId: args.sessionId,
      exerciseName: args.exerciseName,
      setNumber: maxSetNumber + 1,
      reps: args.reps,
      weight: args.weight,
      completed: false,
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
