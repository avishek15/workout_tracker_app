import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get weight progress for a specific exercise over time
export const getWeightProgress = query({
    args: {
        exerciseName: v.string(),
        timeRange: v.union(
            v.literal("week"),
            v.literal("month"),
            v.literal("year"),
            v.literal("all")
        ),
    },
    handler: async (ctx, args) => {
        const { exerciseName, timeRange } = args;
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const now = Date.now();
        let startTime = 0;

        switch (timeRange) {
            case "week":
                startTime = now - 7 * 24 * 60 * 60 * 1000;
                break;
            case "month":
                startTime = now - 30 * 24 * 60 * 60 * 1000;
                break;
            case "year":
                startTime = now - 365 * 24 * 60 * 60 * 1000;
                break;
            case "all":
                startTime = 0;
                break;
        }

        // Get all completed sessions in the time range
        const sessions = await ctx.db
            .query("sessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("status"), "completed"),
                    q.gte(q.field("startTime"), startTime)
                )
            )
            .collect();

        // Get sets for each session
        const sessionsWithSets = await Promise.all(
            sessions.map(async (session) => {
                const sets = await ctx.db
                    .query("sets")
                    .withIndex("by_session", (q) =>
                        q.eq("sessionId", session._id)
                    )
                    .filter((q) =>
                        q.and(
                            q.eq(q.field("exerciseName"), exerciseName),
                            q.neq(q.field("weight"), undefined),
                            q.gt(q.field("weight"), 0)
                        )
                    )
                    .collect();

                return {
                    ...session,
                    sets,
                };
            })
        );

        // Calculate max weight per session for the exercise
        const progressData = sessionsWithSets
            .filter((session) => session.sets.length > 0)
            .map((session) => {
                const maxWeight = Math.max(
                    ...session.sets.map((set) => set.weight || 0)
                );
                return {
                    date: session.startTime,
                    weight: maxWeight,
                    sessionId: session._id,
                };
            })
            .sort((a, b) => a.date - b.date);

        return progressData;
    },
});

// Get volume progress (reps × weight) for a specific exercise
export const getVolumeProgress = query({
    args: {
        exerciseName: v.string(),
        timeRange: v.union(
            v.literal("week"),
            v.literal("month"),
            v.literal("year"),
            v.literal("all")
        ),
    },
    handler: async (ctx, args) => {
        const { exerciseName, timeRange } = args;
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const now = Date.now();
        let startTime = 0;

        switch (timeRange) {
            case "week":
                startTime = now - 7 * 24 * 60 * 60 * 1000;
                break;
            case "month":
                startTime = now - 30 * 24 * 60 * 60 * 1000;
                break;
            case "year":
                startTime = now - 365 * 24 * 60 * 60 * 1000;
                break;
            case "all":
                startTime = 0;
                break;
        }

        const sessions = await ctx.db
            .query("sessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("status"), "completed"),
                    q.gte(q.field("startTime"), startTime)
                )
            )
            .collect();

        const sessionsWithSets = await Promise.all(
            sessions.map(async (session) => {
                const sets = await ctx.db
                    .query("sets")
                    .withIndex("by_session", (q) =>
                        q.eq("sessionId", session._id)
                    )
                    .filter((q) =>
                        q.and(
                            q.eq(q.field("exerciseName"), exerciseName),
                            q.neq(q.field("weight"), undefined),
                            q.gt(q.field("weight"), 0)
                        )
                    )
                    .collect();

                return {
                    ...session,
                    sets,
                };
            })
        );

        const volumeData = sessionsWithSets
            .filter((session) => session.totalVolume !== undefined)
            .map((session) => {
                return {
                    date: session.startTime,
                    volume: session.totalVolume || 0,
                    sessionId: session._id,
                };
            })
            .sort((a, b) => a.date - b.date);

        return volumeData;
    },
});

// Get workout frequency over time
export const getWorkoutFrequency = query({
    args: {
        timeRange: v.union(
            v.literal("week"),
            v.literal("month"),
            v.literal("year"),
            v.literal("all")
        ),
    },
    handler: async (ctx, args) => {
        const { timeRange } = args;
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const now = Date.now();
        let startTime = 0;

        switch (timeRange) {
            case "week":
                startTime = now - 7 * 24 * 60 * 60 * 1000;
                break;
            case "month":
                startTime = now - 30 * 24 * 60 * 60 * 1000;
                break;
            case "year":
                startTime = now - 365 * 24 * 60 * 60 * 1000;
                break;
            case "all":
                startTime = 0;
                break;
        }

        const sessions = await ctx.db
            .query("sessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("status"), "completed"),
                    q.gte(q.field("startTime"), startTime)
                )
            )
            .collect();

        // Group by week/month/year based on timeRange
        const groupedData: Record<string, number> = {};

        sessions.forEach((session) => {
            let key: string;
            const date = new Date(session.startTime);

            switch (timeRange) {
                case "week":
                    key = date.toISOString().slice(0, 10); // YYYY-MM-DD
                    break;
                case "month":
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                    break;
                case "year":
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                    break;
                case "all":
                    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
                    break;
            }

            groupedData[key] = (groupedData[key] || 0) + 1;
        });

        return Object.entries(groupedData).map(([period, count]) => ({
            period,
            count,
        }));
    },
});

// Get total volume across all workouts for a time period
export const getTotalVolume = query({
    args: {
        timeRange: v.union(
            v.literal("week"),
            v.literal("month"),
            v.literal("year"),
            v.literal("all")
        ),
    },
    handler: async (ctx, args) => {
        const { timeRange } = args;
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const now = Date.now();
        let startTime = 0;

        switch (timeRange) {
            case "week":
                startTime = now - 7 * 24 * 60 * 60 * 1000;
                break;
            case "month":
                startTime = now - 30 * 24 * 60 * 60 * 1000;
                break;
            case "year":
                startTime = now - 365 * 24 * 60 * 60 * 1000;
                break;
            case "all":
                startTime = 0;
                break;
        }

        const sessions = await ctx.db
            .query("sessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("status"), "completed"),
                    q.gte(q.field("startTime"), startTime)
                )
            )
            .collect();

        const sessionsWithSets = await Promise.all(
            sessions.map(async (session) => {
                const workout = await ctx.db.get(session.workoutId);
                const sets = await ctx.db
                    .query("sets")
                    .withIndex("by_session", (q) =>
                        q.eq("sessionId", session._id)
                    )
                    .filter((q) =>
                        q.and(
                            q.neq(q.field("weight"), undefined),
                            q.gt(q.field("weight"), 0)
                        )
                    )
                    .collect();

                return {
                    ...session,
                    workout,
                    sets,
                };
            })
        );

        // Calculate total volume per session
        const volumeData = sessionsWithSets
            .filter((session) => session.totalVolume !== undefined)
            .map((session) => {
                return {
                    date: session.startTime,
                    volume: session.totalVolume || 0,
                    sessionId: session._id,
                    workoutName: session.workout?.name || "Unknown",
                };
            })
            .sort((a, b) => a.date - b.date);

        return volumeData;
    },
});

// Get completion rates
export const getCompletionRates = query({
    args: {
        timeRange: v.union(
            v.literal("week"),
            v.literal("month"),
            v.literal("year"),
            v.literal("all")
        ),
    },
    handler: async (ctx, args) => {
        const { timeRange } = args;
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const now = Date.now();
        let startTime = 0;

        switch (timeRange) {
            case "week":
                startTime = now - 7 * 24 * 60 * 60 * 1000;
                break;
            case "month":
                startTime = now - 30 * 24 * 60 * 60 * 1000;
                break;
            case "year":
                startTime = now - 365 * 24 * 60 * 60 * 1000;
                break;
            case "all":
                startTime = 0;
                break;
        }

        const sessions = await ctx.db
            .query("sessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.gte(q.field("startTime"), startTime))
            .collect();

        const sessionsWithSets = await Promise.all(
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
                    workout,
                    sets,
                };
            })
        );

        const completionData = sessionsWithSets.map((session) => {
            const totalSets = session.sets.length;
            const completedSets = session.sets.filter(
                (set) => set.completed
            ).length;
            const completionRate =
                totalSets > 0 ? (completedSets / totalSets) * 100 : 0;

            return {
                date: session.startTime,
                completionRate,
                totalSets,
                completedSets,
                sessionId: session._id,
                workoutName: session.workout?.name || "Unknown",
            };
        });

        return completionData;
    },
});

// Get list of all exercises for filtering
export const getExerciseList = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        // Get all sets for the user's sessions
        const sessions = await ctx.db
            .query("sessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("status"), "completed"))
            .collect();

        const exerciseSet = new Set<string>();

        for (const session of sessions) {
            const sets = await ctx.db
                .query("sets")
                .withIndex("by_session", (q) => q.eq("sessionId", session._id))
                .collect();

            sets.forEach((set) => {
                exerciseSet.add(set.exerciseName);
            });
        }

        return Array.from(exerciseSet).sort();
    },
});
