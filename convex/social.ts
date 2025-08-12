import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
// import type { Id } from "./_generated/dataModel";

// Send friend request
export const sendFriendRequest = mutation({
    args: { toUserId: v.id("users") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const fromUserId = await getAuthUserId(ctx);
        if (!fromUserId) {
            throw new Error("Not authenticated");
        }

        if (fromUserId === args.toUserId) {
            throw new Error("Cannot send friend request to yourself");
        }

        // Check if friend request already exists
        const existingRequest = await ctx.db
            .query("friendRequests")
            .withIndex("by_from_and_to_user", (q) =>
                q.eq("fromUserId", fromUserId).eq("toUserId", args.toUserId)
            )
            .unique();

        if (existingRequest) {
            throw new Error("Friend request already sent");
        }

        // Check if already friends
        const existingFriendship = await ctx.db
            .query("friendships")
            .withIndex("by_user1_and_user2", (q) =>
                q.eq("user1Id", fromUserId).eq("user2Id", args.toUserId)
            )
            .unique();

        if (!existingFriendship) {
            const reverseFriendship = await ctx.db
                .query("friendships")
                .withIndex("by_user1_and_user2", (q) =>
                    q.eq("user1Id", args.toUserId).eq("user2Id", fromUserId)
                )
                .unique();

            if (reverseFriendship) {
                throw new Error("Already friends");
            }
        } else {
            throw new Error("Already friends");
        }

        await ctx.db.insert("friendRequests", {
            fromUserId,
            toUserId: args.toUserId,
            status: "pending",
            createdAt: Date.now(),
        });

        return null;
    },
});

// Accept friend request
export const acceptFriendRequest = mutation({
    args: { requestId: v.id("friendRequests") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const request = await ctx.db.get(args.requestId);
        if (!request || request.toUserId !== userId) {
            throw new Error("Friend request not found or not authorized");
        }

        if (request.status !== "pending") {
            throw new Error("Friend request already processed");
        }

        // Update request status
        await ctx.db.patch(args.requestId, { status: "accepted" });

        // Create friendship
        await ctx.db.insert("friendships", {
            user1Id: request.fromUserId,
            user2Id: request.toUserId,
            createdAt: Date.now(),
        });

        return null;
    },
});

// Reject friend request
export const rejectFriendRequest = mutation({
    args: { requestId: v.id("friendRequests") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const request = await ctx.db.get(args.requestId);
        if (!request || request.toUserId !== userId) {
            throw new Error("Friend request not found or not authorized");
        }

        if (request.status !== "pending") {
            throw new Error("Friend request already processed");
        }

        await ctx.db.patch(args.requestId, { status: "rejected" });

        return null;
    },
});

// Get pending friend requests
export const getPendingFriendRequests = query({
    args: {},
    returns: v.array(
        v.object({
            _id: v.id("friendRequests"),
            fromUserId: v.id("users"),
            fromUserName: v.optional(v.string()),
            fromUserEmail: v.optional(v.string()),
            createdAt: v.number(),
        })
    ),
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        const requests = await ctx.db
            .query("friendRequests")
            .withIndex("by_to_user_and_status", (q) =>
                q.eq("toUserId", userId).eq("status", "pending")
            )
            .collect();

        const requestsWithUserData = await Promise.all(
            requests.map(async (request) => {
                const fromUser = await ctx.db.get(request.fromUserId);
                return {
                    _id: request._id,
                    fromUserId: request.fromUserId,
                    fromUserName: fromUser?.name,
                    fromUserEmail: fromUser?.email,
                    createdAt: request.createdAt,
                };
            })
        );

        return requestsWithUserData;
    },
});

// Get sent friend requests
export const getSentFriendRequests = query({
    args: {},
    returns: v.array(
        v.object({
            _id: v.id("friendRequests"),
            toUserId: v.id("users"),
            toUserName: v.optional(v.string()),
            toUserEmail: v.optional(v.string()),
            status: v.union(
                v.literal("pending"),
                v.literal("accepted"),
                v.literal("rejected")
            ),
            createdAt: v.number(),
        })
    ),
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        const requests = await ctx.db
            .query("friendRequests")
            .withIndex("by_from_user", (q) => q.eq("fromUserId", userId))
            .collect();

        const requestsWithUserData = await Promise.all(
            requests.map(async (request) => {
                const toUser = await ctx.db.get(request.toUserId);
                return {
                    _id: request._id,
                    toUserId: request.toUserId,
                    toUserName: toUser?.name,
                    toUserEmail: toUser?.email,
                    status: request.status,
                    createdAt: request.createdAt,
                };
            })
        );

        return requestsWithUserData;
    },
});

// Get friends list
export const getFriends = query({
    args: {},
    returns: v.array(
        v.object({
            userId: v.id("users"),
            name: v.optional(v.string()),
            email: v.optional(v.string()),
            image: v.optional(v.string()),
        })
    ),
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        // Get friendships where user is user1
        const friendships1 = await ctx.db
            .query("friendships")
            .withIndex("by_user1", (q) => q.eq("user1Id", userId))
            .collect();

        // Get friendships where user is user2
        const friendships2 = await ctx.db
            .query("friendships")
            .withIndex("by_user2", (q) => q.eq("user2Id", userId))
            .collect();

        const friendIds = [
            ...friendships1.map((f) => f.user2Id),
            ...friendships2.map((f) => f.user1Id),
        ];

        const friends = await Promise.all(
            friendIds.map(async (friendId) => {
                const user = await ctx.db.get(friendId);
                let imageUrl: string | undefined;

                // Handle image field - could be storage ID or URL
                if (user?.image) {
                    if (user.image.startsWith("http")) {
                        // It's already a URL
                        imageUrl = user.image;
                    } else {
                        // It's a storage ID, convert to URL
                        try {
                            const url = await ctx.storage.getUrl(
                                user.image as any
                            );
                            imageUrl = url || undefined;
                        } catch (error) {
                            console.error("Failed to get image URL:", error);
                            imageUrl = undefined;
                        }
                    }
                }

                return {
                    userId: friendId,
                    name: user?.name,
                    email: user?.email,
                    image: imageUrl,
                };
            })
        );

        return friends;
    },
});

// Search users by email or name
export const searchUsers = query({
    args: { query: v.string() },
    returns: v.array(
        v.object({
            _id: v.id("users"),
            name: v.optional(v.string()),
            email: v.optional(v.string()),
            image: v.optional(v.string()),
        })
    ),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        if (args.query.length < 2) {
            return [];
        }

        // Get all users and filter by query
        const allUsers = await ctx.db.query("users").collect();

        const filteredUsers = allUsers.filter((user) => {
            if (user._id === userId) return false; // Exclude self

            const nameMatch = user.name
                ?.toLowerCase()
                .includes(args.query.toLowerCase());
            const emailMatch = user.email
                ?.toLowerCase()
                .includes(args.query.toLowerCase());

            return nameMatch || emailMatch;
        });

        // Return only the fields specified in the validator
        return filteredUsers.slice(0, 10).map((user) => ({
            _id: user._id,
            name: user.name,
            email: user.email,
            image: user.image,
        }));
    },
});

// Share workout with friend
export const shareWorkout = mutation({
    args: {
        workoutId: v.id("workouts"),
        friendUserId: v.id("users"),
    },
    returns: v.null(),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        // Verify workout belongs to user
        const workout = await ctx.db.get(args.workoutId);
        if (!workout || workout.userId !== userId) {
            throw new Error("Workout not found or not authorized");
        }

        // Verify friendship exists
        const friendship1 = await ctx.db
            .query("friendships")
            .withIndex("by_user1_and_user2", (q) =>
                q.eq("user1Id", userId).eq("user2Id", args.friendUserId)
            )
            .unique();

        const friendship2 = await ctx.db
            .query("friendships")
            .withIndex("by_user1_and_user2", (q) =>
                q.eq("user1Id", args.friendUserId).eq("user2Id", userId)
            )
            .unique();

        if (!friendship1 && !friendship2) {
            throw new Error("Can only share with friends");
        }

        // Check if already shared
        const existingShare = await ctx.db
            .query("sharedWorkouts")
            .withIndex("by_shared_by", (q) => q.eq("sharedByUserId", userId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("originalWorkoutId"), args.workoutId),
                    q.eq(q.field("sharedWithUserId"), args.friendUserId)
                )
            )
            .unique();

        if (existingShare) {
            throw new Error("Workout already shared with this friend");
        }

        await ctx.db.insert("sharedWorkouts", {
            originalWorkoutId: args.workoutId,
            sharedByUserId: userId,
            sharedWithUserId: args.friendUserId,
            sharedAt: Date.now(),
            status: "pending",
        });

        return null;
    },
});

// Get shared workouts (received)
export const getSharedWorkouts = query({
    args: {},
    returns: v.array(
        v.object({
            _id: v.id("sharedWorkouts"),
            originalWorkoutId: v.id("workouts"),
            sharedByUserId: v.id("users"),
            sharedByUserName: v.optional(v.string()),
            workout: v.object({
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
            }),
            sharedAt: v.number(),
            status: v.union(
                v.literal("pending"),
                v.literal("accepted"),
                v.literal("rejected")
            ),
        })
    ),
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return [];
        }

        const sharedWorkouts = await ctx.db
            .query("sharedWorkouts")
            .withIndex("by_shared_with", (q) =>
                q.eq("sharedWithUserId", userId)
            )
            .collect();

        const sharedWorkoutsWithData = await Promise.all(
            sharedWorkouts.map(async (shared) => {
                const workout = await ctx.db.get(shared.originalWorkoutId);
                const sharedByUser = await ctx.db.get(shared.sharedByUserId);

                return {
                    _id: shared._id,
                    originalWorkoutId: shared.originalWorkoutId,
                    sharedByUserId: shared.sharedByUserId,
                    sharedByUserName: sharedByUser?.name,
                    workout: {
                        name: workout?.name || "",
                        description: workout?.description,
                        exercises: workout?.exercises || [],
                    },
                    sharedAt: shared.sharedAt,
                    status: shared.status,
                };
            })
        );

        return sharedWorkoutsWithData;
    },
});

// Accept shared workout (copy to user's workouts)
export const acceptSharedWorkout = mutation({
    args: { sharedWorkoutId: v.id("sharedWorkouts") },
    returns: v.id("workouts"),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const sharedWorkout = await ctx.db.get(args.sharedWorkoutId);
        if (!sharedWorkout || sharedWorkout.sharedWithUserId !== userId) {
            throw new Error("Shared workout not found or not authorized");
        }

        if (sharedWorkout.status !== "pending") {
            throw new Error("Shared workout already processed");
        }

        // Get the original workout
        const originalWorkout = await ctx.db.get(
            sharedWorkout.originalWorkoutId
        );
        if (!originalWorkout) {
            throw new Error("Original workout not found");
        }

        // Get the user who shared the workout
        const sharedByUser = await ctx.db.get(sharedWorkout.sharedByUserId);
        const sharedByFirstName = sharedByUser?.name?.split(" ")[0] || "Friend";

        // Copy workout to user's workouts with a cleaner name
        const newWorkoutId = await ctx.db.insert("workouts", {
            name: `${originalWorkout.name} (Shared by ${sharedByFirstName})`,
            description: originalWorkout.description,
            userId,
            exercises: originalWorkout.exercises,
            updatedAt: Date.now(),
        });

        // Update shared workout status
        await ctx.db.patch(args.sharedWorkoutId, { status: "accepted" });

        return newWorkoutId;
    },
});

// Reject shared workout
export const rejectSharedWorkout = mutation({
    args: { sharedWorkoutId: v.id("sharedWorkouts") },
    returns: v.null(),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        const sharedWorkout = await ctx.db.get(args.sharedWorkoutId);
        if (!sharedWorkout || sharedWorkout.sharedWithUserId !== userId) {
            throw new Error("Shared workout not found or not authorized");
        }

        if (sharedWorkout.status !== "pending") {
            throw new Error("Shared workout already processed");
        }

        await ctx.db.patch(args.sharedWorkoutId, { status: "rejected" });

        return null;
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
