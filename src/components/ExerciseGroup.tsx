import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Switch } from "./ui/switch";
import { SetRow } from "./SetRow";

interface ExerciseGroupProps {
    exercise: any;
    exerciseIndex: number;
    totalExercises: number;
    onCompleteSet: (setId: string) => void;
    onRemoveSet: (setId: string) => void;
    onAddSet: (exerciseName: string) => void;
    onToggleBodyweight: (exerciseName: string, isBodyweight: boolean) => void;
    isBodyweight: boolean;
}

export function ExerciseGroup({
    exercise,
    exerciseIndex,
    totalExercises,
    onCompleteSet,
    onRemoveSet,
    onAddSet,
    onToggleBodyweight,
    isBodyweight,
}: ExerciseGroupProps) {
    return (
        <div key={exercise.name} className="space-y-4">
            {/* Exercise Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                    <div className="flex-1">
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                            {exercise.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                            {exercise.sets.length} set
                            {exercise.sets.length !== 1 ? "s" : ""}
                        </p>
                    </div>

                    {/* Bodyweight Toggle */}
                    <div className="flex items-center gap-3">
                        <Switch
                            checked={isBodyweight}
                            onCheckedChange={(checked) =>
                                onToggleBodyweight(exercise.name, checked)
                            }
                            className="scale-125 data-[state=checked]:bg-secondary data-[state=unchecked]:bg-background-secondary [&>span]:bg-accent-primary [&>span]:border-2 [&>span]:border-black/20 shadow-md hover:shadow-lg transition-shadow border-2 border-accent-primary/30"
                        />
                        <span className="text-sm font-semibold text-text-primary">
                            Bodyweight Exercise
                        </span>
                    </div>
                </div>

                <div className="space-y-3">
                    {exercise.sets.map((set: any, setIndex: number) => (
                        <SetRow
                            key={set._id}
                            set={set}
                            setNumber={setIndex + 1}
                            onComplete={onCompleteSet}
                            onRemove={onRemoveSet}
                        />
                    ))}
                </div>

                {/* Add Set Button at Bottom */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                        onClick={() => onAddSet(exercise.name)}
                        className="w-full bg-accent-primary text-white px-4 py-3 rounded-lg hover:bg-accent-primary/90 transition-colors font-medium"
                    >
                        + Add Set
                    </button>
                </div>
            </div>

            {/* Exercise Separator */}
            {exerciseIndex < totalExercises - 1 && (
                <div className="flex items-center justify-center py-4">
                    <div className="w-16 h-px bg-gray-300"></div>
                    <div className="mx-4 text-xs text-gray-500 font-medium uppercase tracking-wider">
                        Next Exercise
                    </div>
                    <div className="w-16 h-px bg-gray-300"></div>
                </div>
            )}
        </div>
    );
}
