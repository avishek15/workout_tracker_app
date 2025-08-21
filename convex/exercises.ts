import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get the last session performance for a specific exercise
 */
export const getLastExercisePerformance = query({
    args: {
        exerciseName: v.string(),
    },
    returns: v.union(
        v.object({
            exerciseName: v.string(),
            lastSessionDate: v.number(),
            averageWeight: v.number(),
            averageReps: v.number(),
            totalVolume: v.number(),
            bestSet: v.object({
                weight: v.number(),
                reps: v.number(),
                volume: v.number(),
            }),
        }),
        v.null()
    ),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        // Get recent sets for this exercise (excluding current session)
        const recentExerciseSets = await ctx.db
            .query("sets")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("exerciseName"), args.exerciseName),
                    q.eq(q.field("completed"), true) // Only get completed sets
                )
            )
            .order("desc")
            .take(50);

        if (recentExerciseSets.length === 0) {
            console.log(`Exercise: ${args.exerciseName}, No sets found`);
            return null;
        }

        // Find the most recent session that had this exercise
        const mostRecentSessionId = recentExerciseSets[0].sessionId;
        const setsFromLastSession = recentExerciseSets.filter(
            (set) => set.sessionId === mostRecentSessionId
        );

        // Calculate performance metrics from completed sets
        const completedSets = setsFromLastSession.filter(
            (set) => set.completed
        );

        if (completedSets.length === 0) {
            return null;
        }

        const totalWeight = completedSets.reduce(
            (sum, set) => sum + (set.effectiveWeight || set.weight || 0),
            0
        );
        const totalReps = completedSets.reduce(
            (sum, set) => sum + (set.reps || 0),
            0
        );
        const totalVolume = completedSets.reduce((sum, set) => {
            const effectiveWeight = set.effectiveWeight || set.weight || 0;
            return sum + effectiveWeight * (set.reps || 0);
        }, 0);

        const averageWeight = totalWeight / completedSets.length;
        const averageReps = totalReps / completedSets.length;

        // Find best set (highest volume)
        const bestSet = completedSets.reduce((best, set) => {
            const effectiveWeight = set.effectiveWeight || set.weight || 0;
            const volume = effectiveWeight * (set.reps || 0);
            if (!best || volume > best.volume) {
                return {
                    weight: effectiveWeight,
                    reps: set.reps || 0,
                    volume: volume,
                };
            }
            return best;
        }, null as any);

        return {
            exerciseName: args.exerciseName,
            lastSessionDate: recentExerciseSets[0]._creationTime,
            averageWeight,
            averageReps,
            totalVolume,
            bestSet,
        };
    },
});
