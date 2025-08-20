import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Play } from "lucide-react";
import { WeightInput } from "./WeightInput";
import { Switch } from "./ui/switch";

export function ActiveSession() {
    const activeSession = useQuery(api.sessions.getActive);
    const completeSession = useMutation(api.sessions.complete);
    const cancelSession = useMutation(api.sessions.cancel);
    const completeSet = useMutation(api.sets.complete);
    const addSet = useMutation(api.sets.add);
    const removeSet = useMutation(api.sets.remove);
    const updateSet = useMutation(api.sets.update);
    const addBodyWeight = useMutation(api.bodyWeights.add);
    const removeBodyWeight = useMutation(api.bodyWeights.remove);

    const [notes, setNotes] = useState("");
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);
    const [bodyWeight, setBodyWeight] = useState<number | undefined>();
    const [bodyWeightUnit, setBodyWeightUnit] = useState<"kg" | "lbs">("kg");
    const [optimisticBodyweightToggles, setOptimisticBodyweightToggles] =
        useState<Record<string, boolean>>({});

    // Get body weight history from database
    const bodyWeightHistory = useQuery(
        api.bodyWeights.listBySession,
        activeSession ? { sessionId: activeSession._id } : "skip"
    );

    // Clear optimistic state when session changes
    useEffect(() => {
        setOptimisticBodyweightToggles({});
    }, [activeSession?._id]);

    if (activeSession === undefined) {
        return <div className="text-center py-8">Loading...</div>;
    }

    if (!activeSession) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-accent-primary rounded-full flex items-center justify-center mx-auto mb-6">
                    <Play className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2 font-montserrat">
                    No Active Session
                </h3>
                <p className="text-text-secondary font-source-sans">
                    Start a workout from your workout list to begin tracking.
                </p>
            </div>
        );
    }

    // Safety check for workout data
    if (!activeSession.workout || !activeSession.workout.exercises) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-accent-primary rounded-full flex items-center justify-center mx-auto mb-6">
                    <Play className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2 font-montserrat">
                    Loading Session Data
                </h3>
                <p className="text-text-secondary font-source-sans">
                    Please wait while we load your workout session...
                </p>
            </div>
        );
    }

    const handleCompleteSet = async (setId: string) => {
        try {
            await completeSet({ setId: setId as any });
            toast.success("Set completed!");
        } catch (error) {
            toast.error("Failed to complete set");
        }
    };

    const handleExerciseBodyweightToggle = async (
        exerciseName: string,
        isBodyweight: boolean
    ) => {
        // Optimistic update
        setOptimisticBodyweightToggles((prev) => ({
            ...prev,
            [exerciseName]: isBodyweight,
        }));

        try {
            // Update all sets for this exercise
            const exerciseSets = activeSession.sets.filter(
                (set) => set.exerciseName === exerciseName
            );

            for (const set of exerciseSets) {
                await updateSet({
                    setId: set._id,
                    reps: set.reps,
                    weight: set.weight || 0,
                    weightUnit: set.weightUnit,
                    isBodyweight,
                });
            }

            toast.success(
                `All ${exerciseName} sets updated to ${isBodyweight ? "bodyweight" : "regular"} exercise`
            );
        } catch (error) {
            // Revert optimistic update on error
            setOptimisticBodyweightToggles((prev) => ({
                ...prev,
                [exerciseName]: !isBodyweight,
            }));
            toast.error("Failed to update exercise type");
        }
    };

    const handleRemoveSet = async (setId: string) => {
        if (!confirm("Remove this set?")) return;
        try {
            await removeSet({ setId: setId as any });
            toast.success("Set removed");
        } catch (error) {
            toast.error("Failed to remove set");
        }
    };

    const handleBodyWeightChange = (weight: number, unit: "kg" | "lbs") => {
        setBodyWeight(weight);
        setBodyWeightUnit(unit);
    };

    const handleSaveBodyWeight = async () => {
        if (!activeSession) return;

        if (!bodyWeight || bodyWeight <= 0) {
            toast.error("Please enter a valid weight");
            return;
        }

        try {
            await addBodyWeight({
                sessionId: activeSession._id,
                weight: bodyWeight,
                weightUnit: bodyWeightUnit,
            });
            setBodyWeight(undefined); // Clear the input
            toast.success(`Weight saved: ${bodyWeight} ${bodyWeightUnit}`);
        } catch (error) {
            toast.error("Failed to save weight");
        }
    };

    const handleCompleteSession = async () => {
        try {
            await completeSession({
                sessionId: activeSession._id as any,
                notes: notes.trim() || undefined,
            });
            toast.success("Workout completed! Great job!");
            setShowCompleteDialog(false);
        } catch (error) {
            toast.error("Failed to complete session");
        }
    };

    const handleCancelSession = async () => {
        if (!confirm("Are you sure you want to cancel this workout session?"))
            return;
        try {
            await cancelSession({ sessionId: activeSession._id as any });
            toast.success("Session cancelled");
        } catch (error) {
            toast.error("Failed to cancel session");
        }
    };

    const formatDuration = (startTime: number) => {
        const duration = Date.now() - startTime;
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    // Group sets by exercise
    const exerciseGroups =
        activeSession.workout?.exercises?.map((exercise) => ({
            ...exercise,
            sets: activeSession.sets.filter(
                (set) => set.exerciseName === exercise.name
            ),
            // Use optimistic state if available, otherwise fall back to database state
            isBodyweight: optimisticBodyweightToggles.hasOwnProperty(
                exercise.name
            )
                ? optimisticBodyweightToggles[exercise.name]
                : exercise.isBodyweight || false,
        })) || [];

    // Updated handleAddSet to use exercise bodyweight setting
    const handleAddSet = async (exerciseName: string) => {
        try {
            // Find the exercise to get its bodyweight setting
            const exercise = exerciseGroups.find(
                (ex) => ex.name === exerciseName
            );
            const isBodyweight = exercise?.isBodyweight || false;

            await addSet({
                sessionId: activeSession._id as any,
                exerciseName,
                reps: 10,
                weight: undefined,
                effectiveWeight: undefined, // Will be calculated later
                isBodyweight,
            });
            toast.success("Set added!");
        } catch (error) {
            toast.error("Failed to add set");
        }
    };

    const completedSets = activeSession.sets.filter(
        (set) => set.completed
    ).length;
    const totalSets = activeSession.sets.length;

    return (
        <div className="space-y-6 pb-20">
            {/* Session Header */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-6 relative overflow-hidden">
                {/* Animated background overlay */}
                <div className="absolute inset-0 bg-green-100 opacity-0 animate-pulse-slow pointer-events-none"></div>
                {/* Content */}
                <div className="relative z-10">
                    <div className="flex justify-between items-start gap-4 mb-4">
                        <div className="flex-1">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                                {activeSession.workout?.name}
                            </h2>
                            <p className="text-gray-600 text-sm sm:text-base">
                                Started{" "}
                                {formatDuration(activeSession.startTime)} ago
                            </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                            <div className="text-2xl sm:text-3xl font-bold text-green-600">
                                {completedSets}/{totalSets}
                            </div>
                            <div className="text-sm sm:text-base text-gray-600">
                                sets completed
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Optional Body Weight Section */}
            <div className="border border-gray-200 rounded-lg p-4 sm:p-6 bg-gray-50">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                    <div>
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                            Body Weight (Optional)
                        </h3>
                        <p className="text-sm text-gray-600">
                            Log your weight at the start of your workout
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <WeightInput
                            value={bodyWeight}
                            unit={bodyWeightUnit}
                            onWeightChange={handleBodyWeightChange}
                            placeholder="Enter weight"
                            className="w-full sm:w-64"
                        />
                    </div>
                    <button
                        onClick={() => void handleSaveBodyWeight()}
                        className="bg-accent-primary text-white px-4 py-2 rounded-lg hover:bg-accent-primary/90 transition-colors font-medium"
                    >
                        Save Weight
                    </button>
                </div>

                {bodyWeightHistory && bodyWeightHistory.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Today's Weight Log
                        </h4>
                        <div className="space-y-2">
                            {bodyWeightHistory?.map((entry) => (
                                <div
                                    key={entry._id}
                                    className="flex justify-between items-center text-sm"
                                >
                                    <span className="text-gray-600">
                                        {new Date(
                                            entry.measuredAt
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                    <span className="font-medium">
                                        {entry.weight} {entry.weightUnit}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Exercises */}
            <div className="space-y-6">
                {exerciseGroups.map((exercise, exerciseIndex) => (
                    <div key={exerciseIndex}>
                        <div className="border rounded-lg p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900 capitalize">
                                        {exercise.name}
                                    </h3>

                                    {/* Exercise-level Bodyweight Toggle */}
                                    <div className="flex items-center gap-3">
                                        <Switch
                                            checked={
                                                exercise.isBodyweight || false
                                            }
                                            onCheckedChange={(checked) =>
                                                void handleExerciseBodyweightToggle(
                                                    exercise.name,
                                                    checked
                                                )
                                            }
                                            className="scale-125 data-[state=checked]:bg-secondary data-[state=unchecked]:bg-background-secondary [&>span]:bg-accent-primary [&>span]:border-2 [&>span]:border-black/20 shadow-md hover:shadow-lg transition-shadow border-2 border-accent-primary/30"
                                        />
                                        <span className="text-sm font-semibold text-text-primary">
                                            Bodyweight Exercise
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {exercise.sets.map((set, setIndex) => (
                                    <SetRow
                                        key={set._id}
                                        set={set}
                                        setNumber={setIndex + 1}
                                        onComplete={(setId) =>
                                            void handleCompleteSet(setId)
                                        }
                                        onRemove={(setId) =>
                                            void handleRemoveSet(setId)
                                        }
                                    />
                                ))}
                            </div>

                            {/* Add Set Button at Bottom */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() =>
                                        void handleAddSet(exercise.name)
                                    }
                                    className="w-full bg-accent-primary text-white px-4 py-3 rounded-lg hover:bg-accent-primary/90 transition-colors font-medium"
                                >
                                    + Add Set
                                </button>
                            </div>
                        </div>

                        {/* Exercise Separator */}
                        {exerciseIndex < exerciseGroups.length - 1 && (
                            <div className="flex items-center justify-center py-4">
                                <div className="w-16 h-px bg-gray-300"></div>
                                <div className="mx-4 text-xs text-gray-500 font-medium uppercase tracking-wider">
                                    Next Exercise
                                </div>
                                <div className="w-16 h-px bg-gray-300"></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Complete Dialog */}
            {showCompleteDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold mb-4">
                            Complete Workout
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes (optional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                    rows={3}
                                    placeholder="How did the workout go?"
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => setShowCompleteDialog(false)}
                                    className="w-full sm:flex-1 px-4 py-3 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => void handleCompleteSession()}
                                    className="w-full sm:flex-1 bg-accent-primary text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-accent-primary/90 transition-colors"
                                >
                                    Complete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-300 shadow-lg z-40 px-4 py-3">
                <div className="max-w-7xl mx-auto flex gap-3">
                    <button
                        onClick={() => void handleCancelSession()}
                        className="flex-1 bg-danger text-white px-4 py-3 rounded-lg hover:bg-danger-hover transition-all duration-200 font-medium shadow-md hover:shadow-lg sm:text-base"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => setShowCompleteDialog(true)}
                        className="flex-1 bg-accent-primary text-white px-4 py-3 rounded-lg hover:bg-accent-primary/90 transition-all duration-200 font-medium shadow-md hover:shadow-lg sm:text-base"
                    >
                        Complete Workout
                    </button>
                </div>
            </div>
        </div>
    );
}

interface SetRowProps {
    set: any;
    setNumber: number;
    onComplete: (setId: string) => void;
    onRemove: (setId: string) => void;
}

function SetRow({ set, setNumber, onComplete, onRemove }: SetRowProps) {
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
            weight: localWeight || 0, // Never save undefined, always 0
            weightUnit: localWeightUnit,
            effectiveWeight: localWeight || 0, // Initially same as weight, will be calculated later
            isBodyweight: set.isBodyweight, // Use the set's current bodyweight setting
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
