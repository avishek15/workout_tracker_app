import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

// Temporary migration function to calculate totalVolume for existing sessions
export const migrateTotalVolume = internalMutation({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        // Get all sessions that don't have totalVolume yet
        const sessions = await ctx.db
            .query("sessions")
            .filter((q) => q.eq(q.field("totalVolume"), undefined))
            .collect();

        console.log(`Found ${sessions.length} sessions to migrate`);

        for (const session of sessions) {
            // Get all sets for this session
            const sets = await ctx.db
                .query("sets")
                .withIndex("by_session", (q) => q.eq("sessionId", session._id))
                .filter((q) => q.eq(q.field("completed"), true))
                .collect();

            // Calculate total volume in kg
            let totalVolume = 0;
            for (const set of sets) {
                if (set.weight && set.reps) {
                    let weightInKg = set.weight;

                    // Convert to kg if needed
                    if (set.weightUnit === "lbs") {
                        weightInKg = set.weight * 0.453592; // Convert lbs to kg
                    }
                    // If weightUnit is missing or kg, use as-is

                    totalVolume += weightInKg * set.reps;
                }
            }

            // Update the session with calculated totalVolume
            await ctx.db.patch(session._id, {
                totalVolume: totalVolume,
            });

            console.log(
                `Updated session ${session._id} with volume: ${totalVolume}`
            );
        }

        console.log("Migration completed");
        return null;
    },
});

// Migration function to backfill denormalized fields for existing sessions
export const migrateDenormalizedFields = internalMutation({
    args: {},
    returns: v.null(),
    handler: async (ctx) => {
        // Get all completed sessions that need denormalized fields
        // We need to get all sessions and filter by status since we can't query by status alone
        const allSessions = await ctx.db.query("sessions").collect();

        const sessions = allSessions.filter(
            (session) => session.status === "completed"
        );

        console.log(`Found ${sessions.length} completed sessions to migrate`);

        for (const session of sessions) {
            // Get all sets for this session
            const sets = await ctx.db
                .query("sets")
                .withIndex("by_session", (q) => q.eq("sessionId", session._id))
                .collect();

            // Calculate denormalized fields
            const completedSets = sets.filter((set) => set.completed).length;
            const totalSets = sets.length;

            // Get unique exercise names
            const uniqueExercises = new Set(
                sets.map((set) => set.exerciseName)
            );
            const exerciseCount = uniqueExercises.size;

            // Calculate total volume if not already present
            let totalVolume = session.totalVolume;
            if (totalVolume === undefined) {
                totalVolume = 0;
                for (const set of sets) {
                    if (set.completed && set.weight && set.reps) {
                        let weightInKg = set.weight;
                        // Convert to kg if needed
                        if (set.weightUnit === "lbs") {
                            weightInKg = set.weight * 0.453592;
                        }
                        totalVolume += weightInKg * set.reps;
                    }
                }
            }

            // Update the session with denormalized fields
            await ctx.db.patch(session._id, {
                completedSets,
                totalSets,
                exerciseCount,
                totalVolume,
            });

            console.log(
                `Updated session ${session._id}: ${completedSets}/${totalSets} sets, ${exerciseCount} exercises, volume: ${totalVolume}`
            );
        }

        console.log("Denormalized fields migration completed");
        return null;
    },
});
