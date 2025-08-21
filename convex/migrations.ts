import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Migration to backfill personal records from existing sets data
 */
export const backfillPersonalRecords = internalMutation({
    args: {},
    returns: v.object({
        weightRecordsCreated: v.number(),
        volumeRecordsCreated: v.number(),
        errors: v.array(v.string()),
    }),
    handler: async (ctx) => {
        const errors: string[] = [];
        let weightRecordsCreated = 0;
        let volumeRecordsCreated = 0;

        try {
            // Get all completed sets
            const allSets = await ctx.db
                .query("sets")
                .filter((q) => q.eq(q.field("completed"), true))
                .collect();

            // Group sets by user and exercise
            const userExerciseMap = new Map<string, Map<string, any[]>>();

            for (const set of allSets) {
                const userId = set.userId;
                const exerciseName = set.exerciseName;

                if (!userExerciseMap.has(userId)) {
                    userExerciseMap.set(userId, new Map());
                }

                const exerciseMap = userExerciseMap.get(userId)!;
                if (!exerciseMap.has(exerciseName)) {
                    exerciseMap.set(exerciseName, []);
                }

                exerciseMap.get(exerciseName)!.push(set);
            }

            // Process each user's exercises
            for (const [userId, exerciseMap] of userExerciseMap) {
                for (const [exerciseName, sets] of exerciseMap) {
                    try {
                        // Find weight PR (highest weight, then highest reps at that weight)
                        let weightPR = null;
                        for (const set of sets) {
                            const effectiveWeight =
                                set.effectiveWeight || set.weight || 0;
                            const reps = set.reps || 0;

                            if (
                                !weightPR ||
                                effectiveWeight > weightPR.weight ||
                                (effectiveWeight === weightPR.weight &&
                                    reps > weightPR.reps)
                            ) {
                                weightPR = {
                                    weight: effectiveWeight, // effective weight in kg
                                    originalWeight: set.weight || 0, // original weight
                                    reps: reps,
                                    weightUnit: set.weightUnit || "kg", // original unit
                                    date: set._creationTime,
                                    sessionId: set.sessionId,
                                };
                            }
                        }

                        // Find volume PR (highest volume)
                        let volumePR = null;
                        for (const set of sets) {
                            const effectiveWeight =
                                set.effectiveWeight || set.weight || 0;
                            const reps = set.reps || 0;
                            const volume = effectiveWeight * reps;

                            if (!volumePR || volume > volumePR.volume) {
                                volumePR = {
                                    volume: volume, // volume in kg
                                    originalWeight: set.weight || 0, // original weight
                                    reps: reps,
                                    weightUnit: set.weightUnit || "kg", // original unit
                                    date: set._creationTime,
                                    sessionId: set.sessionId,
                                };
                            }
                        }

                        // Insert weight PR if found
                        if (weightPR) {
                            await ctx.db.insert("personalRecords", {
                                userId: userId as any,
                                exerciseName: exerciseName,
                                maxWeight: weightPR.weight, // effective weight in kg
                                weight: weightPR.originalWeight, // original weight
                                weightUnit: weightPR.weightUnit, // original unit
                                reps: weightPR.reps,
                                date: weightPR.date,
                                sessionId: weightPR.sessionId,
                            });
                            weightRecordsCreated++;
                        }

                        // Insert volume PR if found
                        if (volumePR) {
                            await ctx.db.insert("volumeRecords", {
                                userId: userId as any,
                                exerciseName: exerciseName,
                                maxVolume: volumePR.volume, // volume in kg
                                weight: volumePR.originalWeight, // original weight
                                weightUnit: volumePR.weightUnit, // original unit
                                reps: volumePR.reps,
                                date: volumePR.date,
                                sessionId: volumePR.sessionId,
                            });
                            volumeRecordsCreated++;
                        }
                    } catch (error) {
                        errors.push(
                            `Error processing ${exerciseName} for user ${userId}: ${String(error)}`
                        );
                    }
                }
            }
        } catch (error) {
            errors.push(`Migration failed: ${String(error)}`);
        }

        return {
            weightRecordsCreated,
            volumeRecordsCreated,
            errors,
        };
    },
});
