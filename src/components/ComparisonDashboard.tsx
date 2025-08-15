import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ProgressComparison } from "./ProgressComparison";
import { Users, BarChart3, Trophy } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

export function ComparisonDashboard() {
    const [selectedFriendId, setSelectedFriendId] =
        useState<Id<"users"> | null>(null);
    const friends = useQuery(api.social.getFriends);

    if (!friends) {
        return (
            <div className="bg-background-primary rounded-lg p-6 border border-border">
                <div className="text-center text-text-secondary">
                    Loading friends...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Trophy className="w-6 h-6 text-accent-primary" />
                    <h2 className="text-2xl font-bold text-text-primary">
                        Progress Comparison
                    </h2>
                </div>
            </div>

            {/* Friend Selector */}
            <div className="bg-background-primary rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Select Friend to Compare
                </h3>

                {friends.length === 0 ? (
                    <div className="text-center py-8">
                        <Users className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                        <p className="text-text-secondary">
                            No friends to compare with
                        </p>
                        <p className="text-sm text-text-secondary">
                            Add some friends to start comparing your progress
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {friends.map((friend) => (
                            <button
                                key={friend.userId}
                                onClick={() =>
                                    setSelectedFriendId(friend.userId)
                                }
                                className={`p-4 rounded-lg border transition-colors ${
                                    selectedFriendId === friend.userId
                                        ? "border-accent-primary bg-accent-primary/10"
                                        : "border-border bg-background-secondary hover:border-accent-primary/50"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    {friend.image ? (
                                        <img
                                            src={friend.image}
                                            alt={friend.name || "Friend"}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
                                            <span className="text-accent-primary font-medium">
                                                {(
                                                    friend.name ||
                                                    friend.email ||
                                                    "F"
                                                )
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="text-left">
                                        <div className="font-medium text-text-primary">
                                            {friend.name || "Unknown User"}
                                        </div>
                                        <div className="text-sm text-text-secondary">
                                            {friend.email}
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Comparison Results */}
            {selectedFriendId && (
                <div className="bg-background-primary rounded-lg border border-border">
                    <ProgressComparison friendUserId={selectedFriendId} />
                </div>
            )}

            {/* Comparison Tips */}
            {!selectedFriendId && friends.length > 0 && (
                <div className="bg-background-primary rounded-lg p-6 border border-border">
                    <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-accent-primary" />
                        How to Use Progress Comparison
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-text-primary mb-2">
                                Compare Metrics
                            </h4>
                            <ul className="text-sm text-text-secondary space-y-1">
                                <li>• Total workout volume</li>
                                <li>• Number of workouts completed</li>
                                <li>• Average volume per workout</li>
                                <li>• Exercise-specific performance</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-text-primary mb-2">
                                Stay Motivated
                            </h4>
                            <ul className="text-sm text-text-secondary space-y-1">
                                <li>• Challenge yourself to improve</li>
                                <li>• Celebrate achievements together</li>
                                <li>• Learn from each other's routines</li>
                                <li>• Build friendly competition</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
