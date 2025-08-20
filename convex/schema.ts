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
                targetWeightUnit: v.optional(
                    v.union(v.literal("kg"), v.literal("lbs"))
                ),
                isBodyweight: v.optional(v.boolean()),
                restTime: v.optional(v.number()),
            })
        ),

        // offline/sync metadata
        clientId: v.optional(v.string()),
        updatedAt: v.number(),
        deletedAt: v.optional(v.number()),

        // social features
        isPublic: v.optional(v.boolean()),
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
        totalVolume: v.optional(v.number()), // Total volume in kg
        completedSets: v.optional(v.number()), // Denormalized: count of completed sets
        totalSets: v.optional(v.number()), // Denormalized: total sets in workout
        exerciseCount: v.optional(v.number()), // Denormalized: number of exercises

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
        weightUnit: v.optional(v.union(v.literal("kg"), v.literal("lbs"))),
        isBodyweight: v.optional(v.boolean()),
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

    // Friend requests
    friendRequests: defineTable({
        fromUserId: v.id("users"),
        toUserId: v.id("users"),
        status: v.union(
            v.literal("pending"),
            v.literal("accepted"),
            v.literal("rejected")
        ),
        createdAt: v.number(),
    })
        .index("by_from_user", ["fromUserId"])
        .index("by_to_user", ["toUserId"])
        .index("by_from_and_to_user", ["fromUserId", "toUserId"])
        .index("by_to_user_and_status", ["toUserId", "status"]),

    // Friendships (for easier querying)
    friendships: defineTable({
        user1Id: v.id("users"),
        user2Id: v.id("users"),
        createdAt: v.number(),
    })
        .index("by_user1", ["user1Id"])
        .index("by_user2", ["user2Id"])
        .index("by_user1_and_user2", ["user1Id", "user2Id"]),

    // Shared workout plans
    sharedWorkouts: defineTable({
        originalWorkoutId: v.id("workouts"),
        sharedByUserId: v.id("users"),
        sharedWithUserId: v.id("users"),
        sharedAt: v.number(),
        status: v.union(
            v.literal("pending"),
            v.literal("accepted"),
            v.literal("rejected")
        ),
    })
        .index("by_shared_by", ["sharedByUserId"])
        .index("by_shared_with", ["sharedWithUserId"])
        .index("by_shared_with_and_status", ["sharedWithUserId", "status"]),

    // Body weight measurements
    bodyWeights: defineTable({
        sessionId: v.id("sessions"),
        userId: v.id("users"),
        weight: v.number(),
        weightUnit: v.union(v.literal("kg"), v.literal("lbs")),
        measuredAt: v.number(),

        // offline/sync metadata
        clientId: v.optional(v.string()),
        updatedAt: v.number(),
        deletedAt: v.optional(v.number()),
    })
        .index("by_session", ["sessionId"])
        .index("by_user", ["userId"])
        .index("by_user_and_date", ["userId", "measuredAt"])
        .index("by_clientId", ["clientId"]),
};

export default defineSchema({
    ...authTables,
    ...applicationTables,
});
