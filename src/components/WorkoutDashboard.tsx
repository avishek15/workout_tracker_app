import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { WorkoutList } from "./WorkoutList";
import { CreateWorkout } from "./CreateWorkout";
import { ActiveSession } from "./ActiveSession";
import { SessionHistory } from "./SessionHistory";
import { ProgressDashboard } from "./ProgressDashboard";

type Tab = "workouts" | "active" | "history" | "progress";

export function WorkoutDashboard() {
    const [activeTab, setActiveTab] = useState<Tab>("workouts");
    const [showCreateWorkout, setShowCreateWorkout] = useState(false);
    const activeSession = useQuery(api.sessions.getActive);

    // If there's an active session, show it by default
    React.useEffect(() => {
        if (activeSession && activeTab !== "active") {
            setActiveTab("active");
        }
    }, [activeSession, activeTab]);

    const tabs = [
        { id: "workouts" as const, label: "Workouts", icon: "📋" },
        {
            id: "active" as const,
            label: "Active Session",
            icon: "🏃‍♂️",
            badge: activeSession ? "●" : null,
        },
        { id: "history" as const, label: "History", icon: "📊" },
        { id: "progress" as const, label: "Progress", icon: "📈" },
    ];

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm border">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                            activeTab === tab.id
                                ? "bg-primary text-white shadow-sm"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                        <span>{tab.icon}</span>
                        {tab.label}
                        {tab.badge && (
                            <span
                                className={`text-xs ${activeTab === tab.id ? "text-white" : "text-green-500"}`}
                            >
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm border min-h-[500px]">
                {activeTab === "workouts" && (
                    <div className="p-6">
                        {showCreateWorkout ? (
                            <CreateWorkout
                                onClose={() => setShowCreateWorkout(false)}
                            />
                        ) : (
                            <WorkoutList
                                onCreateNew={() => setShowCreateWorkout(true)}
                            />
                        )}
                    </div>
                )}

                {activeTab === "active" && (
                    <div className="p-6">
                        <ActiveSession />
                    </div>
                )}

                {activeTab === "history" && (
                    <div className="p-6">
                        <SessionHistory />
                    </div>
                )}

                {activeTab === "progress" && (
                    <div className="p-6">
                        <ProgressDashboard />
                    </div>
                )}
            </div>
        </div>
    );
}
