import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all workouts for the current user
export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        return await ctx.db
            .query("workouts")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
    },
});

// Create a new workout template
export const create = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        exercises: v.array(
            v.object({
                name: v.string(),
                targetSets: v.number(),
                targetReps: v.optional(v.number()),
                targetWeight: v.optional(v.number()),
                targetWeightUnit: v.optional(
                    v.union(v.literal("kg"), v.literal("lbs"))
                ),
                restTime: v.optional(v.number()),
            })
        ),
        isPublic: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        return await ctx.db.insert("workouts", {
            ...args,
            userId,
            updatedAt: Date.now(),
            isPublic: args.isPublic ?? false,
        });
    },
});

// Update a workout template
export const update = mutation({
    args: {
        id: v.id("workouts"),
        name: v.string(),
        description: v.optional(v.string()),
        exercises: v.array(
            v.object({
                name: v.string(),
                targetSets: v.number(),
                targetReps: v.optional(v.number()),
                targetWeight: v.optional(v.number()),
                targetWeightUnit: v.optional(
                    v.union(v.literal("kg"), v.literal("lbs"))
                ),
                restTime: v.optional(v.number()),
            })
        ),
        isPublic: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const workout = await ctx.db.get(args.id);
        if (!workout || workout.userId !== userId) {
            throw new Error("Workout not found or not authorized");
        }

        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
            isPublic: updates.isPublic ?? false,
        });
    },
});

// Delete a workout template
export const remove = mutation({
    args: { id: v.id("workouts") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const workout = await ctx.db.get(args.id);
        if (!workout || workout.userId !== userId) {
            throw new Error("Workout not found or not authorized");
        }

        await ctx.db.delete(args.id);
    },
});

// Get public workouts from friends
export const getFriendsPublicWorkouts = query({
    args: {},
    returns: v.array(
        v.object({
            _id: v.id("workouts"),
            name: v.string(),
            description: v.optional(v.string()),
            exercises: v.array(
                v.object({
                    name: v.string(),
                    targetSets: v.number(),
                    targetReps: v.optional(v.number()),
                    targetWeight: v.optional(v.number()),
                    restTime: v.optional(v.number()),
                })
            ),
            userId: v.id("users"),
            userName: v.optional(v.string()),
            userEmail: v.optional(v.string()),
        })
    ),
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        // Get user's friends
        const friendships1 = await ctx.db
            .query("friendships")
            .withIndex("by_user1", (q) => q.eq("user1Id", userId))
            .collect();

        const friendships2 = await ctx.db
            .query("friendships")
            .withIndex("by_user2", (q) => q.eq("user2Id", userId))
            .collect();

        const friendIds = [
            ...friendships1.map((f) => f.user2Id),
            ...friendships2.map((f) => f.user1Id),
        ];

        if (friendIds.length === 0) {
            return [];
        }

        // Get public workouts from friends
        const publicWorkouts = await ctx.db
            .query("workouts")
            .filter((q) =>
                q.and(
                    q.eq(q.field("isPublic"), true),
                    q.or(...friendIds.map((id) => q.eq(q.field("userId"), id)))
                )
            )
            .collect();

        // Add user data to workouts and filter to only expected fields
        const workoutsWithUserData = await Promise.all(
            publicWorkouts.map(async (workout) => {
                const user = await ctx.db.get(workout.userId);
                return {
                    _id: workout._id,
                    name: workout.name,
                    description: workout.description,
                    exercises: workout.exercises,
                    userId: workout.userId,
                    userName: user?.name,
                    userEmail: user?.email,
                };
            })
        );

        return workoutsWithUserData;
    },
});
