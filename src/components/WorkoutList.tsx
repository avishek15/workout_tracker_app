import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";

interface WorkoutListProps {
    onCreateNew: () => void;
}

export function WorkoutList({ onCreateNew }: WorkoutListProps) {
    const workouts = useQuery(api.workouts.list);
    const startSession = useMutation(api.sessions.start);
    const deleteWorkout = useMutation(api.workouts.remove);
    const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

    const handleStartWorkout = async (workoutId: string) => {
        try {
            await startSession({ workoutId: workoutId as any });
            toast.success("Workout session started!");
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to start workout"
            );
        }
    };

    const handleDeleteWorkout = async (workoutId: string) => {
        if (!confirm("Are you sure you want to delete this workout?")) return;

        try {
            await deleteWorkout({ id: workoutId as any });
            toast.success("Workout deleted");
        } catch (error) {
            toast.error("Failed to delete workout");
        }
    };

    const toggleExpanded = (workoutId: string) => {
        setExpandedWorkout(expandedWorkout === workoutId ? null : workoutId);
    };

    if (workouts === undefined) {
        return <div className="text-center py-8">Loading workouts...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                    Your Workouts
                </h2>
                <button
                    onClick={onCreateNew}
                    className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors font-medium"
                >
                    + Create Workout
                </button>
            </div>

            {workouts.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">💪</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        No workouts yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Create your first workout to get started!
                    </p>
                    <button
                        onClick={onCreateNew}
                        className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-hover transition-colors font-medium"
                    >
                        Create Your First Workout
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {workouts.map((workout) => {
                        const isExpanded = expandedWorkout === workout._id;
                        const previewExercises = workout.exercises.slice(0, 3);
                        const hasMoreExercises = workout.exercises.length > 3;

                        return (
                            <div
                                key={workout._id}
                                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
                            >
                                {/* Main Workout Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                                            {workout.name}
                                        </h3>
                                        {workout.description && (
                                            <p className="text-gray-600 text-sm">
                                                {workout.description}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2">
                                            <span className="text-sm text-gray-500">
                                                {workout.exercises.length}{" "}
                                                exercises
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {workout.exercises.reduce(
                                                    (total, ex) =>
                                                        total + ex.targetSets,
                                                    0
                                                )}{" "}
                                                total sets
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() =>
                                                void handleStartWorkout(
                                                    workout._id
                                                )
                                            }
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                                        >
                                            Start
                                        </button>
                                        <button
                                            onClick={() =>
                                                void handleDeleteWorkout(
                                                    workout._id
                                                )
                                            }
                                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {/* Exercise Preview */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-gray-700 text-sm">
                                            Exercise Preview:
                                        </h4>
                                        <button
                                            onClick={() =>
                                                toggleExpanded(workout._id)
                                            }
                                            className="text-primary hover:text-primary-hover text-sm font-medium transition-colors"
                                        >
                                            {isExpanded
                                                ? "Show less"
                                                : "Show all exercises"}
                                        </button>
                                    </div>

                                    <div className="mt-2 space-y-1">
                                        {previewExercises.map(
                                            (exercise, index) => (
                                                <div
                                                    key={index}
                                                    className="flex justify-between items-center text-sm"
                                                >
                                                    <span className="text-gray-700">
                                                        {exercise.name}
                                                    </span>
                                                    <span className="text-gray-500">
                                                        {exercise.targetSets}{" "}
                                                        sets
                                                        {exercise.targetReps &&
                                                            ` × ${exercise.targetReps} reps`}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                        {hasMoreExercises && !isExpanded && (
                                            <div className="text-sm text-gray-500 italic">
                                                +{workout.exercises.length - 3}{" "}
                                                more exercises
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="border-t pt-4 mt-4">
                                        <h4 className="font-medium text-gray-700 mb-3">
                                            All Exercises:
                                        </h4>
                                        <div className="grid gap-2">
                                            {workout.exercises.map(
                                                (exercise, index) => (
                                                    <div
                                                        key={index}
                                                        className="bg-gray-50 rounded-lg p-3"
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-medium text-gray-900">
                                                                {exercise.name}
                                                            </span>
                                                            <div className="text-sm text-gray-600">
                                                                {
                                                                    exercise.targetSets
                                                                }{" "}
                                                                sets
                                                                {exercise.targetReps &&
                                                                    ` × ${exercise.targetReps} reps`}
                                                                {exercise.targetWeight &&
                                                                    ` @ ${exercise.targetWeight}lbs`}
                                                            </div>
                                                        </div>
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
