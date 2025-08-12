import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AddFriend } from "./AddFriend";
import { ShareWorkout } from "./ShareWorkout";
import { FriendProfile } from "./FriendProfile";
import type { Id } from "../../convex/_generated/dataModel";

export function FriendsList() {
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [showShareWorkout, setShowShareWorkout] = useState(false);
    const [showFriendProfile, setShowFriendProfile] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState<{
        userId: string;
        name?: string;
        email?: string;
        image?: string;
    } | null>(null);
    const [selectedFriendForProfile, setSelectedFriendForProfile] = useState<Id<"users"> | null>(null);

    const friends = useQuery(api.social.getFriends);
    const shareWorkout = useMutation(api.social.shareWorkout);
    const publicWorkouts = useQuery(api.workouts.getFriendsPublicWorkouts);

    const handleShareWorkout = async (
        workoutId: string,
        friendUserId: string
    ) => {
        try {
            await shareWorkout({
                workoutId: workoutId as any,
                friendUserId: friendUserId as any,
            });
            alert("Workout shared successfully!");
            setShowShareWorkout(false);
            setSelectedFriend(null);
        } catch (error) {
            alert("Failed to share workout: " + (error as Error).message);
        }
    };

    const handleFriendCardClick = (friend: any) => {
        setSelectedFriendForProfile(friend.userId as Id<"users">);
        setShowFriendProfile(true);
    };

    if (friends === undefined) {
        return (
            <div className="text-center text-text-secondary">Loading...</div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-text-primary">
                    Friends
                </h2>
                <button
                    onClick={() => setShowAddFriend(true)}
                    className="px-4 py-2 bg-accent-primary text-white rounded-md hover:bg-accent-primary/90 transition-colors"
                >
                    Add Friend
                </button>
            </div>

            {showAddFriend && (
                <AddFriend onClose={() => setShowAddFriend(false)} />
            )}

            {showShareWorkout && selectedFriend && (
                <ShareWorkout
                    friend={selectedFriend}
                    onShare={handleShareWorkout}
                    onClose={() => {
                        setShowShareWorkout(false);
                        setSelectedFriend(null);
                    }}
                />
            )}

            {showFriendProfile && selectedFriendForProfile && (
                <FriendProfile
                    friendUserId={selectedFriendForProfile}
                    onClose={() => {
                        setShowFriendProfile(false);
                        setSelectedFriendForProfile(null);
                    }}
                />
            )}

            {friends.length === 0 ? (
                <div className="text-center text-text-secondary py-8">
                    <p>
                        No friends yet. Add some friends to start sharing
                        workouts!
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {friends.map((friend) => (
                        <div
                            key={friend.userId}
                            className="bg-background-primary rounded-lg p-4 border border-accent-primary/20 hover:shadow-lg transition-all duration-200 cursor-pointer"
                            onClick={() => handleFriendCardClick(friend)}
                        >
                            <div className="flex items-center space-x-3 mb-3">
                                {friend.image ? (
                                    <img
                                        src={friend.image}
                                        alt={friend.name || "Friend"}
                                        className="w-12 h-12 rounded-full object-cover"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = "none";
                                            target.nextElementSibling?.classList.remove("hidden");
                                        }}
                                    />
                                ) : null}
                                {!friend.image && (
                                    <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center text-accent-primary font-medium">
                                        {(friend.name || friend.email || "F").charAt(0).toUpperCase()}
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
                            </div>
                            
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFriend(friend);
                                        setShowShareWorkout(true);
                                    }}
                                    className="flex-1 px-3 py-2 bg-accent-secondary text-white rounded text-sm hover:bg-accent-secondary/90 transition-colors"
                                >
                                    Share Workout
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleFriendCardClick(friend);
                                    }}
                                    className="px-3 py-2 bg-accent-primary text-white rounded text-sm hover:bg-accent-primary/90 transition-colors"
                                >
                                    View Profile
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
