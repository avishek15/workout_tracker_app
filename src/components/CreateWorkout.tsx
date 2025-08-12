import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface Exercise {
    name: string;
    targetSets: number;
    targetReps?: number;
    targetWeight?: number;
    restTime?: number;
}

interface CreateWorkoutProps {
    onClose: () => void;
}

export function CreateWorkout({ onClose }: CreateWorkoutProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [currentExercise, setCurrentExercise] = useState<Exercise>({
        name: "",
        targetSets: 3,
        targetReps: 10,
        targetWeight: undefined,
        restTime: 60,
    });

    const createWorkout = useMutation(api.workouts.create);

    const addExercise = () => {
        if (!currentExercise.name.trim()) {
            toast.error("Exercise name is required");
            return;
        }

        setExercises([...exercises, { ...currentExercise }]);
        setCurrentExercise({
            name: "",
            targetSets: 3,
            targetReps: 10,
            targetWeight: undefined,
            restTime: 60,
        });
    };

    const removeExercise = (index: number) => {
        setExercises(exercises.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Workout name is required");
            return;
        }

        if (exercises.length === 0) {
            toast.error("Add at least one exercise");
            return;
        }

        try {
            await createWorkout({
                name: name.trim(),
                description: description.trim() || undefined,
                exercises,
                isPublic,
            });
            toast.success("Workout created successfully!");
            onClose();
        } catch (error) {
            toast.error("Failed to create workout");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-primary font-montserrat">
                    Create New Workout
                </h2>
                <button
                    onClick={onClose}
                    className="text-text-muted hover:text-text-primary text-xl font-bold"
                >
                    ×
                </button>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
                {/* Workout Details */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2 font-source-sans">
                            Workout Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-accent-primary/30 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-background-primary text-text-primary placeholder-text-muted"
                            placeholder="e.g., Push Day, Full Body, etc."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2 font-source-sans">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-accent-primary/30 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-background-primary text-text-primary placeholder-text-muted"
                            rows={3}
                            placeholder="Optional description..."
                        />
                    </div>

                    {/* Public/Private Toggle */}
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            id="isPublic"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className="w-4 h-4 text-accent-primary bg-background-primary border-accent-primary/30 rounded focus:ring-accent-primary focus:ring-2"
                        />
                        <label
                            htmlFor="isPublic"
                            className="text-sm font-medium text-text-secondary font-source-sans"
                        >
                            Make this workout public (visible to friends)
                        </label>
                    </div>
                </div>

                {/* Add Exercise */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-text-primary mb-4 font-montserrat">
                        Add Exercises
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1 font-source-sans">
                                Exercise Name *
                            </label>
                            <input
                                type="text"
                                value={currentExercise.name}
                                onChange={(e) =>
                                    setCurrentExercise({
                                        ...currentExercise,
                                        name: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border border-accent-primary/30 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-background-primary text-text-primary placeholder-text-muted"
                                placeholder="e.g., Bench Press"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1 font-source-sans">
                                Target Sets
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={currentExercise.targetSets}
                                onChange={(e) =>
                                    setCurrentExercise({
                                        ...currentExercise,
                                        targetSets:
                                            parseInt(e.target.value) || 1,
                                    })
                                }
                                className="w-full px-3 py-2 border border-accent-primary/30 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-background-primary text-text-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1 font-source-sans">
                                Target Reps
                            </label>
                            <input
                                type="number"
                                min="1"
                                value={currentExercise.targetReps || ""}
                                onChange={(e) =>
                                    setCurrentExercise({
                                        ...currentExercise,
                                        targetReps: e.target.value
                                            ? parseInt(e.target.value)
                                            : undefined,
                                    })
                                }
                                className="w-full px-3 py-2 border border-accent-primary/30 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-background-primary text-text-primary"
                                placeholder="Optional"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1 font-source-sans">
                                Target Weight (kg)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.5"
                                value={currentExercise.targetWeight || ""}
                                onChange={(e) =>
                                    setCurrentExercise({
                                        ...currentExercise,
                                        targetWeight: e.target.value
                                            ? parseFloat(e.target.value)
                                            : undefined,
                                    })
                                }
                                className="w-full px-3 py-2 border border-accent-primary/30 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-background-primary text-text-primary"
                                placeholder="Optional"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-1 font-source-sans">
                                Rest Time (sec)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={currentExercise.restTime || ""}
                                onChange={(e) =>
                                    setCurrentExercise({
                                        ...currentExercise,
                                        restTime: e.target.value
                                            ? parseInt(e.target.value)
                                            : undefined,
                                    })
                                }
                                className="w-full px-3 py-2 border border-accent-primary/30 rounded-lg focus:ring-2 focus:ring-accent-primary focus:border-transparent bg-background-primary text-text-primary"
                                placeholder="60"
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={addExercise}
                        className="w-full bg-accent-secondary text-white py-2 px-4 rounded-lg hover:bg-accent-secondary/90 transition-colors font-medium font-source-sans"
                    >
                        Add Exercise
                    </button>
                </div>

                {/* Exercise List */}
                {exercises.length > 0 && (
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-text-primary mb-4 font-montserrat">
                            Exercises ({exercises.length})
                        </h3>
                        <div className="space-y-2">
                            {exercises.map((exercise, index) => (
                                <div
                                    key={index}
                                    className="flex justify-between items-center bg-background-primary p-3 rounded-lg border border-accent-primary/20"
                                >
                                    <div>
                                        <span className="font-medium text-text-primary font-source-sans">
                                            {exercise.name}
                                        </span>
                                        <span className="text-sm text-text-secondary ml-2 font-source-sans">
                                            {exercise.targetSets} sets
                                            {exercise.targetReps &&
                                                ` × ${exercise.targetReps} reps`}
                                            {exercise.targetWeight &&
                                                ` @ ${exercise.targetWeight}kg`}
                                            {exercise.restTime &&
                                                ` (${exercise.restTime}s rest)`}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeExercise(index)}
                                        className="text-danger hover:text-danger-hover font-medium font-source-sans"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Submit Button */}
                <div className="border-t pt-6">
                    <button
                        type="submit"
                        className="w-full bg-accent-primary text-white py-3 px-4 rounded-lg hover:bg-accent-primary/90 transition-colors font-medium text-lg font-source-sans"
                    >
                        Create Workout
                    </button>
                </div>
            </form>
        </div>
    );
}
