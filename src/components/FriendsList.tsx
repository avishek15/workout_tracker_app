import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AddFriend } from "./AddFriend";
import { ShareWorkout } from "./ShareWorkout";
import { FriendProfile } from "./FriendProfile";
import {
    Search,
    Filter,
    MoreVertical,
    User,
    Share2,
    BarChart3,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

export function FriendsList() {
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [showShareWorkout, setShowShareWorkout] = useState(false);
    const [selectedFriendId, setSelectedFriendId] =
        useState<Id<"users"> | null>(null);
    const [selectedFriendForSharing, setSelectedFriendForSharing] = useState<{
        userId: string;
        name?: string;
        email?: string;
    } | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterOption, setFilterOption] = useState<
        "all" | "recent" | "active"
    >("all");

    const friends = useQuery(api.social.getFriends);
    const shareWorkout = useMutation(api.social.shareWorkout);

    // Filter friends based on search and filter options
    const filteredFriends =
        friends?.filter((friend) => {
            const matchesSearch =
                friend.name
                    ?.toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                friend.email?.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesSearch) return false;

            // TODO: Implement filter logic based on activity when we have more data
            return true;
        }) || [];

    const handleShareWorkout = async (
        workoutId: string,
        friendUserId: string
    ) => {
        try {
            await shareWorkout({
                friendUserId: friendUserId as Id<"users">,
                workoutId: workoutId as Id<"workouts">,
            });
            setShowShareWorkout(false);
            setSelectedFriendForSharing(null);
            // Show success message
        } catch (error) {
            console.error("Failed to share workout:", error);
        }
    };

    const openShareWorkout = (friend: {
        userId: Id<"users">;
        name?: string;
        email?: string;
    }) => {
        setSelectedFriendForSharing({
            userId: friend.userId,
            name: friend.name,
            email: friend.email,
        });
        setShowShareWorkout(true);
    };

    if (showAddFriend) {
        return <AddFriend onClose={() => setShowAddFriend(false)} />;
    }

    if (showShareWorkout && selectedFriendForSharing) {
        return (
            <ShareWorkout
                friend={selectedFriendForSharing}
                onShare={handleShareWorkout}
                onClose={() => {
                    setShowShareWorkout(false);
                    setSelectedFriendForSharing(null);
                }}
            />
        );
    }

    if (selectedFriendId) {
        return (
            <FriendProfile
                friendUserId={selectedFriendId}
                onClose={() => setSelectedFriendId(null)}
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-primary">
                    Friends
                </h2>
                <button
                    onClick={() => setShowAddFriend(true)}
                    className="px-4 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
                >
                    Add Friend
                </button>
            </div>

            {/* Search and Filter */}
            <div className="flex gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search friends..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-background-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    />
                </div>
                <select
                    value={filterOption}
                    onChange={(e) => setFilterOption(e.target.value as any)}
                    className="px-4 py-2 bg-background-primary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary"
                >
                    <option value="all">All Friends</option>
                    <option value="recent">Recently Active</option>
                    <option value="active">Most Active</option>
                </select>
            </div>

            {/* Friends Grid */}
            {filteredFriends.length === 0 ? (
                <div className="text-center py-12">
                    <User className="w-16 h-16 text-text-secondary mx-auto mb-4" />
                    <p className="text-text-secondary text-lg">
                        {searchQuery
                            ? "No friends found matching your search"
                            : "No friends yet"}
                    </p>
                    {!searchQuery && (
                        <button
                            onClick={() => setShowAddFriend(true)}
                            className="mt-4 px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors"
                        >
                            Add Your First Friend
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredFriends.map((friend) => (
                        <FriendCard
                            key={friend.userId}
                            friend={friend}
                            onViewProfile={() =>
                                setSelectedFriendId(friend.userId)
                            }
                            onShareWorkout={() => openShareWorkout(friend)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface FriendCardProps {
    friend: {
        userId: Id<"users">;
        name?: string;
        email?: string;
        image?: string;
    };
    onViewProfile: () => void;
    onShareWorkout: () => void;
}

function FriendCard({
    friend,
    onViewProfile,
    onShareWorkout,
}: FriendCardProps) {
    const [showActions, setShowActions] = useState(false);

    return (
        <div className="bg-background-primary rounded-lg p-4 border border-border hover:border-accent-primary/50 transition-colors relative">
            {/* Friend Info */}
            <div className="flex items-center space-x-3 mb-4">
                {friend.image ? (
                    <img
                        src={friend.image}
                        alt={friend.name || "Friend"}
                        className="w-12 h-12 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center">
                        <span className="text-accent-primary font-medium">
                            {(friend.name || friend.email || "F")
                                .charAt(0)
                                .toUpperCase()}
                        </span>
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-text-primary truncate">
                        {friend.name || "Unknown User"}
                    </h3>
                    <p className="text-sm text-text-secondary truncate">
                        {friend.email}
                    </p>
                </div>
                <button
                    onClick={() => setShowActions(!showActions)}
                    className="p-1 hover:bg-background-secondary rounded transition-colors"
                >
                    <MoreVertical className="w-4 h-4 text-text-secondary" />
                </button>
            </div>

            {/* Quick Stats (placeholder for now) */}
            <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="text-center p-2 bg-background-secondary rounded">
                    <div className="text-sm font-medium text-accent-primary">
                        0
                    </div>
                    <div className="text-xs text-text-secondary">Workouts</div>
                </div>
                <div className="text-center p-2 bg-background-secondary rounded">
                    <div className="text-sm font-medium text-accent-primary">
                        0
                    </div>
                    <div className="text-xs text-text-secondary">Streak</div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
                <button
                    onClick={onViewProfile}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors text-sm"
                >
                    <User className="w-4 h-4" />
                    Profile
                </button>
                <button
                    onClick={onShareWorkout}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-accent-secondary text-white rounded-lg hover:bg-accent-secondary/90 transition-colors text-sm"
                >
                    <Share2 className="w-4 h-4" />
                </button>
            </div>

            {/* Dropdown Actions */}
            {showActions && (
                <div className="absolute top-12 right-4 bg-background-primary border border-border rounded-lg shadow-lg z-10 min-w-32">
                    <button
                        onClick={onViewProfile}
                        className="w-full px-4 py-2 text-left hover:bg-background-secondary flex items-center gap-2"
                    >
                        <User className="w-4 h-4" />
                        View Profile
                    </button>
                    <button
                        onClick={onShareWorkout}
                        className="w-full px-4 py-2 text-left hover:bg-background-secondary flex items-center gap-2"
                    >
                        <Share2 className="w-4 h-4" />
                        Share Workout
                    </button>
                    <button className="w-full px-4 py-2 text-left hover:bg-background-secondary flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Compare Progress
                    </button>
                </div>
            )}
        </div>
    );
}
