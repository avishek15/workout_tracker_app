import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all sessions for the current user
export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const sessions = await ctx.db
            .query("sessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();

        // Get workout details for each session
        const sessionsWithWorkouts = await Promise.all(
            sessions.map(async (session) => {
                const workout = await ctx.db.get(session.workoutId);
                return {
                    ...session,
                    workout,
                };
            })
        );

        return sessionsWithWorkouts;
    },
});

// Get the current active session
export const getActive = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const activeSession = await ctx.db
            .query("sessions")
            .withIndex("by_user_and_status", (q) =>
                q.eq("userId", userId).eq("status", "active")
            )
            .first();

        if (!activeSession) {
            return null;
        }

        const workout = await ctx.db.get(activeSession.workoutId);
        const sets = await ctx.db
            .query("sets")
            .withIndex("by_session", (q) =>
                q.eq("sessionId", activeSession._id)
            )
            .collect();

        return {
            ...activeSession,
            workout,
            sets,
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

        // Check if there's already an active session
        const activeSession = await ctx.db
            .query("sessions")
            .withIndex("by_user_and_status", (q) =>
                q.eq("userId", userId).eq("status", "active")
            )
            .first();

        if (activeSession) {
            throw new Error("You already have an active workout session");
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
        });
    },
});
