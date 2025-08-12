import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface ShareWorkoutProps {
    friend: {
        userId: string;
        name?: string;
        email?: string;
    };
    onShare: (workoutId: string, friendUserId: string) => Promise<void>;
    onClose: () => void;
}

export function ShareWorkout({ friend, onShare, onClose }: ShareWorkoutProps) {
    const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>("");
    const workouts = useQuery(api.workouts.list);

    const handleShare = async () => {
        if (!selectedWorkoutId) {
            alert("Please select a workout to share");
            return;
        }
        await onShare(selectedWorkoutId, friend.userId);
    };

    if (workouts === undefined) {
        return (
            <div className="text-center text-text-secondary">Loading...</div>
        );
    }

    return (
        <div className="bg-background-primary rounded-lg p-4 border border-accent-primary/20">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-text-primary">
                    Share Workout with {friend.name || "Friend"}
                </h3>
                <button
                    onClick={onClose}
                    className="text-text-secondary hover:text-text-primary"
                >
                    ✕
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                        Select Workout
                    </label>
                    <select
                        value={selectedWorkoutId}
                        onChange={(e) => setSelectedWorkoutId(e.target.value)}
                        className="w-full px-3 py-2 border border-accent-primary/20 rounded-md bg-background-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary"
                    >
                        <option value="">Choose a workout...</option>
                        {workouts.map((workout) => (
                            <option key={workout._id} value={workout._id}>
                                {workout.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex space-x-2">
                    <button
                        onClick={handleShare}
                        disabled={!selectedWorkoutId}
                        className="px-4 py-2 bg-accent-primary text-white rounded-md hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Share Workout
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-background-secondary text-text-primary rounded-md hover:bg-background-primary transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
