import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
    userProfiles: defineTable({
        userId: v.id("users"),
        bio: v.optional(v.string()),
    }).index("by_user", ["userId"]),

    workouts: defineTable({
        name: v.string(),
        description: v.optional(v.string()),
        userId: v.id("users"),

        exercises: v.array(
            v.object({
                name: v.string(),
                targetSets: v.number(),
                targetReps: v.optional(v.number()),
                targetWeight: v.optional(v.number()),
                restTime: v.optional(v.number()),
            })
        ),

        // offline/sync metadata
        clientId: v.optional(v.string()),
        updatedAt: v.number(),
        deletedAt: v.optional(v.number()),
    })
        .index("by_user", ["userId"])
        .index("by_user_and_updatedAt", ["userId", "updatedAt"])
        .index("by_clientId", ["clientId"]),

    sessions: defineTable({
        workoutId: v.id("workouts"),
        userId: v.id("users"),
        startTime: v.number(),
        endTime: v.optional(v.number()),
        status: v.union(
            v.literal("active"),
            v.literal("completed"),
            v.literal("cancelled")
        ),
        notes: v.optional(v.string()),

        // offline/sync metadata
        clientId: v.optional(v.string()),
        updatedAt: v.number(),
        deletedAt: v.optional(v.number()),
    })
        .index("by_user", ["userId"])
        .index("by_user_and_status", ["userId", "status"])
        .index("by_user_and_updatedAt", ["userId", "updatedAt"])
        .index("by_clientId", ["clientId"]),

    sets: defineTable({
        sessionId: v.id("sessions"),
        exerciseName: v.string(),
        setNumber: v.number(),
        reps: v.number(),
        weight: v.optional(v.number()),
        completed: v.boolean(),
        completedAt: v.optional(v.number()),

        // offline/sync metadata
        clientId: v.optional(v.string()),
        updatedAt: v.number(),
        deletedAt: v.optional(v.number()),
    })
        .index("by_session", ["sessionId"])
        .index("by_session_and_exercise", ["sessionId", "exerciseName"])
        .index("by_session_and_updatedAt", ["sessionId", "updatedAt"])
        .index("by_clientId", ["clientId"]),
};

export default defineSchema({
    ...authTables,
    ...applicationTables,
});
