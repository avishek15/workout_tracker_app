import React, { useState } from "react";
import { FriendRequests } from "./FriendRequests";
import { FriendsList } from "./FriendsList";
import { AddFriend } from "./AddFriend";
import { SharedWorkouts } from "./SharedWorkouts";
import { FriendsWorkouts } from "./FriendsWorkouts";

type Tab = "friends" | "requests" | "add" | "shared" | "friends-workouts";

export function Social() {
    const [activeTab, setActiveTab] = useState<Tab>("friends");

    const tabs = [
        { id: "friends" as const, label: "Friends" },
        { id: "requests" as const, label: "Requests" },
        { id: "add" as const, label: "Add Friend" },
        { id: "shared" as const, label: "Shared Workouts" },
        { id: "friends-workouts" as const, label: "Friends' Workouts" },
    ];

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-background-primary rounded-lg p-1 shadow-sm border border-accent-primary/20">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md font-medium transition-colors font-source-sans text-sm sm:text-base ${
                            activeTab === tab.id
                                ? "bg-accent-primary text-white shadow-sm"
                                : "text-text-secondary hover:text-text-primary hover:bg-background-secondary"
                        }`}
                    >
                        <span className="truncate">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-background-secondary rounded-lg shadow-sm border border-accent-primary/20 min-h-[400px] sm:min-h-[500px]">
                <div className="p-4 sm:p-6">
                    {activeTab === "friends" && <FriendsList />}
                    {activeTab === "requests" && <FriendRequests />}
                    {activeTab === "add" && <AddFriend />}
                    {activeTab === "shared" && <SharedWorkouts />}
                    {activeTab === "friends-workouts" && <FriendsWorkouts />}
                </div>
            </div>
        </div>
    );
}
