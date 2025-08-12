import React, { useState } from "react";
import { FriendRequests } from "./FriendRequests";
import { FriendsList } from "./FriendsList";
import { AddFriend } from "./AddFriend";
import { SharedWorkouts } from "./SharedWorkouts";
import { FriendsWorkouts } from "./FriendsWorkouts";
import { SocialDashboard } from "./SocialDashboard";
import { ComparisonDashboard } from "./ComparisonDashboard";
import { Achievements } from "./Achievements";

type Tab =
    | "dashboard"
    | "friends"
    | "requests"
    | "add"
    | "shared"
    | "friends-workouts"
    | "comparison"
    | "achievements";

export function Social() {
    const [activeTab, setActiveTab] = useState<Tab>("dashboard");

    const tabs = [
        { id: "dashboard" as const, label: "Dashboard" },
        { id: "friends" as const, label: "Friends" },
        { id: "requests" as const, label: "Requests" },
        { id: "add" as const, label: "Add Friend" },
        { id: "shared" as const, label: "Shared with Me" },
        { id: "friends-workouts" as const, label: "Friends' Workouts" },
        { id: "comparison" as const, label: "Compare Progress" },
        { id: "achievements" as const, label: "Achievements" },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case "dashboard":
                return <SocialDashboard />;
            case "friends":
                return <FriendsList />;
            case "requests":
                return <FriendRequests />;
            case "add":
                return <AddFriend onClose={() => setActiveTab("dashboard")} />;
            case "shared":
                return <SharedWorkouts />;
            case "friends-workouts":
                return <FriendsWorkouts />;
            case "comparison":
                return <ComparisonDashboard />;
            case "achievements":
                return <Achievements />;
            default:
                return <SocialDashboard />;
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 border-b border-border pb-4">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            activeTab === tab.id
                                ? "bg-accent-primary text-white"
                                : "bg-background-primary text-text-secondary hover:text-text-primary hover:bg-background-secondary"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div>{renderTabContent()}</div>
        </div>
    );
}
