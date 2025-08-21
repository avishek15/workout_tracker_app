import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Get personal records for a specific exercise
 */
export const getExercisePRs = query({
    args: {
        exerciseName: v.string(),
    },
    returns: v.object({
        weightPR: v.union(
            v.object({
                maxWeight: v.number(),
                weightUnit: v.union(v.literal("kg"), v.literal("lbs")),
                reps: v.number(),
                date: v.number(),
            }),
            v.null()
        ),
        volumePR: v.union(
            v.object({
                maxVolume: v.number(),
                weight: v.number(),
                weightUnit: v.union(v.literal("kg"), v.literal("lbs")),
                reps: v.number(),
                date: v.number(),
            }),
            v.null()
        ),
    }),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return { weightPR: null, volumePR: null };
        }

        // Get weight PR
        const weightPR = await ctx.db
            .query("personalRecords")
            .withIndex("by_user_and_exercise", (q) =>
                q.eq("userId", userId).eq("exerciseName", args.exerciseName)
            )
            .first();

        // Get volume PR
        const volumePR = await ctx.db
            .query("volumeRecords")
            .withIndex("by_user_and_exercise", (q) =>
                q.eq("userId", userId).eq("exerciseName", args.exerciseName)
            )
            .first();

        return {
            weightPR: weightPR
                ? {
                      maxWeight: weightPR.maxWeight,
                      weightUnit: weightPR.weightUnit,
                      reps: weightPR.reps,
                      date: weightPR.date,
                  }
                : null,
            volumePR: volumePR
                ? {
                      maxVolume: volumePR.maxVolume,
                      weight: volumePR.weight,
                      weightUnit: volumePR.weightUnit,
                      reps: volumePR.reps,
                      date: volumePR.date,
                  }
                : null,
        };
    },
});

/**
 * Update personal records after session completion
 */
export const updatePersonalRecords = mutation({
    args: {
        exerciseName: v.string(),
        sessionId: v.id("sessions"),
        sets: v.array(
            v.object({
                effectiveWeight: v.number(),
                weight: v.number(), // original weight in original unit
                weightUnit: v.union(v.literal("kg"), v.literal("lbs")),
                reps: v.number(),
            })
        ),
    },
    returns: v.object({
        newWeightPR: v.boolean(),
        newVolumePR: v.boolean(),
    }),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        let newWeightPR = false;
        let newVolumePR = false;

        // Get current PRs
        const currentWeightPR = await ctx.db
            .query("personalRecords")
            .withIndex("by_user_and_exercise", (q) =>
                q.eq("userId", userId).eq("exerciseName", args.exerciseName)
            )
            .first();

        const currentVolumePR = await ctx.db
            .query("volumeRecords")
            .withIndex("by_user_and_exercise", (q) =>
                q.eq("userId", userId).eq("exerciseName", args.exerciseName)
            )
            .first();

        // Check for new weight PR
        for (const set of args.sets) {
            const isNewWeightPR =
                !currentWeightPR ||
                set.effectiveWeight > currentWeightPR.maxWeight ||
                (set.effectiveWeight === currentWeightPR.maxWeight &&
                    set.reps > currentWeightPR.reps);

            if (isNewWeightPR) {
                // Update or insert weight PR
                if (currentWeightPR) {
                    await ctx.db.patch(currentWeightPR._id, {
                        maxWeight: set.effectiveWeight, // effective weight in kg
                        weight: set.weight, // original weight in original unit
                        weightUnit: set.weightUnit, // original unit
                        reps: set.reps,
                        date: Date.now(),
                        sessionId: args.sessionId,
                    });
                } else {
                    await ctx.db.insert("personalRecords", {
                        userId,
                        exerciseName: args.exerciseName,
                        maxWeight: set.effectiveWeight, // effective weight in kg
                        weight: set.weight, // original weight in original unit
                        weightUnit: set.weightUnit, // original unit
                        reps: set.reps,
                        date: Date.now(),
                        sessionId: args.sessionId,
                    });
                }
                newWeightPR = true;
                break; // Only track the first new weight PR
            }
        }

        // Check for new volume PR
        for (const set of args.sets) {
            const volume = set.effectiveWeight * set.reps;
            const isNewVolumePR =
                !currentVolumePR || volume > currentVolumePR.maxVolume;

            if (isNewVolumePR) {
                // Update or insert volume PR
                if (currentVolumePR) {
                    await ctx.db.patch(currentVolumePR._id, {
                        maxVolume: volume, // volume in kg
                        weight: set.weight, // original weight in original unit
                        weightUnit: set.weightUnit, // original unit
                        reps: set.reps,
                        date: Date.now(),
                        sessionId: args.sessionId,
                    });
                } else {
                    await ctx.db.insert("volumeRecords", {
                        userId,
                        exerciseName: args.exerciseName,
                        maxVolume: volume, // volume in kg
                        weight: set.weight, // original weight in original unit
                        weightUnit: set.weightUnit, // original unit
                        reps: set.reps,
                        date: Date.now(),
                        sessionId: args.sessionId,
                    });
                }
                newVolumePR = true;
                break; // Only track the first new volume PR
            }
        }

        return {
            newWeightPR,
            newVolumePR,
        };
    },
});
