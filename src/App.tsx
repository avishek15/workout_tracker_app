import { useConvexAuth } from "convex/react";
import { SignInForm } from "./components/SignInForm";
import { SignOutButton } from "./components/SignOutButton";
import { UserProfileHeader } from "./components/UserProfileHeader";
import { WorkoutDashboard } from "./components/WorkoutDashboard";
import { ProgressDashboard } from "./components/ProgressDashboard";
import { SessionHistory } from "./components/SessionHistory";
import { Profile } from "./components/Profile";
import { LandingPage } from "./LandingPage";
import { useState } from "react";
import { Toaster } from "sonner";

function App() {
    const { isAuthenticated, isLoading } = useConvexAuth();
    const [activeTab, setActiveTab] = useState<
        "workouts" | "progress" | "history" | "profile"
    >("workouts");

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background-primary flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-accent-primary/20 border-t-accent-primary mx-auto mb-6"></div>
                    <h2 className="text-xl font-semibold text-text-primary mb-2 font-montserrat">
                        Loading FitFlow Pro
                    </h2>
                    <p className="text-text-secondary font-source-sans">
                        Getting everything ready...
                    </p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <LandingPage />;
    }

    return (
        <div className="min-h-screen bg-background-primary">
            {/* Header */}
            <header className="bg-background-secondary shadow-sm border-b border-accent-primary/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-accent-primary rounded-lg flex items-center justify-center">
                                <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 10V3L4 14h7v7l9-11h-7z"
                                    />
                                </svg>
                            </div>
                            <h1 className="text-xl font-bold text-text-primary font-montserrat">
                                FitFlow Pro
                            </h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <UserProfileHeader
                                onNavigateToProfile={() =>
                                    setActiveTab("profile")
                                }
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="bg-background-secondary border-b border-accent-primary/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex overflow-x-auto">
                        <div className="flex space-x-6 sm:space-x-8 min-w-full">
                            <button
                                onClick={() => setActiveTab("workouts")}
                                className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-sm transition-colors font-source-sans whitespace-nowrap flex-shrink-0 ${
                                    activeTab === "workouts"
                                        ? "border-accent-primary text-accent-primary"
                                        : "border-transparent text-text-secondary hover:text-text-primary hover:border-accent-primary/50"
                                }`}
                            >
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                        />
                                    </svg>
                                    <span>Workouts</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab("history")}
                                className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-sm transition-colors font-source-sans whitespace-nowrap flex-shrink-0 ${
                                    activeTab === "history"
                                        ? "border-accent-primary text-accent-primary"
                                        : "border-transparent text-text-secondary hover:text-text-primary hover:border-accent-primary/50"
                                }`}
                            >
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                    </svg>
                                    <span>History</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab("progress")}
                                className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-sm transition-colors font-source-sans whitespace-nowrap flex-shrink-0 ${
                                    activeTab === "progress"
                                        ? "border-accent-primary text-accent-primary"
                                        : "border-transparent text-text-secondary hover:text-text-primary hover:border-accent-primary/50"
                                }`}
                            >
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                        />
                                    </svg>
                                    <span>Progress</span>
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab("profile")}
                                className={`py-4 px-2 sm:px-1 border-b-2 font-medium text-sm transition-colors font-source-sans whitespace-nowrap flex-shrink-0 ${
                                    activeTab === "profile"
                                        ? "border-accent-primary text-accent-primary"
                                        : "border-transparent text-text-secondary hover:text-text-primary hover:border-accent-primary/50"
                                }`}
                            >
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                    <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                    <span>Profile</span>
                                </div>
                            </button>
                        </div>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="bg-background-secondary rounded-xl shadow-sm border border-accent-primary/20 overflow-hidden">
                    {activeTab === "workouts" && <WorkoutDashboard />}
                    {activeTab === "history" && <SessionHistory />}
                    {activeTab === "progress" && <ProgressDashboard />}
                    {activeTab === "profile" && <Profile />}
                </div>
            </main>
            <Toaster position="top-right" />
        </div>
    );
}

export default App;
