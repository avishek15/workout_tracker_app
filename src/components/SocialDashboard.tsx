import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
    Trophy,
    TrendingUp,
    Users,
    Share2,
    Bell,
    Activity,
    Calendar,
    Target,
    BarChart3,
} from "lucide-react";
import { VolumeStats } from "./VolumeStats";

type LeaderboardsData = {
    mostActive: Array<{ userId: string; name?: string; workouts: number }>;
    longestStreaks: Array<{ userId: string; name?: string; streak: number }>;
    mostShared: Array<{ userId: string; name?: string; shares: number }>;
};

export function SocialDashboard() {
    const friends = useQuery(api.social.getFriends);
    const leaderboards = useQuery(api.social.getFriendsLeaderboards) as
        | LeaderboardsData
        | undefined;
    const pendingRequests = useQuery(api.social.getPendingFriendRequests);
    const sharedWorkouts = useQuery(api.social.getSharedWorkouts);
    const friendsPublicWorkouts = useQuery(api.social.getFriendsPublicWorkouts);

    // Calculate quick stats
    const totalFriends = friends?.length || 0;
    const totalPendingRequests = pendingRequests?.length || 0;
    const totalSharedWorkouts = sharedWorkouts?.length || 0;
    const totalPublicWorkouts = friendsPublicWorkouts?.length || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-primary">
                    Social Dashboard
                </h2>
                <div className="flex items-center gap-2 text-text-secondary">
                    <Activity className="w-5 h-5" />
                    <span>Live Activity</span>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-background-primary rounded-lg p-4 border border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-secondary">
                                Friends
                            </p>
                            <p className="text-2xl font-bold text-accent-primary">
                                {totalFriends}
                            </p>
                        </div>
                        <Users className="w-8 h-8 text-accent-primary/60" />
                    </div>
                </div>

                <div className="bg-background-primary rounded-lg p-4 border border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-secondary">
                                Pending Requests
                            </p>
                            <p className="text-2xl font-bold text-accent-secondary">
                                {totalPendingRequests}
                            </p>
                        </div>
                        <Bell className="w-8 h-8 text-accent-secondary/60" />
                    </div>
                </div>

                <div className="bg-background-primary rounded-lg p-4 border border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-secondary">
                                Shared with You
                            </p>
                            <p className="text-2xl font-bold text-accent-primary">
                                {totalSharedWorkouts}
                            </p>
                        </div>
                        <Share2 className="w-8 h-8 text-accent-primary/60" />
                    </div>
                </div>

                <div className="bg-background-primary rounded-lg p-4 border border-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-secondary">
                                Public Plans
                            </p>
                            <p className="text-2xl font-bold text-accent-primary">
                                {totalPublicWorkouts}
                            </p>
                        </div>
                        <Target className="w-8 h-8 text-accent-primary/60" />
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Critical Updates */}
                <div className="bg-background-primary rounded-lg p-6 border border-border">
                    <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-accent-secondary" />
                        Critical Updates
                    </h3>

                    <div className="space-y-4">
                        {totalPendingRequests > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-accent-secondary/10 rounded-lg border border-accent-secondary/20">
                                <div className="w-3 h-3 bg-accent-secondary rounded-full"></div>
                                <div className="flex-1">
                                    <p className="font-medium text-text-primary">
                                        {totalPendingRequests} new friend
                                        request
                                        {totalPendingRequests !== 1 ? "s" : ""}
                                    </p>
                                    <p className="text-sm text-text-secondary">
                                        You have pending friend requests to
                                        review
                                    </p>
                                </div>
                            </div>
                        )}

                        {totalSharedWorkouts > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-accent-primary/10 rounded-lg border border-accent-primary/20">
                                <div className="w-3 h-3 bg-accent-primary rounded-full"></div>
                                <div className="flex-1">
                                    <p className="font-medium text-text-primary">
                                        {totalSharedWorkouts} new shared workout
                                        {totalSharedWorkouts !== 1 ? "s" : ""}
                                    </p>
                                    <p className="text-sm text-text-secondary">
                                        Friends have shared workouts with you
                                    </p>
                                </div>
                            </div>
                        )}

                        {totalPendingRequests === 0 &&
                            totalSharedWorkouts === 0 && (
                                <div className="text-center py-8">
                                    <Bell className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                                    <p className="text-text-secondary">
                                        No new updates
                                    </p>
                                    <p className="text-sm text-text-secondary">
                                        You're all caught up!
                                    </p>
                                </div>
                            )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-background-primary rounded-lg p-6 border border-border">
                    <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-accent-primary" />
                        Recent Activity
                    </h3>

                    <div className="space-y-3">
                        {friendsPublicWorkouts &&
                        friendsPublicWorkouts.length > 0 ? (
                            friendsPublicWorkouts.slice(0, 3).map((workout) => (
                                <div
                                    key={workout._id}
                                    className="flex items-center gap-3 p-3 bg-background-secondary rounded-lg"
                                >
                                    <div className="w-8 h-8 bg-accent-primary/20 rounded-full flex items-center justify-center">
                                        <Target className="w-4 h-4 text-accent-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-text-primary truncate">
                                            {workout.userName || "Friend"}{" "}
                                            shared a workout
                                        </p>
                                        <p className="text-sm text-text-secondary truncate">
                                            {workout.name}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8">
                                <Activity className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                                <p className="text-text-secondary">
                                    No recent activity
                                </p>
                                <p className="text-sm text-text-secondary">
                                    Friends haven't been active lately
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Leaderboards */}
            <div className="bg-background-primary rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-accent-primary" />
                    Leaderboards
                </h3>

                <div className="grid md:grid-cols-3 gap-6">
                    {/* Most Active Friends */}
                    <div>
                        <h4 className="font-medium text-text-primary mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Most Active
                        </h4>
                        <div className="space-y-2">
                            {leaderboards &&
                            leaderboards.mostActive.length > 0 ? (
                                leaderboards.mostActive.map(
                                    (
                                        entry: {
                                            userId: string;
                                            name?: string;
                                            workouts: number;
                                        },
                                        index: number
                                    ) => (
                                        <div
                                            key={`${entry.userId}`}
                                            className="flex items-center gap-3 p-2 bg-background-secondary rounded"
                                        >
                                            <div className="w-6 h-6 bg-accent-primary/20 rounded-full flex items-center justify-center text-xs font-medium text-accent-primary">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-text-primary truncate">
                                                    {entry.name ||
                                                        "Unknown User"}
                                                </p>
                                            </div>
                                            <div className="text-sm text-text-secondary">
                                                {entry.workouts} wkts
                                            </div>
                                        </div>
                                    )
                                )
                            ) : (
                                <p className="text-text-secondary text-sm">
                                    No friends yet
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Workout Streaks */}
                    <div>
                        <h4 className="font-medium text-text-primary mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Longest Streaks
                        </h4>
                        <div className="space-y-2">
                            {leaderboards &&
                            leaderboards.longestStreaks.length > 0 ? (
                                leaderboards.longestStreaks.map(
                                    (
                                        entry: {
                                            userId: string;
                                            name?: string;
                                            streak: number;
                                        },
                                        index: number
                                    ) => (
                                        <div
                                            key={`${entry.userId}`}
                                            className="flex items-center gap-3 p-2 bg-background-secondary rounded"
                                        >
                                            <div className="w-6 h-6 bg-accent-secondary/20 rounded-full flex items-center justify-center text-xs font-medium text-accent-secondary">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-text-primary truncate">
                                                    {entry.name ||
                                                        "Unknown User"}
                                                </p>
                                            </div>
                                            <div className="text-sm text-text-secondary">
                                                {entry.streak} days
                                            </div>
                                        </div>
                                    )
                                )
                            ) : (
                                <p className="text-text-secondary text-sm">
                                    No friends yet
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Most Shared Workouts */}
                    <div>
                        <h4 className="font-medium text-text-primary mb-3 flex items-center gap-2">
                            <Share2 className="w-4 h-4" />
                            Most Shared
                        </h4>
                        <div className="space-y-2">
                            {leaderboards &&
                            leaderboards.mostShared.length > 0 ? (
                                leaderboards.mostShared.map(
                                    (
                                        entry: {
                                            userId: string;
                                            name?: string;
                                            shares: number;
                                        },
                                        index: number
                                    ) => (
                                        <div
                                            key={`${entry.userId}`}
                                            className="flex items-center gap-3 p-2 bg-background-secondary rounded"
                                        >
                                            <div className="w-6 h-6 bg-accent-primary/20 rounded-full flex items-center justify-center text-xs font-medium text-accent-primary">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-text-primary truncate">
                                                    {entry.name ||
                                                        "Unknown User"}
                                                </p>
                                            </div>
                                            <div className="text-sm text-text-secondary">
                                                {entry.shares} shared
                                            </div>
                                        </div>
                                    )
                                )
                            ) : (
                                <p className="text-text-secondary text-sm">
                                    No friends yet
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* My Volume Stats */}
            <div className="bg-background-primary rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-accent-primary" />
                    My Volume Stats
                </h3>
                <VolumeStats timePeriod="month" showDetails={false} />
            </div>
        </div>
    );
}
