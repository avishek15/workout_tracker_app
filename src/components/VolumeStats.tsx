import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
    TrendingUp,
    Calendar,
    Dumbbell,
    BarChart3,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

interface VolumeStatsProps {
    userId?: string;
    timePeriod?: "week" | "month" | "quarter" | "year";
    showDetails?: boolean;
}

export function VolumeStats({
    userId,
    timePeriod = "month",
    showDetails = false,
}: VolumeStatsProps) {
    const [expanded, setExpanded] = useState(showDetails);
    const [selectedPeriod, setSelectedPeriod] = useState(timePeriod);

    // Use different queries based on whether we're viewing own stats or friend's stats
    const myVolumeStats = useQuery(
        api.social.getMyVolumeStats,
        !userId ? { timePeriod: selectedPeriod } : "skip"
    );

    const friendVolumeStats = useQuery(
        api.social.getUserVolumeStats,
        userId ? { userId: userId as any, timePeriod: selectedPeriod } : "skip"
    );

    const volumeStats = userId ? friendVolumeStats : myVolumeStats;

    if (!volumeStats) {
        return (
            <div className="bg-background-primary rounded-lg p-6 border border-border">
                <div className="text-center text-text-secondary">
                    Loading volume stats...
                </div>
            </div>
        );
    }

    const formatVolume = (volume: number) => {
        if (volume >= 1000) {
            return `${(volume / 1000).toFixed(1)}k lbs`;
        }
        return `${Math.round(volume)} lbs`;
    };

    const formatPeriod = (period: string) => {
        switch (period) {
            case "week":
                return "This Week";
            case "month":
                return "This Month";
            case "quarter":
                return "This Quarter";
            case "year":
                return "This Year";
            default:
                return period;
        }
    };

    return (
        <div className="bg-background-primary rounded-lg border border-border">
            {/* Header */}
            <div className="p-6 border-b border-border">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="w-6 h-6 text-accent-primary" />
                        <h3 className="text-lg font-semibold text-text-primary">
                            Volume Statistics
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedPeriod}
                            onChange={(e) =>
                                setSelectedPeriod(e.target.value as any)
                            }
                            className="px-3 py-1 bg-background-secondary border border-border rounded text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
                        >
                            <option value="week">Week</option>
                            <option value="month">Month</option>
                            <option value="quarter">Quarter</option>
                            <option value="year">Year</option>
                        </select>
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="p-1 hover:bg-background-secondary rounded transition-colors"
                        >
                            {expanded ? (
                                <ChevronUp className="w-4 h-4 text-text-secondary" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-text-secondary" />
                            )}
                        </button>
                    </div>
                </div>
                <p className="text-sm text-text-secondary mt-1">
                    {formatPeriod(selectedPeriod)}
                </p>
            </div>

            {/* Main Stats */}
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-background-secondary rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                            <Dumbbell className="w-5 h-5 text-accent-primary" />
                        </div>
                        <div className="text-2xl font-bold text-accent-primary">
                            {formatVolume(volumeStats.totalVolume)}
                        </div>
                        <div className="text-sm text-text-secondary">
                            Total Volume
                        </div>
                    </div>

                    <div className="text-center p-4 bg-background-secondary rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                            <Calendar className="w-5 h-5 text-accent-primary" />
                        </div>
                        <div className="text-2xl font-bold text-accent-primary">
                            {volumeStats.totalWorkouts}
                        </div>
                        <div className="text-sm text-text-secondary">
                            Workouts
                        </div>
                    </div>

                    <div className="text-center p-4 bg-background-secondary rounded-lg">
                        <div className="flex items-center justify-center mb-2">
                            <TrendingUp className="w-5 h-5 text-accent-primary" />
                        </div>
                        <div className="text-2xl font-bold text-accent-primary">
                            {formatVolume(volumeStats.averageVolumePerWorkout)}
                        </div>
                        <div className="text-sm text-text-secondary">
                            Avg/Workout
                        </div>
                    </div>
                </div>

                {/* Detailed Stats (Expandable) */}
                {expanded && (
                    <div className="space-y-6">
                        {/* Volume by Exercise */}
                        {volumeStats.volumeByExercise.length > 0 && (
                            <div>
                                <h4 className="text-md font-semibold text-text-primary mb-3">
                                    Volume by Exercise
                                </h4>
                                <div className="space-y-2">
                                    {volumeStats.volumeByExercise
                                        .slice(0, 5)
                                        .map((exercise) => (
                                            <div
                                                key={exercise.exerciseName}
                                                className="flex justify-between items-center p-3 bg-background-secondary rounded-lg"
                                            >
                                                <div>
                                                    <div className="font-medium text-text-primary">
                                                        {exercise.exerciseName}
                                                    </div>
                                                    <div className="text-sm text-text-secondary">
                                                        {exercise.totalSets}{" "}
                                                        sets •{" "}
                                                        {Math.round(
                                                            exercise.averageWeight
                                                        )}{" "}
                                                        lbs avg
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-medium text-accent-primary">
                                                        {formatVolume(
                                                            exercise.totalVolume
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Weekly Volume Chart */}
                        {volumeStats.volumeByWeek.length > 0 && (
                            <div>
                                <h4 className="text-md font-semibold text-text-primary mb-3">
                                    Weekly Progress
                                </h4>
                                <div className="space-y-2">
                                    {volumeStats.volumeByWeek.map((week) => (
                                        <div
                                            key={week.weekStart}
                                            className="flex justify-between items-center p-3 bg-background-secondary rounded-lg"
                                        >
                                            <div>
                                                <div className="font-medium text-text-primary">
                                                    {new Date(
                                                        week.weekStart
                                                    ).toLocaleDateString()}
                                                </div>
                                                <div className="text-sm text-text-secondary">
                                                    {week.workoutCount} workout
                                                    {week.workoutCount !== 1
                                                        ? "s"
                                                        : ""}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium text-accent-primary">
                                                    {formatVolume(
                                                        week.totalVolume
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {volumeStats.volumeByExercise.length === 0 &&
                            volumeStats.volumeByWeek.length === 0 && (
                                <div className="text-center py-8">
                                    <BarChart3 className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                                    <p className="text-text-secondary">
                                        No volume data available
                                    </p>
                                    <p className="text-sm text-text-secondary">
                                        Complete some workouts to see your
                                        volume statistics
                                    </p>
                                </div>
                            )}
                    </div>
                )}
            </div>
        </div>
    );
}
