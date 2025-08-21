import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { RestTimer } from "./RestTimer";
import { Play } from "lucide-react";
import { useBodyweightToggles } from "../lib/useBodyweightToggles";
import { convertToKgFromUnit } from "../lib/unitConversion";
import { SessionHeader } from "./SessionHeader";
import { BodyWeightSection } from "./BodyWeightSection";
import { ExerciseGroup } from "./ExerciseGroup";
import { CompleteDialog } from "./CompleteDialog";
import { FloatingActionBar } from "./FloatingActionBar";

export function ActiveSession() {
    const activeSession = useQuery(api.sessions.getActive);
    const completeSession = useMutation(api.sessions.complete);
    const cancelSession = useMutation(api.sessions.cancel);
    const completeSet = useMutation(api.sets.complete);
    const addSet = useMutation(api.sets.add);
    const removeSet = useMutation(api.sets.remove);
    const updateSet = useMutation(api.sets.update);
    const bulkFinalizeSets = useMutation(api.sets.bulkFinalize);

    const [notes, setNotes] = useState("");
    const [showCompleteDialog, setShowCompleteDialog] = useState(false);

    // Track which exercises are expanded (all start collapsed)
    const [expandedExercises, setExpandedExercises] = useState<Set<string>>(
        new Set()
    );

    // Rest timer state
    const [activeRestTimer, setActiveRestTimer] = useState<{
        exerciseName: string;
        restTime: number;
        remainingTime: number;
        isActive: boolean;
    } | null>(null);

    // Get body weight history from database
    const bodyWeightHistory = useQuery(
        api.bodyWeights.listBySession,
        activeSession ? { sessionId: activeSession._id } : "skip"
    );

    // Get latest user body weight for fallback
    const latestUserBodyWeight = useQuery(api.bodyWeights.latestForUser);

    // Use custom hook for bodyweight toggles
    const { toggleExerciseBodyweight, getExerciseBodyweight } =
        useBodyweightToggles(activeSession?._id);

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

            // Find the exercise name for this set and start rest timer
            const set = activeSession.sets.find((s) => s._id === setId);
            if (set) {
                startRestTimer(set.exerciseName);
            }
        } catch (error) {
            toast.error("Failed to complete set");
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
                weight: 0,
                effectiveWeight: 0,
                isBodyweight,
            });
            toast.success("Set added!");
        } catch (error) {
            toast.error("Failed to add set");
        }
    };

    const handleCancelSession = async () => {
        if (!confirm("Cancel this workout session?")) return;
        try {
            await cancelSession({ sessionId: activeSession._id as any });
            toast.success("Session cancelled");
        } catch (error) {
            toast.error("Failed to cancel session");
        }
    };

    const toggleExerciseExpansion = (exerciseName: string) => {
        setExpandedExercises((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(exerciseName)) {
                newSet.delete(exerciseName);
            } else {
                newSet.add(exerciseName);
            }
            return newSet;
        });
    };

    // Start rest timer for an exercise
    const startRestTimer = (exerciseName: string) => {
        const exercise = activeSession.workout?.exercises?.find(
            (ex) => ex.name === exerciseName
        );

        if (exercise && exercise.restTime) {
            setActiveRestTimer({
                exerciseName,
                restTime: exercise.restTime,
                remainingTime: exercise.restTime,
                isActive: true,
            });
        }
    };

    // Skip rest timer
    const skipRestTimer = () => {
        setActiveRestTimer(null);
    };

    // Start next set (timer completed)
    const startNextSet = () => {
        setActiveRestTimer(null);
        // Could add logic here to auto-expand the next set or focus on it
    };

    const handleCompleteSession = async () => {
        try {
            // 1) Resolve body weight in kg
            let bodyWeightKg = 80; // fallback
            const sessionWeights = bodyWeightHistory ?? [];
            if (sessionWeights.length > 0) {
                const latest = sessionWeights[0];
                bodyWeightKg = convertToKgFromUnit(
                    latest.weight || 0,
                    (latest.weightUnit || "kg") as "kg" | "lbs"
                );
            } else {
                // Use latest user body weight from database
                if (latestUserBodyWeight) {
                    bodyWeightKg = convertToKgFromUnit(
                        latestUserBodyWeight.weight || 0,
                        (latestUserBodyWeight.weightUnit || "kg") as
                            | "kg"
                            | "lbs"
                    );
                } else {
                    // Final fallback to 80kg
                    bodyWeightKg = 80;
                }
            }

            // 2) Stage updates and compute total volume
            const updates: Array<{
                setId: string;
                effectiveWeight: number;
                isBodyweight: boolean;
            }> = [];
            let totalVolume = 0;

            for (const exercise of exerciseGroups) {
                const isBwExercise = !!exercise.isBodyweight;
                for (const set of exercise.sets) {
                    if (!set.completed) continue;
                    const weightKg = convertToKgFromUnit(
                        set.weight || 0,
                        set.weightUnit || "kg"
                    );
                    const effectiveWeight = isBwExercise
                        ? Math.max(bodyWeightKg - weightKg, 0)
                        : weightKg;
                    updates.push({
                        setId: set._id,
                        effectiveWeight,
                        isBodyweight: isBwExercise,
                    });
                    totalVolume += (set.reps || 0) * effectiveWeight;
                }
            }

            // 3) Persist set updates in bulk (fallback to per-set if needed)
            try {
                await bulkFinalizeSets({
                    updates: updates.map((u) => ({
                        setId: u.setId as any,
                        effectiveWeight: u.effectiveWeight,
                        isBodyweight: u.isBodyweight,
                    })),
                });
            } catch {
                // Fallback: per-set updates
                for (const u of updates) {
                    await updateSet({
                        setId: u.setId as any,
                        reps: 0,
                        weight: undefined,
                        weightUnit: undefined,
                        effectiveWeight: u.effectiveWeight,
                        isBodyweight: u.isBodyweight,
                    });
                }
            }

            // 4) Complete the session with totalVolume
            await completeSession({
                sessionId: activeSession._id as any,
                notes: notes.trim() || undefined,
                totalVolume,
            });

            toast.success("Workout completed!");
            setShowCompleteDialog(false);
        } catch (error) {
            toast.error("Failed to complete session");
        }
    };

    // Group sets by exercise
    const exerciseGroups =
        activeSession.workout?.exercises?.map((exercise) => ({
            ...exercise,
            sets: activeSession.sets.filter(
                (set) => set.exerciseName === exercise.name
            ),
            isBodyweight: getExerciseBodyweight(
                exercise.name,
                exercise.isBodyweight || false
            ),
        })) || [];

    const completedSets = activeSession.sets.filter(
        (set) => set.completed
    ).length;
    const totalSets = activeSession.sets.length;

    return (
        <div className="space-y-6 pb-20">
            {/* Session Header */}
            <SessionHeader
                sessionName={activeSession.workout?.name || ""}
                startTime={activeSession.startTime}
                completedSets={completedSets}
                totalSets={totalSets}
            />

            {/* Optional Body Weight Section */}
            <BodyWeightSection
                sessionId={activeSession._id}
                bodyWeightHistory={bodyWeightHistory}
            />

            {/* Exercises */}
            <div className="space-y-6">
                {exerciseGroups.map((exercise, exerciseIndex) => (
                    <ExerciseGroup
                        key={`${exercise.name}-${exerciseIndex}`}
                        exercise={exercise}
                        exerciseIndex={exerciseIndex}
                        totalExercises={exerciseGroups.length}
                        onCompleteSet={(setId) => void handleCompleteSet(setId)}
                        onRemoveSet={(setId) => void handleRemoveSet(setId)}
                        onAddSet={(exerciseName) =>
                            void handleAddSet(exerciseName)
                        }
                        onToggleBodyweight={toggleExerciseBodyweight}
                        isBodyweight={exercise.isBodyweight}
                        isExpanded={expandedExercises.has(
                            `${exercise.name}-${exerciseIndex}`
                        )}
                        onToggleExpansion={() =>
                            toggleExerciseExpansion(
                                `${exercise.name}-${exerciseIndex}`
                            )
                        }
                    />
                ))}
            </div>

            {/* Complete Dialog */}
            <CompleteDialog
                isOpen={showCompleteDialog}
                notes={notes}
                onNotesChange={setNotes}
                onCancel={() => setShowCompleteDialog(false)}
                onComplete={() => void handleCompleteSession()}
            />

            {/* Floating Action Bar */}
            <FloatingActionBar
                onCancel={() => void handleCancelSession()}
                onComplete={() => setShowCompleteDialog(true)}
            />

            {/* Rest Timer */}
            {activeRestTimer && (
                <RestTimer
                    exerciseName={activeRestTimer.exerciseName}
                    restTime={activeRestTimer.restTime}
                    isActive={activeRestTimer.isActive}
                    onSkip={skipRestTimer}
                    onStartNextSet={startNextSet}
                    onComplete={startNextSet}
                />
            )}
        </div>
    );
}
