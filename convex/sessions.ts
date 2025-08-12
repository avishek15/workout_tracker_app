import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get active session for the current user
export const getActive = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return null;
        }

        const activeSessions = await ctx.db
            .query("sessions")
            .withIndex("by_user_and_status", (q) =>
                q.eq("userId", userId).eq("status", "active")
            )
            .collect();

        return activeSessions[0] || null;
    },
});

// Get all sessions for the current user
export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        const sessions = await ctx.db
            .query("sessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();

        // Fetch workout data and sets for each session
        const sessionsWithData = await Promise.all(
            sessions.map(async (session) => {
                const workout = await ctx.db.get(session.workoutId);
                const sets = await ctx.db
                    .query("sets")
                    .withIndex("by_session", (q) =>
                        q.eq("sessionId", session._id)
                    )
                    .collect();

                return {
                    ...session,
                    workout: workout
                        ? {
                              _id: workout._id,
                              name: workout.name,
                              description: workout.description,
                          }
                        : null,
                    sets,
                };
            })
        );

        return sessionsWithData;
    },
});

// Get a specific session with its sets
export const get = query({
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

        const sets = await ctx.db
            .query("sets")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .collect();

        // Fetch workout data
        const workout = await ctx.db.get(session.workoutId);

        return {
            ...session,
            sets,
            workout: workout
                ? {
                      _id: workout._id,
                      name: workout.name,
                      description: workout.description,
                  }
                : null,
        };
    },
});

// Start a new workout session
export const start = mutation({
    args: { workoutId: v.id("workouts") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const workout = await ctx.db.get(args.workoutId);
        if (!workout || workout.userId !== userId) {
            throw new Error("Workout not found or not authorized");
        }

        const sessionId = await ctx.db.insert("sessions", {
            workoutId: args.workoutId,
            userId,
            startTime: Date.now(),
            status: "active",
            updatedAt: Date.now(),
        });

        // Create initial sets for each exercise
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
                    updatedAt: Date.now(),
                });
            }
        }

        return sessionId;
    },
});

// Complete a workout session
export const complete = mutation({
    args: {
        sessionId: v.id("sessions"),
        notes: v.optional(v.string()),
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

        await ctx.db.patch(args.sessionId, {
            status: "completed",
            endTime: Date.now(),
            notes: args.notes,
            updatedAt: Date.now(),
        });
    },
});

// Cancel a workout session
export const cancel = mutation({
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

        await ctx.db.patch(args.sessionId, {
            status: "cancelled",
            endTime: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

// Delete a workout session
export const deleteSession = mutation({
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

        // Delete all sets associated with this session
        const sets = await ctx.db
            .query("sets")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .collect();

        for (const set of sets) {
            await ctx.db.delete(set._id);
        }

        await ctx.db.delete(args.sessionId);
    },
});
