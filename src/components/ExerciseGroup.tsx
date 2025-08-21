import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Switch } from "./ui/switch";
import { SetRow } from "./SetRow";
import { formatDistanceToNow } from "date-fns";
import {
    convertFromKg,
    convertToKg,
    getUserDisplayUnit,
} from "../lib/unitConversion";

interface ExerciseGroupProps {
    exercise: any;
    exerciseIndex: number;
    totalExercises: number;
    onCompleteSet: (setId: string) => void;
    onRemoveSet: (setId: string) => void;
    onAddSet: (exerciseName: string) => void;
    onToggleBodyweight: (exerciseName: string, isBodyweight: boolean) => void;
    isBodyweight: boolean;
    isExpanded: boolean;
    onToggleExpansion: () => void;
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
    isExpanded,
    onToggleExpansion,
}: ExerciseGroupProps) {
    // Get last session performance for this exercise
    const lastPerformance = useQuery(api.exercises.getLastExercisePerformance, {
        exerciseName: exercise.name,
    });

    // Get personal records for this exercise
    const exercisePRs = useQuery(api.personalRecords.getExercisePRs, {
        exerciseName: exercise.name,
    });
    return (
        <div className="space-y-4">
            {/* Exercise Header */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
                <div
                    className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 cursor-pointer select-none"
                    role="button"
                    aria-expanded={isExpanded}
                    onClick={onToggleExpansion}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onToggleExpansion();
                        }
                    }}
                    tabIndex={0}
                >
                    <div className="flex items-center gap-3 flex-1">
                        {/* Collapse/Expand Indicator */}
                        <div
                            className="flex items-center justify-center p-1 rounded"
                            aria-hidden
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-600" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-gray-600" />
                            )}
                        </div>

                        <div className="flex-1">
                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                                {exercise.name}
                            </h3>
                            <div className="flex flex-col gap-1">
                                <p className="text-sm text-gray-600">
                                    {exercise.sets.length} set
                                    {exercise.sets.length !== 1
                                        ? "s"
                                        : ""} •{" "}
                                    {
                                        exercise.sets.filter(
                                            (s: any) => s.completed
                                        ).length
                                    }{" "}
                                    completed
                                    {(() => {
                                        const nextSet = exercise.sets.find(
                                            (s: any) => !s.completed
                                        );
                                        if (nextSet) {
                                            const setIndex =
                                                exercise.sets.indexOf(nextSet) +
                                                1;
                                            return ` • Next: Set ${setIndex}`;
                                        }
                                        return " • All done!";
                                    })()}
                                </p>

                                {/* Performance Data - Third Line */}
                                {lastPerformance && (
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                            <span>
                                                Last:{" "}
                                                {convertFromKg(
                                                    lastPerformance.averageWeight
                                                ).toFixed(1)}
                                                {getUserDisplayUnit()} ×{" "}
                                                {lastPerformance.averageReps.toFixed(
                                                    0
                                                )}
                                            </span>
                                        </div>

                                        {/* Personal Records */}
                                        {exercisePRs?.weightPR && (
                                            <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded">
                                                <span>
                                                    PR:{" "}
                                                    {convertFromKg(
                                                        exercisePRs.weightPR
                                                            .maxWeight
                                                    ).toFixed(1)}
                                                    {getUserDisplayUnit()} (
                                                    {exercisePRs.weightPR.reps})
                                                </span>
                                            </div>
                                        )}

                                        {/* Volume PR */}
                                        {exercisePRs?.volumePR && (
                                            <div className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded">
                                                <span>
                                                    Vol:{" "}
                                                    {convertFromKg(
                                                        exercisePRs.volumePR
                                                            .maxVolume
                                                    ).toFixed(0)}
                                                    {getUserDisplayUnit()}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bodyweight Toggle - Only show when expanded */}
                    {isExpanded && (
                        <div
                            className="flex items-center gap-2 sm:gap-3"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                        >
                            <Switch
                                checked={isBodyweight}
                                onCheckedChange={(checked) =>
                                    onToggleBodyweight(exercise.name, checked)
                                }
                                className="scale-110 sm:scale-125 data-[state=checked]:bg-secondary data-[state=unchecked]:bg-background-secondary [&>span]:bg-accent-primary [&>span]:border-2 [&>span]:border-black/20 shadow-md hover:shadow-lg transition-shadow border-2 border-accent-primary/30"
                            />
                            <span className="text-xs sm:text-sm font-semibold text-text-primary">
                                Bodyweight Exercise
                            </span>
                        </div>
                    )}
                </div>

                {/* Sets Content - Only show when expanded */}
                {isExpanded && (
                    <>
                        <div className="space-y-2 sm:space-y-3">
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
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                            <button
                                onClick={() => onAddSet(exercise.name)}
                                className="w-full bg-accent-primary text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-accent-primary/90 transition-colors font-medium text-sm sm:text-base min-h-[44px] sm:min-h-0"
                            >
                                + Add Set
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Exercise Separator */}
            {exerciseIndex < totalExercises - 1 && (
                <div className="flex items-center justify-center">
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
