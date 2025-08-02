import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";
import { Dumbbell } from "lucide-react";

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
            await startSession({
                workoutId: workoutId as any,
            });
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
            await deleteWorkout({
                id: workoutId as any,
            });
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold text-text-primary font-montserrat">
                    Your Workouts
                </h2>
                <button
                    onClick={onCreateNew}
                    className="w-full sm:w-auto bg-accent-primary text-white px-4 py-2 rounded-lg hover:bg-accent-primary/90 transition-colors font-medium font-source-sans"
                >
                    + Create Workout
                </button>
            </div>

            {workouts.length === 0 ? (
                <div className="text-center py-12">
                    <div className="w-16 h-16 bg-accent-primary rounded-full flex items-center justify-center mx-auto mb-6">
                        <Dumbbell className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-text-primary mb-2 font-montserrat">
                        No workouts yet
                    </h3>
                    <p className="text-text-secondary mb-6 font-source-sans">
                        Create your first workout to get started!
                    </p>
                    <button
                        onClick={onCreateNew}
                        className="bg-accent-primary text-white px-6 py-3 rounded-lg hover:bg-accent-primary/90 transition-colors font-medium font-source-sans"
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
                                className="bg-background-secondary border border-accent-primary/20 rounded-xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200"
                            >
                                {/* Main Workout Header */}
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg sm:text-xl font-bold text-text-primary mb-1 font-montserrat">
                                            {workout.name}
                                        </h3>
                                        {workout.description && (
                                            <p className="text-text-secondary text-sm font-source-sans">
                                                {workout.description}
                                            </p>
                                        )}
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                                            <span className="text-sm text-text-muted font-source-sans">
                                                {workout.exercises.length}{" "}
                                                exercises
                                            </span>
                                            <span className="text-sm text-text-muted font-source-sans">
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
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={() =>
                                                void handleStartWorkout(
                                                    workout._id
                                                )
                                            }
                                            className="flex-1 sm:flex-none bg-accent-primary text-white px-4 py-2 rounded-lg hover:bg-accent-primary/90 transition-colors font-medium text-sm font-source-sans"
                                        >
                                            Start
                                        </button>
                                        <button
                                            onClick={() =>
                                                void handleDeleteWorkout(
                                                    workout._id
                                                )
                                            }
                                            className="flex-1 sm:flex-none bg-danger/80 text-white px-4 py-2 rounded-lg hover:bg-danger transition-colors font-medium text-sm font-source-sans"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {/* Exercise Preview */}
                                <div className="mb-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <h4 className="font-medium text-text-secondary text-sm font-source-sans">
                                            Exercise Preview:
                                        </h4>
                                        <button
                                            onClick={() =>
                                                toggleExpanded(workout._id)
                                            }
                                            className="text-accent-primary hover:text-accent-primary/90 text-sm font-medium transition-colors font-source-sans underline self-start sm:self-auto"
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
                                                    className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 text-sm"
                                                >
                                                    <span className="text-text-primary font-source-sans truncate">
                                                        {exercise.name}
                                                    </span>
                                                    <span className="text-text-muted font-source-sans text-xs sm:text-sm">
                                                        {exercise.targetSets}{" "}
                                                        sets
                                                        {exercise.targetReps &&
                                                            ` × ${exercise.targetReps} reps`}
                                                    </span>
                                                </div>
                                            )
                                        )}
                                        {hasMoreExercises && !isExpanded && (
                                            <div className="text-sm text-text-muted italic font-source-sans">
                                                +{workout.exercises.length - 3}{" "}
                                                more exercises
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="border-t pt-4 mt-4">
                                        <h4 className="font-medium text-text-secondary mb-3 font-source-sans">
                                            All Exercises:
                                        </h4>
                                        <div className="grid gap-2">
                                            {workout.exercises.map(
                                                (exercise, index) => (
                                                    <div
                                                        key={index}
                                                        className="bg-background-secondary rounded-lg p-3 border border-accent-primary/10"
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-medium text-text-primary font-source-sans">
                                                                {exercise.name}
                                                            </span>
                                                            <div className="text-sm text-text-secondary font-source-sans">
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
