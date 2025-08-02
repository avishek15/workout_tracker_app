import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { WorkoutList } from "./WorkoutList";
import { CreateWorkout } from "./CreateWorkout";
import { ActiveSession } from "./ActiveSession";

type Tab = "workouts" | "active";

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
        { id: "workouts" as const, label: "Workouts" },
        {
            id: "active" as const,
            label: "Active Session",
            badge: activeSession ? "●" : null,
        },
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
                        {tab.badge && (
                            <span
                                className={`text-xs flex-shrink-0 ${activeTab === tab.id ? "text-white" : "text-accent-secondary"}`}
                            >
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="bg-background-secondary rounded-lg shadow-sm border border-accent-primary/20 min-h-[400px] sm:min-h-[500px]">
                {activeTab === "workouts" && (
                    <div className="p-4 sm:p-6">
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
                    <div className="p-4 sm:p-6">
                        <ActiveSession />
                    </div>
                )}
            </div>
        </div>
    );
}
