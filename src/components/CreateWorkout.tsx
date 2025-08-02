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
                <h2 className="text-2xl font-bold text-gray-900">
                    Create New Workout
                </h2>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                >
                    ×
                </button>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
                {/* Workout Details */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Workout Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="e.g., Push Day, Full Body, etc."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            rows={3}
                            placeholder="Optional description..."
                        />
                    </div>
                </div>

                {/* Add Exercise */}
                <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Add Exercises
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="e.g., Bench Press"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Optional"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Target Weight (lbs)
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
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="Optional"
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                type="button"
                                onClick={addExercise}
                                className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors font-medium"
                            >
                                Add Exercise
                            </button>
                        </div>
                    </div>
                </div>

                {/* Exercise List */}
                {exercises.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-medium text-gray-700">
                            Exercises ({exercises.length}):
                        </h4>
                        {exercises.map((exercise, index) => (
                            <div
                                key={index}
                                className="bg-gray-50 rounded-lg p-4 flex justify-between items-center"
                            >
                                <div>
                                    <div className="font-medium">
                                        {exercise.name}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {exercise.targetSets} sets
                                        {exercise.targetReps &&
                                            ` × ${exercise.targetReps} reps`}
                                        {exercise.targetWeight &&
                                            ` @ ${exercise.targetWeight}lbs`}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeExercise(index)}
                                    className="text-red-600 hover:text-red-800 font-bold text-lg"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Submit */}
                <div className="flex gap-4 pt-6 border-t">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors font-medium"
                    >
                        Create Workout
                    </button>
                </div>
            </form>
        </div>
    );
}
