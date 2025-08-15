import { v } from "convex/values";
import { internalQuery } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

// Shared utility functions to eliminate code duplication

// Verify friendship between two users
export const verifyFriendship = internalQuery({
    args: {
        userId1: v.id("users"),
        userId2: v.id("users"),
    },
    returns: v.boolean(),
    handler: async (ctx, args) => {
        const friendship1 = await ctx.db
            .query("friendships")
            .withIndex("by_user1_and_user2", (q) =>
                q.eq("user1Id", args.userId1).eq("user2Id", args.userId2)
            )
            .unique();

        const friendship2 = await ctx.db
            .query("friendships")
            .withIndex("by_user1_and_user2", (q) =>
                q.eq("user1Id", args.userId2).eq("user2Id", args.userId1)
            )
            .unique();

        return !!(friendship1 || friendship2);
    },
});

// Get user's friend IDs
export const getFriendIds = internalQuery({
    args: { userId: v.id("users") },
    returns: v.array(v.id("users")),
    handler: async (ctx, args) => {
        const friendships1 = await ctx.db
            .query("friendships")
            .withIndex("by_user1", (q) => q.eq("user1Id", args.userId))
            .collect();

        const friendships2 = await ctx.db
            .query("friendships")
            .withIndex("by_user2", (q) => q.eq("user2Id", args.userId))
            .collect();

        return [
            ...friendships1.map((f) => f.user2Id),
            ...friendships2.map((f) => f.user1Id),
        ];
    },
});

// Convert storage ID to URL with error handling
export const getImageUrl = internalQuery({
    args: { imageId: v.optional(v.string()) },
    returns: v.union(v.string(), v.null()),
    handler: async (ctx, args) => {
        if (!args.imageId) return null;

        if (args.imageId.startsWith("http")) {
            return args.imageId;
        }

        try {
            const url = await ctx.storage.getUrl(
                args.imageId as Id<"_storage">
            );
            return url;
        } catch (error) {
            console.error("Failed to get image URL:", error);
            return null;
        }
    },
});

// Calculate volume stats for sessions
export const calculateVolumeStats = internalQuery({
    args: {
        sessions: v.array(
            v.object({
                _id: v.id("sessions"),
                endTime: v.optional(v.number()),
                totalVolume: v.optional(v.number()),
            })
        ),
    },
    returns: v.object({
        totalVolume: v.number(),
        totalWorkouts: v.number(),
        averageVolumePerWorkout: v.number(),
        volumeByExercise: v.array(
            v.object({
                exerciseName: v.string(),
                totalVolume: v.number(),
                totalSets: v.number(),
                averageWeight: v.number(),
            })
        ),
        volumeByWeek: v.array(
            v.object({
                weekStart: v.number(),
                totalVolume: v.number(),
                workoutCount: v.number(),
            })
        ),
    }),
    handler: async (ctx, args) => {
        let totalVolume = 0;
        const totalWorkouts = args.sessions.length;
        const exerciseVolumes: Record<
            string,
            { volume: number; sets: number; totalWeight: number }
        > = {};
        const weeklyVolumes: Record<
            string,
            { volume: number; workouts: number }
        > = {};

        // Batch fetch all sets for all sessions
        const sessionIds = args.sessions.map((s) => s._id);
        const allSets = await Promise.all(
            sessionIds.map((sessionId) =>
                ctx.db
                    .query("sets")
                    .withIndex("by_session", (q) =>
                        q.eq("sessionId", sessionId)
                    )
                    .collect()
            )
        );

        // Calculate volume for each session using stored data
        for (let i = 0; i < args.sessions.length; i++) {
            const session = args.sessions[i];
            const sets = allSets[i];

            // Use stored volume if available, otherwise calculate
            let sessionVolume = session.totalVolume || 0;

            // If no stored volume, calculate it (for backward compatibility)
            if (sessionVolume === 0) {
                for (const set of sets) {
                    if (set.completed && set.weight && set.reps) {
                        const setVolume = set.weight * set.reps;
                        sessionVolume += setVolume;

                        // Track by exercise
                        if (!exerciseVolumes[set.exerciseName]) {
                            exerciseVolumes[set.exerciseName] = {
                                volume: 0,
                                sets: 0,
                                totalWeight: 0,
                            };
                        }
                        exerciseVolumes[set.exerciseName].volume += setVolume;
                        exerciseVolumes[set.exerciseName].sets += 1;
                        exerciseVolumes[set.exerciseName].totalWeight +=
                            set.weight;
                    }
                }
            } else {
                // Use stored volume, but still need to track exercise breakdown
                for (const set of sets) {
                    if (set.completed && set.weight && set.reps) {
                        // Track by exercise
                        if (!exerciseVolumes[set.exerciseName]) {
                            exerciseVolumes[set.exerciseName] = {
                                volume: 0,
                                sets: 0,
                                totalWeight: 0,
                            };
                        }
                        exerciseVolumes[set.exerciseName].volume +=
                            set.weight * set.reps;
                        exerciseVolumes[set.exerciseName].sets += 1;
                        exerciseVolumes[set.exerciseName].totalWeight +=
                            set.weight;
                    }
                }
            }

            totalVolume += sessionVolume;

            // Track by week
            const weekStart = new Date(session.endTime || Date.now());
            weekStart.setHours(0, 0, 0, 0);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
            const weekKey = weekStart.getTime().toString();

            if (!weeklyVolumes[weekKey]) {
                weeklyVolumes[weekKey] = { volume: 0, workouts: 0 };
            }
            weeklyVolumes[weekKey].volume += sessionVolume;
            weeklyVolumes[weekKey].workouts += 1;
        }

        // Convert to arrays and sort
        const volumeByExercise = Object.entries(exerciseVolumes)
            .map(([exerciseName, data]) => ({
                exerciseName,
                totalVolume: data.volume,
                totalSets: data.sets,
                averageWeight: data.sets > 0 ? data.totalWeight / data.sets : 0,
            }))
            .sort((a, b) => b.totalVolume - a.totalVolume);

        const volumeByWeek = Object.entries(weeklyVolumes)
            .map(([weekStart, data]) => ({
                weekStart: parseInt(weekStart),
                totalVolume: data.volume,
                workoutCount: data.workouts,
            }))
            .sort((a, b) => a.weekStart - b.weekStart);

        return {
            totalVolume,
            totalWorkouts,
            averageVolumePerWorkout:
                totalWorkouts > 0 ? totalVolume / totalWorkouts : 0,
            volumeByExercise,
            volumeByWeek,
        };
    },
});

// Get time range based on period
export const getTimeRange = internalQuery({
    args: {
        timePeriod: v.union(
            v.literal("week"),
            v.literal("month"),
            v.literal("quarter"),
            v.literal("year")
        ),
    },
    returns: v.object({
        startTime: v.number(),
        endTime: v.number(),
    }),
    handler: async (ctx, args) => {
        const now = Date.now();
        let startTime: number;

        switch (args.timePeriod) {
            case "week":
                startTime = now - 7 * 24 * 60 * 60 * 1000;
                break;
            case "month":
                startTime = now - 30 * 24 * 60 * 60 * 1000;
                break;
            case "quarter":
                startTime = now - 90 * 24 * 60 * 60 * 1000;
                break;
            case "year":
                startTime = now - 365 * 24 * 60 * 60 * 1000;
                break;
        }

        return { startTime, endTime: now };
    },
});

// Calculate current streak from sessions
export const calculateCurrentStreak = internalQuery({
    args: {
        sessions: v.array(
            v.object({
                endTime: v.optional(v.number()),
            })
        ),
    },
    returns: v.number(),
    handler: async (ctx, args) => {
        if (args.sessions.length === 0) return 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let streak = 0;
        const currentDate = new Date(today);

        for (let i = 0; i < 30; i++) {
            // Check last 30 days max
            const dayStart = currentDate.getTime();
            const dayEnd = dayStart + 24 * 60 * 60 * 1000;

            const hasWorkout = args.sessions.some(
                (session) =>
                    session.endTime &&
                    session.endTime >= dayStart &&
                    session.endTime < dayEnd
            );

            if (hasWorkout) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    },
});

// Calculate average workouts per week
export const calculateAverageWorkoutsPerWeek = internalQuery({
    args: {
        sessions: v.array(
            v.object({
                endTime: v.optional(v.number()),
            })
        ),
    },
    returns: v.number(),
    handler: async (ctx, args) => {
        if (args.sessions.length === 0) return 0;

        const now = Date.now();
        const fourWeeksAgo = now - 4 * 7 * 24 * 60 * 60 * 1000;

        const recentSessions = args.sessions.filter(
            (session) => session.endTime && session.endTime >= fourWeeksAgo
        );

        return Math.round((recentSessions.length / 4) * 10) / 10; // Round to 1 decimal
    },
});

// Get favorite exercises from sessions
export const getFavoriteExercises = internalQuery({
    args: {
        sessions: v.array(
            v.object({
                _id: v.id("sessions"),
            })
        ),
    },
    returns: v.array(v.string()),
    handler: async (ctx, args) => {
        const exerciseCounts: Record<string, number> = {};

        // Batch fetch all sets for all sessions
        const sessionIds = args.sessions.map((s) => s._id);
        const allSets = await Promise.all(
            sessionIds.map((sessionId) =>
                ctx.db
                    .query("sets")
                    .withIndex("by_session", (q) =>
                        q.eq("sessionId", sessionId)
                    )
                    .collect()
            )
        );

        // Count exercises
        for (const sets of allSets) {
            for (const set of sets) {
                exerciseCounts[set.exerciseName] =
                    (exerciseCounts[set.exerciseName] || 0) + 1;
            }
        }

        // Return top 5 favorite exercises
        return Object.entries(exerciseCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([exercise]) => exercise);
    },
});

// Calculate session summary (volume, sets, exercises)
export const calculateSessionSummary = internalQuery({
    args: {
        sessionId: v.id("sessions"),
    },
    returns: v.object({
        totalVolume: v.number(),
        completedSets: v.number(),
        totalSets: v.number(),
        exerciseCount: v.number(),
    }),
    handler: async (ctx, args) => {
        // Get all sets for this session
        const sets = await ctx.db
            .query("sets")
            .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
            .collect();

        // Calculate denormalized fields
        const completedSets = sets.filter((set) => set.completed).length;
        const totalSets = sets.length;

        // Get unique exercise names
        const uniqueExercises = new Set(sets.map((set) => set.exerciseName));
        const exerciseCount = uniqueExercises.size;

        // Calculate total volume (convert to kg)
        let totalVolume = 0;
        for (const set of sets) {
            if (set.completed && set.weight && set.reps) {
                let weightInKg = set.weight;
                // Convert lbs to kg if needed
                if (set.weightUnit === "lbs") {
                    weightInKg = set.weight * 0.453592;
                }
                totalVolume += weightInKg * set.reps;
            }
        }

        return {
            totalVolume,
            completedSets,
            totalSets,
            exerciseCount,
        };
    },
});
