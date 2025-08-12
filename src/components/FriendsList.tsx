import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function FriendsList() {
    const friends = useQuery(api.social.getFriends);

    if (friends === undefined) {
        return (
            <div className="text-center text-text-secondary">Loading...</div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-text-primary">Friends</h2>

            {friends.length === 0 ? (
                <div className="text-center text-text-secondary py-8">
                    <p>
                        No friends yet. Add some friends to start sharing
                        workouts!
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {friends.map((friend) => (
                        <div
                            key={friend.userId}
                            className="bg-background-primary rounded-lg p-4 border border-accent-primary/20"
                        >
                            <div className="flex items-center space-x-3">
                                {friend.image && (
                                    <img
                                        src={friend.image}
                                        alt={friend.name || "Friend"}
                                        className="w-10 h-10 rounded-full"
                                    />
                                )}
                                <div>
                                    <h3 className="font-medium text-text-primary">
                                        {friend.name || "Unknown User"}
                                    </h3>
                                    <p className="text-sm text-text-secondary">
                                        {friend.email}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
