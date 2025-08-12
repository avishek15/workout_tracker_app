import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { X, Calendar, TrendingUp, Dumbbell, Clock } from "lucide-react";

interface FriendProfileProps {
    friendUserId: Id<"users">;
    onClose: () => void;
}

export function FriendProfile({ friendUserId, onClose }: FriendProfileProps) {
    const profile = useQuery(api.social.getFriendProfile, { friendUserId });

    if (!profile) {
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-background-secondary rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
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
                            <h2 className="text-2xl font-bold text-text-primary">
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
                        className="p-2 hover:bg-background-primary rounded-lg transition-colors"
                    >
                        <X className="w-6 h-6 text-text-secondary" />
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Favorite Exercises */}
                    <div className="bg-background-primary rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
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

                    {/* Recent Activity */}
                    <div className="bg-background-primary rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            Recent Activity
                        </h3>
                        {profile.recentSessions.length > 0 ? (
                            <div className="space-y-3">
                                {profile.recentSessions
                                    .slice(0, 5)
                                    .map((session) => (
                                        <div
                                            key={session._id}
                                            className="flex justify-between items-center p-3 bg-background-secondary rounded-lg"
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
                                            <div className="text-right">
                                                <div className="text-sm font-medium text-accent-primary">
                                                    {session.totalSets} sets
                                                </div>
                                                <div className="text-xs text-text-secondary">
                                                    {session.status}
                                                </div>
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
                </div>

                {/* Public Workouts */}
                {profile.publicWorkouts.length > 0 && (
                    <div className="mt-6 bg-background-primary rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-text-primary mb-4">
                            Public Workout Plans
                        </h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            {profile.publicWorkouts.map((workout) => (
                                <div
                                    key={workout._id}
                                    className="p-4 bg-background-secondary rounded-lg"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-medium text-text-primary">
                                                {workout.name}
                                            </h4>
                                            {workout.description && (
                                                <p className="text-sm text-text-secondary mt-1">
                                                    {workout.description}
                                                </p>
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
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
