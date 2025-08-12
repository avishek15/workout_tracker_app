import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface AddFriendProps {
    onClose: () => void;
}

export function AddFriend({ onClose }: AddFriendProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const sendFriendRequest = useMutation(api.social.sendFriendRequest);
    const searchUsers = useQuery(api.social.searchUsers, {
        query: searchQuery,
    });

    const handleSendRequest = async (userId: string) => {
        try {
            await sendFriendRequest({ toUserId: userId as any });
            alert("Friend request sent!");
            setSearchQuery("");
        } catch (error) {
            alert("Failed to send friend request: " + (error as Error).message);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-text-primary">
                Add Friend
            </h2>

            <div className="space-y-4">
                <div>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 border border-accent-primary/20 rounded-md bg-background-primary text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    />
                </div>

                {searchQuery.length >= 2 && (
                    <div className="space-y-2">
                        {searchUsers === undefined ? (
                            <div className="text-center text-text-secondary py-4">
                                Loading...
                            </div>
                        ) : searchUsers.length === 0 ? (
                            <div className="text-center text-text-secondary py-4">
                                No users found
                            </div>
                        ) : (
                            searchUsers.map((user) => (
                                <div
                                    key={user._id}
                                    className="flex items-center justify-between bg-background-primary rounded p-3 border border-accent-primary/20"
                                >
                                    <div className="flex items-center space-x-3">
                                        {user.image && (
                                            <img
                                                src={user.image}
                                                alt={user.name || "User"}
                                                className="w-8 h-8 rounded-full"
                                            />
                                        )}
                                        <div>
                                            <p className="font-medium text-text-primary">
                                                {user.name || "Unknown User"}
                                            </p>
                                            <p className="text-sm text-text-secondary">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() =>
                                            handleSendRequest(user._id)
                                        }
                                        className="px-3 py-1 bg-accent-secondary text-white rounded text-sm hover:bg-accent-secondary/90 transition-colors"
                                    >
                                        Add Friend
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
