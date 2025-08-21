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

/**
 * Backfill effectiveWeight on sets and totalVolume on sessions.
 * - For completed sets missing effectiveWeight:
 *   - If isBodyweight is true: effectiveWeight = max(bodyWeightKg - weightKg, 0)
 *     where bodyWeightKg is taken from session's bodyWeights if available, else 80kg
 *   - Else: effectiveWeight = weight (converted to kg if necessary)
 * - For completed sessions: totalVolume = sum(reps × effectiveWeight) over completed sets
 */
export const backfillEffectiveWeightsAndSessions = internalMutation({
    args: {},
    returns: v.object({
        setsUpdated: v.number(),
        sessionsUpdated: v.number(),
        errors: v.array(v.string()),
    }),
    handler: async (ctx) => {
        const errors: string[] = [];
        let setsUpdated = 0;
        let sessionsUpdated = 0;

        try {
            // Fetch all completed sessions (across all users)
            const sessions = await ctx.db
                .query("sessions")
                .filter((q) => q.eq(q.field("status"), "completed"))
                .collect();

            for (const session of sessions) {
                try {
                    // Load all sets in this session
                    const sets = await ctx.db
                        .query("sets")
                        .withIndex("by_session", (q) =>
                            q.eq("sessionId", session._id)
                        )
                        .collect();

                    // Determine session body weight (kg) if any
                    let sessionBodyWeightKg: number | null = null;
                    try {
                        const bw = await ctx.db
                            .query("bodyWeights")
                            .withIndex("by_session", (q) =>
                                q.eq("sessionId", session._id)
                            )
                            .order("desc")
                            .take(1);
                        if (bw.length > 0) {
                            const entry = bw[0];
                            sessionBodyWeightKg =
                                entry.weightUnit === "lbs"
                                    ? entry.weight * 0.45359237
                                    : entry.weight;
                        }
                    } catch (e) {
                        // ignore; leave as null
                    }

                    // Default body weight if not available
                    const defaultBodyWeightKg = 80;

                    let totalVolume = 0;

                    for (const set of sets) {
                        if (!set.completed) continue;

                        const weight = set.weight ?? 0;
                        const weightKg =
                            set.weightUnit === "lbs"
                                ? weight * 0.45359237
                                : weight;
                        let effectiveWeight = set.effectiveWeight;

                        // Backfill effectiveWeight if missing
                        if (
                            effectiveWeight === undefined ||
                            effectiveWeight === null
                        ) {
                            if (set.isBodyweight) {
                                const bwKg =
                                    sessionBodyWeightKg ?? defaultBodyWeightKg;
                                effectiveWeight = Math.max(bwKg - weightKg, 0);
                            } else {
                                effectiveWeight = weightKg;
                            }

                            try {
                                await ctx.db.patch(set._id, {
                                    effectiveWeight,
                                });
                                setsUpdated++;
                            } catch (e) {
                                errors.push(
                                    `Failed to patch set ${set._id}: ${String(e)}`
                                );
                            }
                        }

                        // Use existing or newly computed effectiveWeight for volume
                        const finalEff = effectiveWeight ?? 0;
                        const reps = set.reps ?? 0;
                        totalVolume += finalEff * reps;
                    }

                    // If session has no totalVolume or it's zero, update it
                    const sessionTotal = session.totalVolume ?? 0;
                    if (totalVolume > 0 && sessionTotal === 0) {
                        try {
                            await ctx.db.patch(session._id, {
                                totalVolume,
                            });
                            sessionsUpdated++;
                        } catch (e) {
                            errors.push(
                                `Failed to patch session ${session._id}: ${String(e)}`
                            );
                        }
                    }
                } catch (e) {
                    errors.push(
                        `Error processing session ${session._id}: ${String(e)}`
                    );
                }
            }
        } catch (e) {
            errors.push(`Migration failed: ${String(e)}`);
        }

        return { setsUpdated, sessionsUpdated, errors };
    },
});
