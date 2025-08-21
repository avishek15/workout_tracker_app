import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
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

        if (activeSessions.length === 0) {
            return null;
        }

        const activeSession = activeSessions[0];

        // Fetch workout data
        const workout = await ctx.db.get(activeSession.workoutId);

        // Fetch sets for the active session
        const sets = await ctx.db
            .query("sets")
            .withIndex("by_session", (q) =>
                q.eq("sessionId", activeSession._id)
            )
            .collect();

        return {
            ...activeSession,
            sets,
            workout: workout
                ? {
                      _id: workout._id,
                      name: workout.name,
                      description: workout.description,
                      exercises: workout.exercises || [],
                  }
                : null,
        };
    },
});

// Get all sessions for the current user with optimized data fetching
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

        if (sessions.length === 0) {
            return [];
        }

        // Batch fetch only workout data (no sets needed for list view)
        const workoutIds = [...new Set(sessions.map((s) => s.workoutId))];
        const workouts = await Promise.all(
            workoutIds.map((id) => ctx.db.get(id))
        );
        const workoutMap = new Map(
            workouts.filter((w) => w).map((w) => [w!._id, w])
        );

        // Return sessions with workout data only (no sets for better performance)
        const sessionsWithData = sessions.map((session) => {
            const workout = workoutMap.get(session.workoutId);

            return {
                ...session,
                workout: workout
                    ? {
                          _id: workout._id,
                          name: workout.name,
                          description: workout.description,
                      }
                    : null,
                // No sets data - use pre-computed stats from session document
                // Sets will be loaded on-demand when session details are viewed
            };
        });

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
    args: {
        workoutId: v.id("workouts"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        // Check for existing active session
        const existingActiveSession = await ctx.db
            .query("sessions")
            .withIndex("by_user_and_status", (q) =>
                q.eq("userId", userId).eq("status", "active")
            )
            .unique();

        if (existingActiveSession) {
            throw new Error(
                "You already have an active workout session. Please complete or cancel it before starting a new one."
            );
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
            const targetSets = exercise.targetSets || 3; // Default to 3 sets if not specified
            for (let setNumber = 1; setNumber <= targetSets; setNumber++) {
                await ctx.db.insert("sets", {
                    sessionId,
                    userId,
                    exerciseName: exercise.name,
                    setNumber,
                    reps: exercise.targetReps || 0,
                    weight: exercise.targetWeight,
                    weightUnit: "kg", // Default to kg for workout template weights
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
        totalVolume: v.number(),
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

        // Calculate session summary (sets, exercises)
        const sessionSummary = await ctx.runQuery(
            internal.utils.calculateSessionSummary,
            {
                sessionId: args.sessionId,
            }
        );

        await ctx.db.patch(args.sessionId, {
            status: "completed",
            endTime: Date.now(),
            notes: args.notes,
            totalVolume: args.totalVolume,
            completedSets: sessionSummary.completedSets,
            totalSets: sessionSummary.totalSets,
            exerciseCount: sessionSummary.exerciseCount,
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

        // Calculate session summary (volume, sets, exercises)
        const sessionSummary = await ctx.runQuery(
            internal.utils.calculateSessionSummary,
            {
                sessionId: args.sessionId,
            }
        );

        await ctx.db.patch(args.sessionId, {
            status: "cancelled",
            endTime: Date.now(),
            // totalVolume: sessionSummary.totalVolume,
            completedSets: sessionSummary.completedSets,
            totalSets: sessionSummary.totalSets,
            exerciseCount: sessionSummary.exerciseCount,
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
