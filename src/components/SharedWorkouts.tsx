import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { ChevronDown, ChevronRight } from "lucide-react";

export function SharedWorkouts() {
    const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
    const sharedWorkouts = useQuery(api.social.getSharedWorkouts);
    const acceptSharedWorkout = useMutation(api.social.acceptSharedWorkout);
    const rejectSharedWorkout = useMutation(api.social.rejectSharedWorkout);

    const handleAccept = async (sharedWorkoutId: Id<"sharedWorkouts">) => {
        try {
            await acceptSharedWorkout({ sharedWorkoutId });
            alert("Workout copied to your library!");
        } catch (error) {
            alert("Failed to accept workout: " + (error as Error).message);
        }
    };

    const handleReject = async (sharedWorkoutId: Id<"sharedWorkouts">) => {
        try {
            await rejectSharedWorkout({ sharedWorkoutId });
            alert("Workout rejected");
        } catch (error) {
            alert("Failed to reject workout: " + (error as Error).message);
        }
    };

    const toggleExpanded = (workoutId: string) => {
        setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId);
    };

    if (sharedWorkouts === undefined) {
        return (
            <div className="text-center text-text-secondary">Loading...</div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-text-primary">
                Shared Workouts
            </h2>

            {sharedWorkouts.length === 0 ? (
                <div className="text-center text-text-secondary py-8">
                    <p>No shared workouts</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sharedWorkouts.map((shared) => {
                        const isExpanded = expandedWorkout === shared._id;
                        const totalSets = shared.workout.exercises.reduce(
                            (sum, ex) => sum + ex.targetSets,
                            0
                        );

                        return (
                            <div
                                key={shared._id}
                                className="bg-background-primary rounded-lg border border-accent-primary/20"
                            >
                                {/* Compact Header */}
                                <div className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-medium text-text-primary truncate">
                                                    {shared.workout.name}
                                                </h3>
                                                <span
                                                    className={`inline-block px-2 py-1 text-xs rounded ${
                                                        shared.status ===
                                                        "pending"
                                                            ? "bg-yellow-100 text-yellow-800"
                                                            : shared.status ===
                                                                "accepted"
                                                              ? "bg-green-100 text-green-800"
                                                              : "bg-red-100 text-red-800"
                                                    }`}
                                                >
                                                    {shared.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-text-secondary">
                                                <span>
                                                    By{" "}
                                                    {shared.sharedByUserName ||
                                                        "Unknown User"}
                                                </span>
                                                <span>
                                                    {
                                                        shared.workout.exercises
                                                            .length
                                                    }{" "}
                                                    exercises
                                                </span>
                                                <span>
                                                    {totalSets} total sets
                                                </span>
                                                <span className="text-xs">
                                                    {new Date(
                                                        shared.sharedAt
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 ml-4">
                                            {shared.status === "pending" && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            void handleAccept(
                                                                shared._id
                                                            );
                                                        }}
                                                        className="px-3 py-1 bg-accent-primary text-white rounded text-sm hover:bg-accent-primary/90 transition-colors"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            void handleReject(
                                                                shared._id
                                                            );
                                                        }}
                                                        className="px-3 py-1 bg-danger text-white rounded text-sm hover:bg-danger-hover transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() =>
                                                    toggleExpanded(shared._id)
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
                                        {shared.workout.description && (
                                            <p className="text-sm text-text-secondary mb-3">
                                                {shared.workout.description}
                                            </p>
                                        )}
                                        <div className="space-y-1">
                                            {shared.workout.exercises.map(
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
