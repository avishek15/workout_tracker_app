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

        // Check if already friends (check both directions)
        const friendship1 = await ctx.db
            .query("friendships")
            .withIndex("by_user1_and_user2", (q) =>
                q.eq("user1Id", fromUserId).eq("user2Id", args.toUserId)
            )
            .unique();

        const friendship2 = await ctx.db
            .query("friendships")
            .withIndex("by_user1_and_user2", (q) =>
                q.eq("user1Id", args.toUserId).eq("user2Id", fromUserId)
            )
            .unique();

        if (friendship1 || friendship2) {
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

        if (friendIds.length === 0) {
            return [];
        }

        // Batch fetch all friend data
        const friends = await Promise.all(
            friendIds.map((id) => ctx.db.get(id))
        );

        // Batch fetch all image URLs
        const imageIds = friends
            .filter((user) => user?.image && !user.image.startsWith("http"))
            .map((user) => user!.image);

        const imageUrls = await Promise.all(
            imageIds.map(async (imageId) => {
                try {
                    return await ctx.storage.getUrl(imageId as any);
                } catch (error) {
                    console.error("Failed to get image URL:", error);
                    return null;
                }
            })
        );

        // Create image URL map
        const imageUrlMap = new Map();
        imageIds.forEach((imageId, index) => {
            imageUrlMap.set(imageId, imageUrls[index]);
        });

        // Combine data efficiently
        const friendsWithData = friends
            .filter((user) => user) // Filter out null users
            .map((user) => {
                let imageUrl: string | undefined;

                if (user!.image) {
                    if (user!.image.startsWith("http")) {
                        imageUrl = user!.image;
                    } else {
                        imageUrl = imageUrlMap.get(user!.image) || undefined;
                    }
                }

                return {
                    userId: user!._id,
                    name: user!.name,
                    email: user!.email,
                    image: imageUrl,
                };
            });

        return friendsWithData;
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

        const limitedUsers = filteredUsers.slice(0, 10);

        if (limitedUsers.length === 0) {
            return [];
        }

        // Batch fetch all image URLs
        const imageIds = limitedUsers
            .filter((user) => user.image && !user.image.startsWith("http"))
            .map((user) => user.image!);

        const imageUrls = await Promise.all(
            imageIds.map(async (imageId) => {
                try {
                    return await ctx.storage.getUrl(imageId as any);
                } catch (error) {
                    console.error("Failed to get image URL:", error);
                    return null;
                }
            })
        );

        // Create image URL map
        const imageUrlMap = new Map();
        imageIds.forEach((imageId, index) => {
            imageUrlMap.set(imageId, imageUrls[index]);
        });

        // Combine data efficiently
        const usersWithImageUrls = limitedUsers.map((user) => {
            let imageUrl: string | undefined;

            if (user.image) {
                if (user.image.startsWith("http")) {
                    imageUrl = user.image;
                } else {
                    imageUrl = imageUrlMap.get(user.image) || undefined;
                }
            }

            return {
                _id: user._id,
                name: user.name,
                email: user.email,
                image: imageUrl,
            };
        });

        return usersWithImageUrls;
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

        if (sharedWorkouts.length === 0) {
            return [];
        }

        // Batch fetch all workout and user data
        const workoutIds = [
            ...new Set(sharedWorkouts.map((s) => s.originalWorkoutId)),
        ];
        const userIds = [
            ...new Set(sharedWorkouts.map((s) => s.sharedByUserId)),
        ];

        const [workouts, users] = await Promise.all([
            Promise.all(workoutIds.map((id) => ctx.db.get(id))),
            Promise.all(userIds.map((id) => ctx.db.get(id))),
        ]);

        // Create maps for quick lookup
        const workoutMap = new Map();
        workouts.forEach((workout) => {
            if (workout) {
                workoutMap.set(workout._id, workout);
            }
        });

        const userMap = new Map();
        users.forEach((user) => {
            if (user) {
                userMap.set(user._id, user);
            }
        });

        // Combine data efficiently
        const sharedWorkoutsWithData = sharedWorkouts.map((shared) => {
            const workout = workoutMap.get(shared.originalWorkoutId);
            const sharedByUser = userMap.get(shared.sharedByUserId);

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
        });

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

        if (publicWorkouts.length === 0) {
            return [];
        }

        // Batch fetch all user data
        const userIds = [...new Set(publicWorkouts.map((w) => w.userId))];
        const users = await Promise.all(userIds.map((id) => ctx.db.get(id)));

        // Create user map for quick lookup
        const userMap = new Map();
        users.forEach((user) => {
            if (user) {
                userMap.set(user._id, user);
            }
        });

        // Combine data efficiently
        const workoutsWithUserData = publicWorkouts.map((workout) => {
            const user = userMap.get(workout.userId);
            return {
                _id: workout._id,
                name: workout.name,
                description: workout.description,
                exercises: workout.exercises,
                userId: workout.userId,
                userName: user?.name,
                userEmail: user?.email,
            };
        });

        return workoutsWithUserData;
    },
});

// Get detailed friend profile
export const getFriendProfile = query({
    args: { friendUserId: v.id("users") },
    returns: v.object({
        // Basic Info
        userId: v.id("users"),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
        image: v.optional(v.string()),
        joinDate: v.number(),

        // Activity Stats
        totalWorkouts: v.number(),
        currentStreak: v.number(),
        averageWorkoutsPerWeek: v.number(),
        favoriteExercises: v.array(v.string()),

        // Recent Activity
        recentSessions: v.array(
            v.object({
                _id: v.id("sessions"),
                workoutName: v.string(),
                startTime: v.number(),
                endTime: v.optional(v.number()),
                status: v.union(
                    v.literal("active"),
                    v.literal("completed"),
                    v.literal("cancelled")
                ),
                totalSets: v.number(),
            })
        ),

        // Public Workouts
        publicWorkouts: v.array(
            v.object({
                _id: v.id("workouts"),
                name: v.string(),
                description: v.optional(v.string()),
                exerciseCount: v.number(),
                totalSets: v.number(),
            })
        ),
    }),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        // Verify friendship
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
            throw new Error("Can only view friends' profiles");
        }

        // Get friend's basic info
        const friend = await ctx.db.get(args.friendUserId);
        if (!friend) {
            throw new Error("Friend not found");
        }

        // Handle image URL
        let imageUrl: string | undefined;
        if (friend.image) {
            if (friend.image.startsWith("http")) {
                imageUrl = friend.image;
            } else {
                try {
                    const url = await ctx.storage.getUrl(friend.image as any);
                    imageUrl = url || undefined;
                } catch (error) {
                    console.error("Failed to get image URL:", error);
                    imageUrl = undefined;
                }
            }
        }

        // Get friend's completed sessions
        const sessions = await ctx.db
            .query("sessions")
            .withIndex("by_user_and_status", (q) =>
                q.eq("userId", args.friendUserId).eq("status", "completed")
            )
            .order("desc")
            .collect();

        // Calculate activity stats
        const totalWorkouts = sessions.length;
        const currentStreak = calculateCurrentStreak(sessions);
        const averageWorkoutsPerWeek =
            calculateAverageWorkoutsPerWeek(sessions);
        const favoriteExercises = await getFavoriteExercises(
            ctx,
            args.friendUserId
        );

        // Get recent sessions (last 10)
        const recentSessions = await Promise.all(
            sessions.slice(0, 10).map(async (session) => {
                const workout = await ctx.db.get(session.workoutId);
                const sets = await ctx.db
                    .query("sets")
                    .withIndex("by_session", (q) =>
                        q.eq("sessionId", session._id)
                    )
                    .collect();

                return {
                    _id: session._id,
                    workoutName: workout?.name || "Unknown Workout",
                    startTime: session.startTime,
                    endTime: session.endTime,
                    status: session.status,
                    totalSets: sets.length,
                };
            })
        );

        // Get public workouts
        const publicWorkouts = await ctx.db
            .query("workouts")
            .withIndex("by_user", (q) => q.eq("userId", args.friendUserId))
            .filter((q) => q.eq(q.field("isPublic"), true))
            .collect();

        const publicWorkoutsWithStats = publicWorkouts.map((workout) => ({
            _id: workout._id,
            name: workout.name,
            description: workout.description,
            exerciseCount: workout.exercises.length,
            totalSets: workout.exercises.reduce(
                (sum, ex) => sum + ex.targetSets,
                0
            ),
        }));

        return {
            userId: args.friendUserId,
            name: friend.name,
            email: friend.email,
            image: imageUrl,
            joinDate: friend._creationTime,
            totalWorkouts,
            currentStreak,
            averageWorkoutsPerWeek,
            favoriteExercises,
            recentSessions,
            publicWorkouts: publicWorkoutsWithStats,
        };
    },
});

// Helper function to calculate current streak
function calculateCurrentStreak(sessions: any[]): number {
    if (sessions.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    const currentDate = new Date(today);

    for (let i = 0; i < 30; i++) {
        // Check last 30 days max
        const dayStart = currentDate.getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;

        const hasWorkout = sessions.some(
            (session) =>
                session.endTime &&
                session.endTime >= dayStart &&
                session.endTime < dayEnd
        );

        if (hasWorkout) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

// Helper function to calculate average workouts per week
function calculateAverageWorkoutsPerWeek(sessions: any[]): number {
    if (sessions.length === 0) return 0;

    const now = Date.now();
    const fourWeeksAgo = now - 4 * 7 * 24 * 60 * 60 * 1000;

    const recentSessions = sessions.filter(
        (session) => session.endTime && session.endTime >= fourWeeksAgo
    );

    return Math.round((recentSessions.length / 4) * 10) / 10; // Round to 1 decimal
}

// Helper function to get favorite exercises
async function getFavoriteExercises(
    ctx: any,
    userId: string
): Promise<string[]> {
    const sessions = await ctx.db
        .query("sessions")
        .withIndex("by_user_and_status", (q: any) =>
            q.eq("userId", userId).eq("status", "completed")
        )
        .collect();

    const exerciseCounts: Record<string, number> = {};

    for (const session of sessions.slice(0, 50)) {
        // Check last 50 sessions
        const sets = await ctx.db
            .query("sets")
            .withIndex("by_session", (q: any) => q.eq("sessionId", session._id))
            .collect();

        for (const set of sets) {
            exerciseCounts[set.exerciseName] =
                (exerciseCounts[set.exerciseName] || 0) + 1;
        }
    }

    // Return top 5 favorite exercises
    return Object.entries(exerciseCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([exercise]) => exercise);
}

// Calculate workout volume for a user over a time period
export const getUserVolumeStats = query({
    args: {
        userId: v.id("users"),
        timePeriod: v.union(
            v.literal("week"),
            v.literal("month"),
            v.literal("quarter"),
            v.literal("year")
        ),
    },
    returns: v.object({
        totalVolume: v.number(),
        totalWorkouts: v.number(),
        averageVolumePerWorkout: v.number(),
        volumeByExercise: v.array(
            v.object({
                exerciseName: v.string(),
                totalVolume: v.number(),
                totalSets: v.number(),
                averageWeight: v.number(),
            })
        ),
        volumeByWeek: v.array(
            v.object({
                weekStart: v.number(),
                totalVolume: v.number(),
                workoutCount: v.number(),
            })
        ),
    }),
    handler: async (ctx, args) => {
        const currentUserId = await getAuthUserId(ctx);
        if (!currentUserId) {
            throw new Error("Not authenticated");
        }

        // Calculate time range based on period
        const now = Date.now();
        let startTime: number;

        switch (args.timePeriod) {
            case "week":
                startTime = now - 7 * 24 * 60 * 60 * 1000;
                break;
            case "month":
                startTime = now - 30 * 24 * 60 * 60 * 1000;
                break;
            case "quarter":
                startTime = now - 90 * 24 * 60 * 60 * 1000;
                break;
            case "year":
                startTime = now - 365 * 24 * 60 * 60 * 1000;
                break;
        }

        // Get completed sessions in the time period
        const sessions = await ctx.db
            .query("sessions")
            .withIndex("by_user_and_status", (q) =>
                q.eq("userId", args.userId).eq("status", "completed")
            )
            .filter((q) =>
                q.and(
                    q.gte(q.field("endTime"), startTime),
                    q.lte(q.field("endTime"), now)
                )
            )
            .collect();

        let totalVolume = 0;
        const totalWorkouts = sessions.length;
        const exerciseVolumes: Record<
            string,
            { volume: number; sets: number; totalWeight: number }
        > = {};
        const weeklyVolumes: Record<
            string,
            { volume: number; workouts: number }
        > = {};

        // Calculate volume for each session
        for (const session of sessions) {
            const sets = await ctx.db
                .query("sets")
                .withIndex("by_session", (q) => q.eq("sessionId", session._id))
                .collect();

            let sessionVolume = 0;

            for (const set of sets) {
                if (set.completed && set.weight && set.reps) {
                    const setVolume = set.weight * set.reps;
                    sessionVolume += setVolume;

                    // Track by exercise
                    if (!exerciseVolumes[set.exerciseName]) {
                        exerciseVolumes[set.exerciseName] = {
                            volume: 0,
                            sets: 0,
                            totalWeight: 0,
                        };
                    }
                    exerciseVolumes[set.exerciseName].volume += setVolume;
                    exerciseVolumes[set.exerciseName].sets += 1;
                    exerciseVolumes[set.exerciseName].totalWeight += set.weight;
                }
            }

            totalVolume += sessionVolume;

            // Track by week
            const weekStart = new Date(session.endTime || session.startTime);
            weekStart.setHours(0, 0, 0, 0);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
            const weekKey = weekStart.getTime().toString();

            if (!weeklyVolumes[weekKey]) {
                weeklyVolumes[weekKey] = { volume: 0, workouts: 0 };
            }
            weeklyVolumes[weekKey].volume += sessionVolume;
            weeklyVolumes[weekKey].workouts += 1;
        }

        // Convert to arrays and sort
        const volumeByExercise = Object.entries(exerciseVolumes)
            .map(([exerciseName, data]) => ({
                exerciseName,
                totalVolume: data.volume,
                totalSets: data.sets,
                averageWeight: data.sets > 0 ? data.totalWeight / data.sets : 0,
            }))
            .sort((a, b) => b.totalVolume - a.totalVolume);

        const volumeByWeek = Object.entries(weeklyVolumes)
            .map(([weekStart, data]) => ({
                weekStart: parseInt(weekStart),
                totalVolume: data.volume,
                workoutCount: data.workouts,
            }))
            .sort((a, b) => a.weekStart - b.weekStart);

        return {
            totalVolume,
            totalWorkouts,
            averageVolumePerWorkout:
                totalWorkouts > 0 ? totalVolume / totalWorkouts : 0,
            volumeByExercise,
            volumeByWeek,
        };
    },
});

// Get current user's volume stats
export const getMyVolumeStats = query({
    args: {
        timePeriod: v.union(
            v.literal("week"),
            v.literal("month"),
            v.literal("quarter"),
            v.literal("year")
        ),
    },
    returns: v.object({
        totalVolume: v.number(),
        totalWorkouts: v.number(),
        averageVolumePerWorkout: v.number(),
        volumeByExercise: v.array(
            v.object({
                exerciseName: v.string(),
                totalVolume: v.number(),
                totalSets: v.number(),
                averageWeight: v.number(),
            })
        ),
        volumeByWeek: v.array(
            v.object({
                weekStart: v.number(),
                totalVolume: v.number(),
                workoutCount: v.number(),
            })
        ),
    }),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        // Reuse the same logic as getUserVolumeStats
        const now = Date.now();
        let startTime: number;

        switch (args.timePeriod) {
            case "week":
                startTime = now - 7 * 24 * 60 * 60 * 1000;
                break;
            case "month":
                startTime = now - 30 * 24 * 60 * 60 * 1000;
                break;
            case "quarter":
                startTime = now - 90 * 24 * 60 * 60 * 1000;
                break;
            case "year":
                startTime = now - 365 * 24 * 60 * 60 * 1000;
                break;
        }

        const sessions = await ctx.db
            .query("sessions")
            .withIndex("by_user_and_status", (q) =>
                q.eq("userId", userId).eq("status", "completed")
            )
            .filter((q) =>
                q.and(
                    q.gte(q.field("endTime"), startTime),
                    q.lte(q.field("endTime"), now)
                )
            )
            .collect();

        let totalVolume = 0;
        const totalWorkouts = sessions.length;
        const exerciseVolumes: Record<
            string,
            { volume: number; sets: number; totalWeight: number }
        > = {};
        const weeklyVolumes: Record<
            string,
            { volume: number; workouts: number }
        > = {};

        for (const session of sessions) {
            const sets = await ctx.db
                .query("sets")
                .withIndex("by_session", (q) => q.eq("sessionId", session._id))
                .collect();

            let sessionVolume = 0;

            for (const set of sets) {
                if (set.completed && set.weight && set.reps) {
                    const setVolume = set.weight * set.reps;
                    sessionVolume += setVolume;

                    if (!exerciseVolumes[set.exerciseName]) {
                        exerciseVolumes[set.exerciseName] = {
                            volume: 0,
                            sets: 0,
                            totalWeight: 0,
                        };
                    }
                    exerciseVolumes[set.exerciseName].volume += setVolume;
                    exerciseVolumes[set.exerciseName].sets += 1;
                    exerciseVolumes[set.exerciseName].totalWeight += set.weight;
                }
            }

            totalVolume += sessionVolume;

            const weekStart = new Date(session.endTime || session.startTime);
            weekStart.setHours(0, 0, 0, 0);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekKey = weekStart.getTime().toString();

            if (!weeklyVolumes[weekKey]) {
                weeklyVolumes[weekKey] = { volume: 0, workouts: 0 };
            }
            weeklyVolumes[weekKey].volume += sessionVolume;
            weeklyVolumes[weekKey].workouts += 1;
        }

        const volumeByExercise = Object.entries(exerciseVolumes)
            .map(([exerciseName, data]) => ({
                exerciseName,
                totalVolume: data.volume,
                totalSets: data.sets,
                averageWeight: data.sets > 0 ? data.totalWeight / data.sets : 0,
            }))
            .sort((a, b) => b.totalVolume - a.totalVolume);

        const volumeByWeek = Object.entries(weeklyVolumes)
            .map(([weekStart, data]) => ({
                weekStart: parseInt(weekStart),
                totalVolume: data.volume,
                workoutCount: data.workouts,
            }))
            .sort((a, b) => a.weekStart - b.weekStart);

        return {
            totalVolume,
            totalWorkouts,
            averageVolumePerWorkout:
                totalWorkouts > 0 ? totalVolume / totalWorkouts : 0,
            volumeByExercise,
            volumeByWeek,
        };
    },
});

// Get friend's volume stats for comparison
export const getFriendVolumeStats = query({
    args: {
        friendUserId: v.id("users"),
        timePeriod: v.union(
            v.literal("week"),
            v.literal("month"),
            v.literal("quarter"),
            v.literal("year")
        ),
    },
    returns: v.object({
        totalVolume: v.number(),
        totalWorkouts: v.number(),
        averageVolumePerWorkout: v.number(),
        volumeByExercise: v.array(
            v.object({
                exerciseName: v.string(),
                totalVolume: v.number(),
                totalSets: v.number(),
                averageWeight: v.number(),
            })
        ),
        volumeByWeek: v.array(
            v.object({
                weekStart: v.number(),
                totalVolume: v.number(),
                workoutCount: v.number(),
            })
        ),
    }),
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) {
            throw new Error("Not authenticated");
        }

        // Verify friendship
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
            throw new Error("Can only view friends' stats");
        }

        // Reuse the same logic as getUserVolumeStats but for friend
        const now = Date.now();
        let startTime: number;

        switch (args.timePeriod) {
            case "week":
                startTime = now - 7 * 24 * 60 * 60 * 1000;
                break;
            case "month":
                startTime = now - 30 * 24 * 60 * 60 * 1000;
                break;
            case "quarter":
                startTime = now - 90 * 24 * 60 * 60 * 1000;
                break;
            case "year":
                startTime = now - 365 * 24 * 60 * 60 * 1000;
                break;
        }

        const sessions = await ctx.db
            .query("sessions")
            .withIndex("by_user_and_status", (q) =>
                q.eq("userId", args.friendUserId).eq("status", "completed")
            )
            .filter((q) =>
                q.and(
                    q.gte(q.field("endTime"), startTime),
                    q.lte(q.field("endTime"), now)
                )
            )
            .collect();

        let totalVolume = 0;
        const totalWorkouts = sessions.length;
        const exerciseVolumes: Record<
            string,
            { volume: number; sets: number; totalWeight: number }
        > = {};
        const weeklyVolumes: Record<
            string,
            { volume: number; workouts: number }
        > = {};

        for (const session of sessions) {
            const sets = await ctx.db
                .query("sets")
                .withIndex("by_session", (q) => q.eq("sessionId", session._id))
                .collect();

            let sessionVolume = 0;

            for (const set of sets) {
                if (set.completed && set.weight && set.reps) {
                    const setVolume = set.weight * set.reps;
                    sessionVolume += setVolume;

                    if (!exerciseVolumes[set.exerciseName]) {
                        exerciseVolumes[set.exerciseName] = {
                            volume: 0,
                            sets: 0,
                            totalWeight: 0,
                        };
                    }
                    exerciseVolumes[set.exerciseName].volume += setVolume;
                    exerciseVolumes[set.exerciseName].sets += 1;
                    exerciseVolumes[set.exerciseName].totalWeight += set.weight;
                }
            }

            totalVolume += sessionVolume;

            const weekStart = new Date(session.endTime || session.startTime);
            weekStart.setHours(0, 0, 0, 0);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            const weekKey = weekStart.getTime().toString();

            if (!weeklyVolumes[weekKey]) {
                weeklyVolumes[weekKey] = { volume: 0, workouts: 0 };
            }
            weeklyVolumes[weekKey].volume += sessionVolume;
            weeklyVolumes[weekKey].workouts += 1;
        }

        const volumeByExercise = Object.entries(exerciseVolumes)
            .map(([exerciseName, data]) => ({
                exerciseName,
                totalVolume: data.volume,
                totalSets: data.sets,
                averageWeight: data.sets > 0 ? data.totalWeight / data.sets : 0,
            }))
            .sort((a, b) => b.totalVolume - a.totalVolume);

        const volumeByWeek = Object.entries(weeklyVolumes)
            .map(([weekStart, data]) => ({
                weekStart: parseInt(weekStart),
                totalVolume: data.volume,
                workoutCount: data.workouts,
            }))
            .sort((a, b) => a.weekStart - b.weekStart);

        return {
            totalVolume,
            totalWorkouts,
            averageVolumePerWorkout:
                totalWorkouts > 0 ? totalVolume / totalWorkouts : 0,
            volumeByExercise,
            volumeByWeek,
        };
    },
});
