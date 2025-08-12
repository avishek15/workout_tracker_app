import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { X, Calendar, Target, TrendingUp, Dumbbell, Users } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface FriendProfileProps {
    friendUserId: Id<"users">;
    onClose: () => void;
}

export function FriendProfile({ friendUserId, onClose }: FriendProfileProps) {
    const profile = useQuery(api.social.getFriendProfile, { friendUserId });

    if (profile === undefined) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-background-secondary rounded-lg p-6 max-w-2xl w-full mx-4">
                    <div className="text-center text-text-secondary">
                        Loading...
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-background-secondary rounded-lg p-6 max-w-2xl w-full mx-4">
                    <div className="text-center text-text-secondary">
                        Profile not found
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-background-secondary rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-background-secondary border-b border-accent-primary/20 p-6">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-4">
                            {profile.image ? (
                                <img
                                    src={profile.image}
                                    alt={profile.name || "Friend"}
                                    className="w-16 h-16 rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-medium text-xl">
                                    {(profile.name || profile.email || "F")
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>
                            )}
                            <div>
                                <h2 className="text-2xl font-bold text-text-primary font-montserrat">
                                    {profile.name || "Unknown User"}
                                </h2>
                                <p className="text-text-secondary">
                                    {profile.email}
                                </p>
                                <p className="text-sm text-text-secondary">
                                    Member since{" "}
                                    {new Date(
                                        profile.joinDate
                                    ).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-text-secondary hover:text-text-primary p-2"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Activity Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-background-primary rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-accent-primary">
                                {profile.totalWorkouts}
                            </div>
                            <div className="text-sm text-text-secondary">
                                Total Workouts
                            </div>
                        </div>
                        <div className="bg-background-primary rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-accent-primary">
                                {profile.currentStreak}
                            </div>
                            <div className="text-sm text-text-secondary">
                                Day Streak
                            </div>
                        </div>
                        <div className="bg-background-primary rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-accent-primary">
                                {profile.averageWorkoutsPerWeek}
                            </div>
                            <div className="text-sm text-text-secondary">
                                Avg/Week
                            </div>
                        </div>
                        <div className="bg-background-primary rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-accent-primary">
                                {profile.publicWorkouts.length}
                            </div>
                            <div className="text-sm text-text-secondary">
                                Public Plans
                            </div>
                        </div>
                    </div>

                    {/* Favorite Exercises */}
                    {profile.favoriteExercises.length > 0 && (
                        <div className="bg-background-primary rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                                <Dumbbell className="w-5 h-5" />
                                Favorite Exercises
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.favoriteExercises.map(
                                    (exercise, index) => (
                                        <span
                                            key={index}
                                            className="px-3 py-1 bg-accent-secondary text-white rounded-full text-sm"
                                        >
                                            {exercise}
                                        </span>
                                    )
                                )}
                            </div>
                        </div>
                    )}

                    {/* Recent Activity */}
                    <div className="bg-background-primary rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Recent Activity
                        </h3>
                        {profile.recentSessions.length > 0 ? (
                            <div className="space-y-2">
                                {profile.recentSessions.map((session) => (
                                    <div
                                        key={session._id}
                                        className="flex justify-between items-center p-2 bg-background-secondary rounded"
                                    >
                                        <div>
                                            <div className="font-medium text-text-primary">
                                                {session.workoutName}
                                            </div>
                                            <div className="text-sm text-text-secondary">
                                                {new Date(
                                                    session.startTime
                                                ).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="text-sm text-text-secondary">
                                            {session.totalSets} sets
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-text-secondary">
                                No recent activity
                            </p>
                        )}
                    </div>

                    {/* Public Workouts */}
                    {profile.publicWorkouts.length > 0 && (
                        <div className="bg-background-primary rounded-lg p-4">
                            <h3 className="text-lg font-semibold text-text-primary mb-3 flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                Public Workout Plans
                            </h3>
                            <div className="space-y-2">
                                {profile.publicWorkouts.map((workout) => (
                                    <div
                                        key={workout._id}
                                        className="flex justify-between items-center p-2 bg-background-secondary rounded"
                                    >
                                        <div>
                                            <div className="font-medium text-text-primary">
                                                {workout.name}
                                            </div>
                                            {workout.description && (
                                                <div className="text-sm text-text-secondary">
                                                    {workout.description}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-sm text-text-secondary text-right">
                                            <div>
                                                {workout.exerciseCount}{" "}
                                                exercises
                                            </div>
                                            <div>
                                                {workout.totalSets} total sets
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
