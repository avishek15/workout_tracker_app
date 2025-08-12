import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
    BarChart3,
    TrendingUp,
    Users,
    Calendar,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface ProgressComparisonProps {
    friendUserId: Id<"users">;
}

export function ProgressComparison({ friendUserId }: ProgressComparisonProps) {
    const [timePeriod, setTimePeriod] = useState<
        "week" | "month" | "quarter" | "year"
    >("month");
    const [expanded, setExpanded] = useState(false);

    // Get both users' volume stats
    const myStats = useQuery(api.social.getMyVolumeStats, { timePeriod });
    const friendStats = useQuery(api.social.getUserVolumeStats, {
        userId: friendUserId,
        timePeriod,
    });

    // Get friend's basic info
    const friends = useQuery(api.social.getFriends);
    const friend = friends?.find((f) => f.userId === friendUserId);

    if (!myStats || !friendStats || !friend) {
        return (
            <div className="bg-background-primary rounded-lg p-6 border border-border">
                <div className="text-center text-text-secondary">
                    Loading comparison...
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

    const getComparisonColor = (myValue: number, friendValue: number) => {
        if (myValue > friendValue) return "text-green-600";
        if (myValue < friendValue) return "text-red-600";
        return "text-gray-600";
    };

    const getComparisonIcon = (myValue: number, friendValue: number) => {
        if (myValue > friendValue) return "🏆";
        if (myValue < friendValue) return "🥈";
        return "🤝";
    };

    return (
        <div className="bg-background-primary rounded-lg border border-border">
            {/* Header */}
            <div className="p-6 border-b border-border">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <BarChart3 className="w-6 h-6 text-accent-primary" />
                        <h3 className="text-lg font-semibold text-text-primary">
                            Progress Comparison
                        </h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={timePeriod}
                            onChange={(e) =>
                                setTimePeriod(e.target.value as any)
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
                    {formatPeriod(timePeriod)} • vs {friend.name || "Friend"}
                </p>
            </div>

            {/* Main Comparison */}
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Total Volume */}
                    <div className="text-center p-4 bg-background-secondary rounded-lg">
                        <div className="text-sm text-text-secondary mb-2">
                            Total Volume
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <div className="text-lg font-bold text-accent-primary">
                                    {formatVolume(myStats.totalVolume)}
                                </div>
                                <div className="text-xs text-text-secondary">
                                    You
                                </div>
                            </div>
                            <div>
                                <div
                                    className={`text-lg font-bold ${getComparisonColor(myStats.totalVolume, friendStats.totalVolume)}`}
                                >
                                    {formatVolume(friendStats.totalVolume)}
                                </div>
                                <div className="text-xs text-text-secondary">
                                    {friend.name}
                                </div>
                            </div>
                        </div>
                        <div className="text-sm mt-2">
                            {getComparisonIcon(
                                myStats.totalVolume,
                                friendStats.totalVolume
                            )}
                            {myStats.totalVolume > friendStats.totalVolume
                                ? " You're ahead!"
                                : myStats.totalVolume < friendStats.totalVolume
                                  ? " They're ahead!"
                                  : " You're tied!"}
                        </div>
                    </div>

                    {/* Workout Count */}
                    <div className="text-center p-4 bg-background-secondary rounded-lg">
                        <div className="text-sm text-text-secondary mb-2">
                            Workouts
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <div className="text-lg font-bold text-accent-primary">
                                    {myStats.totalWorkouts}
                                </div>
                                <div className="text-xs text-text-secondary">
                                    You
                                </div>
                            </div>
                            <div>
                                <div
                                    className={`text-lg font-bold ${getComparisonColor(myStats.totalWorkouts, friendStats.totalWorkouts)}`}
                                >
                                    {friendStats.totalWorkouts}
                                </div>
                                <div className="text-xs text-text-secondary">
                                    {friend.name}
                                </div>
                            </div>
                        </div>
                        <div className="text-sm mt-2">
                            {getComparisonIcon(
                                myStats.totalWorkouts,
                                friendStats.totalWorkouts
                            )}
                            {myStats.totalWorkouts > friendStats.totalWorkouts
                                ? " More active!"
                                : myStats.totalWorkouts <
                                    friendStats.totalWorkouts
                                  ? " They're more active!"
                                  : " Same activity!"}
                        </div>
                    </div>

                    {/* Average Volume */}
                    <div className="text-center p-4 bg-background-secondary rounded-lg">
                        <div className="text-sm text-text-secondary mb-2">
                            Avg/Workout
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <div className="text-lg font-bold text-accent-primary">
                                    {formatVolume(
                                        myStats.averageVolumePerWorkout
                                    )}
                                </div>
                                <div className="text-xs text-text-secondary">
                                    You
                                </div>
                            </div>
                            <div>
                                <div
                                    className={`text-lg font-bold ${getComparisonColor(myStats.averageVolumePerWorkout, friendStats.averageVolumePerWorkout)}`}
                                >
                                    {formatVolume(
                                        friendStats.averageVolumePerWorkout
                                    )}
                                </div>
                                <div className="text-xs text-text-secondary">
                                    {friend.name}
                                </div>
                            </div>
                        </div>
                        <div className="text-sm mt-2">
                            {getComparisonIcon(
                                myStats.averageVolumePerWorkout,
                                friendStats.averageVolumePerWorkout
                            )}
                            {myStats.averageVolumePerWorkout >
                            friendStats.averageVolumePerWorkout
                                ? " Higher intensity!"
                                : myStats.averageVolumePerWorkout <
                                    friendStats.averageVolumePerWorkout
                                  ? " They're more intense!"
                                  : " Same intensity!"}
                        </div>
                    </div>
                </div>

                {/* Detailed Comparison (Expandable) */}
                {expanded && (
                    <div className="space-y-6">
                        {/* Top Exercises Comparison */}
                        {myStats.volumeByExercise.length > 0 &&
                            friendStats.volumeByExercise.length > 0 && (
                                <div>
                                    <h4 className="text-md font-semibold text-text-primary mb-3">
                                        Top Exercises Comparison
                                    </h4>
                                    <div className="space-y-3">
                                        {myStats.volumeByExercise
                                            .slice(0, 3)
                                            .map((myExercise, index) => {
                                                const friendExercise =
                                                    friendStats.volumeByExercise.find(
                                                        (e) =>
                                                            e.exerciseName ===
                                                            myExercise.exerciseName
                                                    );

                                                return (
                                                    <div
                                                        key={
                                                            myExercise.exerciseName
                                                        }
                                                        className="p-4 bg-background-secondary rounded-lg"
                                                    >
                                                        <div className="font-medium text-text-primary mb-2">
                                                            {
                                                                myExercise.exerciseName
                                                            }
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <div className="text-sm text-text-secondary">
                                                                    You
                                                                </div>
                                                                <div className="font-medium text-accent-primary">
                                                                    {formatVolume(
                                                                        myExercise.totalVolume
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-text-secondary">
                                                                    {
                                                                        myExercise.totalSets
                                                                    }{" "}
                                                                    sets
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-sm text-text-secondary">
                                                                    {
                                                                        friend.name
                                                                    }
                                                                </div>
                                                                <div
                                                                    className={`font-medium ${getComparisonColor(myExercise.totalVolume, friendExercise?.totalVolume || 0)}`}
                                                                >
                                                                    {formatVolume(
                                                                        friendExercise?.totalVolume ||
                                                                            0
                                                                    )}
                                                                </div>
                                                                <div className="text-xs text-text-secondary">
                                                                    {friendExercise?.totalSets ||
                                                                        0}{" "}
                                                                    sets
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                        {/* Weekly Progress Comparison */}
                        {myStats.volumeByWeek.length > 0 &&
                            friendStats.volumeByWeek.length > 0 && (
                                <div>
                                    <h4 className="text-md font-semibold text-text-primary mb-3">
                                        Weekly Progress
                                    </h4>
                                    <div className="space-y-2">
                                        {myStats.volumeByWeek
                                            .slice(-4)
                                            .map((myWeek) => {
                                                const friendWeek =
                                                    friendStats.volumeByWeek.find(
                                                        (w) =>
                                                            w.weekStart ===
                                                            myWeek.weekStart
                                                    );

                                                return (
                                                    <div
                                                        key={myWeek.weekStart}
                                                        className="p-3 bg-background-secondary rounded-lg"
                                                    >
                                                        <div className="text-sm text-text-secondary mb-2">
                                                            {new Date(
                                                                myWeek.weekStart
                                                            ).toLocaleDateString()}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <div className="text-sm text-text-secondary">
                                                                    You
                                                                </div>
                                                                <div className="font-medium text-accent-primary">
                                                                    {formatVolume(
                                                                        myWeek.totalVolume
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-sm text-text-secondary">
                                                                    {
                                                                        friend.name
                                                                    }
                                                                </div>
                                                                <div
                                                                    className={`font-medium ${getComparisonColor(myWeek.totalVolume, friendWeek?.totalVolume || 0)}`}
                                                                >
                                                                    {formatVolume(
                                                                        friendWeek?.totalVolume ||
                                                                            0
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                    </div>
                )}
            </div>
        </div>
    );
}
