import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { WeightInput } from "./WeightInput";

interface SetRowProps {
    set: any;
    setNumber: number;
    onComplete: (setId: string) => void;
    onRemove: (setId: string) => void;
}

export function SetRow({ set, setNumber, onComplete, onRemove }: SetRowProps) {
    const updateSet = useMutation(api.sets.update);

    // Local state for immediate UI updates
    const [localReps, setLocalReps] = useState(Math.max(0, set.reps));
    const [localWeight, setLocalWeight] = useState(set.weight);
    const [localWeightUnit, setLocalWeightUnit] = useState(
        set.weightUnit || "kg"
    );
    const [repsInputValue, setRepsInputValue] = useState(
        Math.max(0, set.reps).toString()
    );

    const handleWeightChange = (weight: number, unit: "kg" | "lbs") => {
        setLocalWeight(weight);
        setLocalWeightUnit(unit);
    };

    const handleRepsChange = (reps: number) => {
        const validReps = Math.max(0, reps);
        setLocalReps(validReps);
    };

    const handleComplete = async () => {
        // Validate reps input value
        const repsValue = parseInt(repsInputValue);
        if (isNaN(repsValue) || repsValue < 0) {
            toast.error("Please enter a valid number of reps (0 or higher)");
            return;
        }

        // Save all current values to database when Done is pressed
        await updateSet({
            setId: set._id,
            reps: repsValue,
            weight: localWeight || 0,
            weightUnit: localWeightUnit,
            effectiveWeight: localWeight || 0,
        });
        onComplete(set._id);
    };

    return (
        <div
            className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-lg border ${
                set.completed
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200"
            }`}
        >
            {/* Set Number */}
            <div className="w-8 text-center font-medium text-gray-600 flex-shrink-0">
                {setNumber}
            </div>

            {/* Input Fields */}
            <div className="flex flex-col sm:flex-row gap-6 flex-1">
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        min="0"
                        step="1"
                        value={repsInputValue}
                        onChange={(e) => {
                            const value = e.target.value;
                            // Only allow whole numbers
                            if (value.includes(".")) return;
                            setRepsInputValue(value);

                            // Parse the value and update local state
                            if (value === "") {
                                handleRepsChange(0);
                            } else {
                                const numValue = parseInt(value);
                                if (!isNaN(numValue)) {
                                    if (numValue >= 0) {
                                        handleRepsChange(numValue);
                                    } else {
                                        toast.error(
                                            "Negative reps are not allowed"
                                        );
                                        setRepsInputValue("0");
                                        handleRepsChange(0);
                                    }
                                }
                            }
                        }}
                        onBlur={() => {
                            // When input loses focus, show 0 if empty
                            if (repsInputValue === "") {
                                setRepsInputValue("0");
                            }
                        }}
                        className="w-20 sm:w-32 px-3 py-2 sm:py-1 border border-gray-300 rounded text-center"
                        disabled={set.completed}
                    />
                    <span className="text-sm text-gray-600">reps</span>
                </div>

                <div className="flex items-center gap-2">
                    <WeightInput
                        value={localWeight}
                        unit={localWeightUnit}
                        onWeightChange={handleWeightChange}
                        disabled={set.completed}
                        className="w-48 sm:w-64"
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
                {!set.completed ? (
                    <button
                        onClick={() => void handleComplete()}
                        className="flex-1 sm:flex-none bg-accent-primary text-white px-4 py-2 rounded text-sm hover:bg-accent-primary/90 transition-colors"
                    >
                        ✓ Done
                    </button>
                ) : (
                    <span className="flex-1 sm:flex-none text-green-600 font-medium text-sm text-center">
                        ✓ Completed
                    </span>
                )}

                <button
                    onClick={() => void onRemove(set._id)}
                    className="text-danger hover:text-danger-hover font-bold text-lg px-2 py-1"
                >
                    ×
                </button>
            </div>
        </div>
    );
}
