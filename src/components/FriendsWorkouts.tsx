import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ChevronDown, ChevronRight } from "lucide-react";

export function FriendsWorkouts() {
    const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
    const friendsWorkouts = useQuery(api.social.getFriendsPublicWorkouts);
    const shareWorkout = useMutation(api.social.shareWorkout);

    const handleCopyWorkout = async (
        workoutId: Id<"workouts">,
        friendUserId: Id<"users">
    ) => {
        try {
            await shareWorkout({ workoutId, friendUserId });
            alert("Workout shared successfully!");
        } catch (error) {
            alert("Failed to share workout: " + (error as Error).message);
        }
    };

    const toggleExpanded = (workoutId: string) => {
        setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId);
    };

    if (friendsWorkouts === undefined) {
        return (
            <div className="text-center text-text-secondary">Loading...</div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-text-primary">
                Friends' Public Workouts
            </h2>

            {friendsWorkouts.length === 0 ? (
                <div className="text-center text-text-secondary py-8">
                    <p>No public workouts from friends</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {friendsWorkouts.map((workout) => {
                        const isExpanded = expandedWorkout === workout._id;
                        const totalSets = workout.exercises.reduce(
                            (sum, ex) => sum + ex.targetSets,
                            0
                        );

                        return (
                            <div
                                key={workout._id}
                                className="bg-background-primary rounded-lg border border-accent-primary/20"
                            >
                                {/* Compact Header */}
                                <div className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium text-text-primary truncate">
                                                    {workout.name}
                                                </h3>
                                                <span className="inline-block px-2 py-1 text-xs rounded bg-accent-secondary text-white">
                                                    Public
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-text-secondary">
                                                <span>
                                                    By{" "}
                                                    {workout.userName ||
                                                        "Unknown User"}
                                                </span>
                                                <span>
                                                    {workout.exercises.length}{" "}
                                                    exercises
                                                </span>
                                                <span>
                                                    {totalSets} total sets
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 ml-4">
                                            <button
                                                onClick={() => {
                                                    void handleCopyWorkout(
                                                        workout._id,
                                                        workout.userId
                                                    );
                                                }}
                                                className="px-3 py-1 bg-accent-secondary text-white rounded text-sm hover:bg-accent-secondary/90 transition-colors"
                                            >
                                                Copy
                                            </button>
                                            <button
                                                onClick={() =>
                                                    toggleExpanded(workout._id)
                                                }
                                                className="p-1 text-text-secondary hover:text-text-primary transition-colors"
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="border-t border-accent-primary/20 p-4 bg-background-secondary">
                                        {workout.description && (
                                            <p className="text-sm text-text-secondary mb-3">
                                                {workout.description}
                                            </p>
                                        )}
                                        <div className="space-y-1">
                                            {workout.exercises.map(
                                                (exercise, index) => (
                                                    <div
                                                        key={index}
                                                        className="text-sm text-text-secondary bg-background-primary rounded p-2"
                                                    >
                                                        <span className="font-medium">
                                                            {exercise.name}
                                                        </span>
                                                        <span className="ml-2">
                                                            {
                                                                exercise.targetSets
                                                            }{" "}
                                                            sets
                                                            {exercise.targetReps &&
                                                                ` × ${exercise.targetReps} reps`}
                                                            {exercise.targetWeight &&
                                                                ` @ ${exercise.targetWeight}kg`}
                                                        </span>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
