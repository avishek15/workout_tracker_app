import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Play } from "lucide-react";

export function ActiveSession() {
    const activeSession = useQuery(api.sessions.getActive);
    const completeSession = useMutation(api.sessions.complete);
    const cancelSession = useMutation(api.sessions.cancel);
    const updateSet = useMutation(api.sets.update);
    const completeSet = useMutation(api.sets.complete);
    const addSet = useMutation(api.sets.add);
    const removeSet = useMutation(api.sets.remove);

    const [notes, setNotes] = useState("");
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);

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

    const handleUpdateSet = async (
        setId: string,
        reps: number,
        weight?: number
    ) => {
        try {
            await updateSet({ setId: setId as any, reps, weight });
        } catch (error) {
            toast.error("Failed to update set");
        }
    };

    const handleCompleteSet = async (setId: string) => {
        try {
            await completeSet({ setId: setId as any });
            toast.success("Set completed!");
        } catch (error) {
            toast.error("Failed to complete set");
        }
    };

    const handleAddSet = async (exerciseName: string) => {
        try {
            await addSet({
                sessionId: activeSession._id as any,
                exerciseName,
                reps: 10,
                weight: undefined,
            });
            toast.success("Set added!");
        } catch (error) {
            toast.error("Failed to add set");
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
        activeSession.workout?.exercises.map((exercise) => ({
            ...exercise,
            sets: activeSession.sets.filter(
                (set) => set.exerciseName === exercise.name
            ),
        })) || [];

    const completedSets = activeSession.sets.filter(
        (set) => set.completed
    ).length;
    const totalSets = activeSession.sets.length;

    return (
        <div className="space-y-6">
            {/* Session Header */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 relative overflow-hidden">
                {/* Animated background overlay */}
                <div className="absolute inset-0 bg-green-100 opacity-0 animate-pulse-slow pointer-events-none"></div>
                {/* Content */}
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {activeSession.workout?.name}
                            </h2>
                            <p className="text-gray-600">
                                Started{" "}
                                {formatDuration(activeSession.startTime)} ago
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-green-600">
                                {completedSets}/{totalSets}
                            </div>
                            <div className="text-sm text-gray-600">
                                sets completed
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowCompleteDialog(true)}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                            Complete Workout
                        </button>
                        <button
                            onClick={() => void handleCancelSession()}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            {/* Exercises */}
            <div className="space-y-6">
                {exerciseGroups.map((exercise, exerciseIndex) => (
                    <div key={exerciseIndex} className="border rounded-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-gray-900">
                                {exercise.name}
                            </h3>
                            <button
                                onClick={() => void handleAddSet(exercise.name)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                                + Add Set
                            </button>
                        </div>

                        <div className="space-y-3">
                            {exercise.sets.map((set, setIndex) => (
                                <SetRow
                                    key={set._id}
                                    set={set}
                                    setNumber={setIndex + 1}
                                    onUpdate={(setId, reps, weight) =>
                                        void handleUpdateSet(
                                            setId,
                                            reps,
                                            weight
                                        )
                                    }
                                    onComplete={(setId) =>
                                        void handleCompleteSet(setId)
                                    }
                                    onRemove={(setId) =>
                                        void handleRemoveSet(setId)
                                    }
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Complete Dialog */}
            {showCompleteDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCompleteDialog(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => void handleCompleteSession()}
                                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Complete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface SetRowProps {
    set: any;
    setNumber: number;
    onUpdate: (setId: string, reps: number, weight?: number) => void;
    onComplete: (setId: string) => void;
    onRemove: (setId: string) => void;
}

function SetRow({
    set,
    setNumber,
    onUpdate,
    onComplete,
    onRemove,
}: SetRowProps) {
    const [reps, setReps] = useState(set.reps);
    const [weight, setWeight] = useState(set.weight || "");

    const handleUpdate = () => {
        onUpdate(set._id, reps, weight ? parseFloat(weight) : undefined);
    };

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-lg border ${
                set.completed
                    ? "bg-green-50 border-green-200"
                    : "bg-gray-50 border-gray-200"
            }`}
        >
            <div className="w-8 text-center font-medium text-gray-600">
                {setNumber}
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="number"
                    min="0"
                    value={reps}
                    onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                    onBlur={handleUpdate}
                    className="w-16 px-3 py-1 border border-gray-300 rounded text-center"
                    disabled={set.completed}
                />
                <span className="text-sm text-gray-600">reps</span>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    onBlur={handleUpdate}
                    className="w-20 px-3 py-1 border border-gray-300 rounded text-center"
                    placeholder="0"
                    disabled={set.completed}
                />
                <span className="text-sm text-gray-600">lbs</span>
            </div>

            <div className="flex-1"></div>

            {!set.completed ? (
                <button
                    onClick={() => void onComplete(set._id)}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                >
                    ✓ Done
                </button>
            ) : (
                <span className="text-green-600 font-medium text-sm">
                    ✓ Completed
                </span>
            )}

            <button
                onClick={() => void onRemove(set._id)}
                className="text-red-600 hover:text-red-800 font-bold"
            >
                ×
            </button>
        </div>
    );
}
