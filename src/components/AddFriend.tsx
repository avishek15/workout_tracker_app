import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface AddFriendProps {
    onClose: () => void;
}

export function AddFriend({ onClose }: AddFriendProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const sendFriendRequest = useMutation(api.social.sendFriendRequest);
    const friends = useQuery(api.social.getFriends);

    // Debounce the search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const searchUsers = useQuery(
        api.social.searchUsers,
        debouncedQuery.length >= 2 ? { query: debouncedQuery } : "skip"
    );

    const handleSendRequest = async (userId: string) => {
        try {
            await sendFriendRequest({ toUserId: userId as any });
        } catch (error) {
            console.error("Failed to send friend request:", error);
        }
    };

    const isAlreadyFriend = (userId: string) => {
        return friends?.some((friend) => friend.userId === userId) || false;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-primary">
                    Add Friend
                </h2>
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-background-secondary text-text-primary rounded-lg hover:bg-background-primary transition-colors"
                >
                    Close
                </button>
            </div>

            {/* Search Input */}
            <div>
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 bg-background-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                />
            </div>

            {/* Search Results */}
            <div className="space-y-4">
                {searchQuery.length < 2 ? (
                    <p className="text-text-secondary text-center py-8">
                        Enter at least 2 characters to search
                    </p>
                ) : searchUsers === undefined ? (
                    <p className="text-text-secondary text-center py-8">
                        Loading...
                    </p>
                ) : searchUsers.length === 0 ? (
                    <p className="text-text-secondary text-center py-8">
                        No users found
                    </p>
                ) : (
                    searchUsers.map((user) => {
                        const isFriend = isAlreadyFriend(user._id);
                        return (
                            <div
                                key={user._id}
                                className="flex items-center justify-between p-4 bg-background-primary rounded-lg border border-border"
                            >
                                <div className="flex items-center space-x-3">
                                    {user.image ? (
                                        <img
                                            src={user.image}
                                            alt={user.name || "User"}
                                            className="w-10 h-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-accent-primary/20 flex items-center justify-center">
                                            <span className="text-accent-primary font-medium">
                                                {(
                                                    user.name ||
                                                    user.email ||
                                                    "U"
                                                )
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </span>
                                        </div>
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
                                        void handleSendRequest(user._id)
                                    }
                                    disabled={isFriend}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                        isFriend
                                            ? "bg-gray-400 text-white cursor-not-allowed"
                                            : "bg-accent-primary text-white hover:bg-accent-primary/90"
                                    }`}
                                >
                                    {isFriend
                                        ? "Already Friends"
                                        : "Add Friend"}
                                </button>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
