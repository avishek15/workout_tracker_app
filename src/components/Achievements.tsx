import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Trophy, Star, Target, TrendingUp, Share2 } from "lucide-react";

export function Achievements() {
    const myStats = useQuery(api.social.getMyVolumeStats, {
        timePeriod: "month",
    });
    const friends = useQuery(api.social.getFriends);

    if (!myStats) {
        return (
            <div className="bg-background-primary rounded-lg p-6 border border-border">
                <div className="text-center text-text-secondary">
                    Loading achievements...
                </div>
            </div>
        );
    }

    // Define achievements
    const achievements = [
        {
            id: "first_workout",
            title: "First Steps",
            description: "Complete your first workout",
            icon: Star,
            unlocked: myStats.totalWorkouts >= 1,
            progress: Math.min(myStats.totalWorkouts, 1),
            target: 1,
        },
        {
            id: "workout_streak",
            title: "Consistency King",
            description: "Complete 5 workouts in a month",
            icon: TrendingUp,
            unlocked: myStats.totalWorkouts >= 5,
            progress: Math.min(myStats.totalWorkouts, 5),
            target: 5,
        },
        {
            id: "volume_milestone",
            title: "Volume Master",
            description: "Lift 10,000 lbs in a month",
            icon: Target,
            unlocked: myStats.totalVolume >= 10000,
            progress: Math.min(myStats.totalVolume, 10000),
            target: 10000,
        },
        {
            id: "intensity_champion",
            title: "Intensity Champion",
            description: "Average 500+ lbs per workout",
            icon: Trophy,
            unlocked: myStats.averageVolumePerWorkout >= 500,
            progress: Math.min(myStats.averageVolumePerWorkout, 500),
            target: 500,
        },
    ];

    const unlockedAchievements = achievements.filter((a) => a.unlocked);
    const lockedAchievements = achievements.filter((a) => !a.unlocked);

    return (
        <div className="bg-background-primary rounded-lg border border-border">
            {/* Header */}
            <div className="p-6 border-b border-border">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Trophy className="w-6 h-6 text-accent-primary" />
                        <h3 className="text-lg font-semibold text-text-primary">
                            Achievements
                        </h3>
                    </div>
                    <div className="text-sm text-text-secondary">
                        {unlockedAchievements.length} / {achievements.length}{" "}
                        unlocked
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Unlocked Achievements */}
                {unlockedAchievements.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-md font-semibold text-text-primary mb-3">
                            Unlocked ({unlockedAchievements.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {unlockedAchievements.map((achievement) => (
                                <div
                                    key={achievement.id}
                                    className="p-4 bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border border-accent-primary/20 rounded-lg"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <achievement.icon className="w-5 h-5 text-accent-primary" />
                                        <div className="font-medium text-text-primary">
                                            {achievement.title}
                                        </div>
                                    </div>
                                    <p className="text-sm text-text-secondary mb-3">
                                        {achievement.description}
                                    </p>
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs text-text-secondary">
                                            Completed!
                                        </div>
                                        <button className="p-1 hover:bg-accent-primary/20 rounded transition-colors">
                                            <Share2 className="w-4 h-4 text-accent-primary" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Locked Achievements */}
                {lockedAchievements.length > 0 && (
                    <div>
                        <h4 className="text-md font-semibold text-text-primary mb-3">
                            In Progress ({lockedAchievements.length})
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {lockedAchievements.map((achievement) => (
                                <div
                                    key={achievement.id}
                                    className="p-4 bg-background-secondary border border-border rounded-lg opacity-75"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <achievement.icon className="w-5 h-5 text-text-secondary" />
                                        <div className="font-medium text-text-primary">
                                            {achievement.title}
                                        </div>
                                    </div>
                                    <p className="text-sm text-text-secondary mb-3">
                                        {achievement.description}
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-text-secondary">
                                            <span>Progress</span>
                                            <span>
                                                {achievement.progress} /{" "}
                                                {achievement.target}
                                            </span>
                                        </div>
                                        <div className="w-full bg-background-primary rounded-full h-2">
                                            <div
                                                className="bg-accent-primary h-2 rounded-full transition-all"
                                                style={{
                                                    width: `${(achievement.progress / achievement.target) * 100}%`,
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {achievements.length === 0 && (
                    <div className="text-center py-8">
                        <Trophy className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                        <p className="text-text-secondary">
                            No achievements available
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
