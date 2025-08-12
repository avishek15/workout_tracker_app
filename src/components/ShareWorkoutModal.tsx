import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { X } from "lucide-react";

interface ShareWorkoutModalProps {
    workout: any;
    onClose: () => void;
}

export function ShareWorkoutModal({
    workout,
    onClose,
}: ShareWorkoutModalProps) {
    const [selectedFriendId, setSelectedFriendId] = useState<string>("");
    const friends = useQuery(api.social.getFriends);
    const shareWorkout = useMutation(api.social.shareWorkout);

    const handleShare = async () => {
        if (!selectedFriendId) {
            alert("Please select a friend to share with");
            return;
        }

        try {
            await shareWorkout({
                workoutId: workout._id as any,
                friendUserId: selectedFriendId as any,
            });
            alert("Workout shared successfully!");
            onClose();
        } catch (error) {
            alert("Failed to share workout: " + (error as Error).message);
        }
    };

    if (friends === undefined) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-background-secondary rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="text-center text-text-secondary">
                        Loading...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-background-secondary rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-text-primary">
                        Share "{workout.name}"
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-text-secondary hover:text-text-primary"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Select Friend
                        </label>
                        <select
                            value={selectedFriendId}
                            onChange={(e) =>
                                setSelectedFriendId(e.target.value)
                            }
                            className="w-full px-3 py-2 border border-accent-primary/20 rounded-md bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                        >
                            <option value="">Choose a friend...</option>
                            {friends.map((friend) => (
                                <option
                                    key={friend.userId}
                                    value={friend.userId}
                                >
                                    {friend.name || friend.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    {friends.length === 0 && (
                        <div className="text-center text-text-secondary py-4">
                            <p>
                                No friends yet. Add friends to share workouts!
                            </p>
                        </div>
                    )}

                    <div className="flex space-x-2">
                        <button
                            onClick={handleShare}
                            disabled={!selectedFriendId || friends.length === 0}
                            className="flex-1 px-4 py-2 bg-accent-primary text-white rounded-md hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Share Workout
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-background-primary text-text-primary rounded-md hover:bg-background-secondary transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
