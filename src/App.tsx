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
import { ChevronDown } from "lucide-react";

function App() {
    const { isAuthenticated, isLoading } = useConvexAuth();
    const [activeTab, setActiveTab] = useState<
        "workouts" | "progress" | "history" | "profile"
    >("workouts");
    const [showMobileNav, setShowMobileNav] = useState(false);

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
                        <div className="flex items-center space-x-1">
                            <div className="">
                                <img
                                    src="/logo2.png"
                                    alt="FitFlow Pro Logo"
                                    className="w-16 h-16 p-2 object-contain"
                                />
                            </div>
                            <h1 className="text-xl font-bold text-text-primary font-montserrat">
                                FitFlow Pro
                            </h1>
                        </div>
                        <div className="flex items-center space-x-1">
                            <UserProfileHeader
                                onNavigateToProfile={() =>
                                    setActiveTab("profile")
                                }
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Dropdown */}
            <div className="md:hidden bg-background-secondary border-b border-accent-primary/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative">
                        <button
                            onClick={() => setShowMobileNav(!showMobileNav)}
                            className="w-full py-4 px-4 flex items-center justify-between text-left font-medium text-sm transition-colors font-source-sans"
                        >
                            <div className="flex items-center space-x-2">
                                {activeTab === "workouts" && (
                                    <>
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
                                        <span className="text-accent-primary">
                                            Workouts
                                        </span>
                                    </>
                                )}
                                {activeTab === "history" && (
                                    <>
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
                                        <span className="text-accent-primary">
                                            History
                                        </span>
                                    </>
                                )}
                                {activeTab === "progress" && (
                                    <>
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
                                        <span className="text-accent-primary">
                                            Progress
                                        </span>
                                    </>
                                )}
                                {activeTab === "profile" && (
                                    <>
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
                                        <span className="text-accent-primary">
                                            Profile
                                        </span>
                                    </>
                                )}
                            </div>
                            <ChevronDown
                                className={`w-4 h-4 transition-transform ${showMobileNav ? "rotate-180" : ""}`}
                            />
                        </button>

                        {showMobileNav && (
                            <div className="absolute top-full left-0 right-0 bg-white border border-accent-primary/20 rounded-b-lg shadow-lg z-50">
                                <div className="py-2">
                                    <button
                                        onClick={() => {
                                            setActiveTab("workouts");
                                            setShowMobileNav(false);
                                        }}
                                        className={`w-full px-4 py-3 text-left flex items-center space-x-3 transition-colors font-source-sans ${
                                            activeTab === "workouts"
                                                ? "bg-accent-primary/10 text-accent-primary"
                                                : "text-text-primary hover:bg-background-primary"
                                        }`}
                                    >
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
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveTab("history");
                                            setShowMobileNav(false);
                                        }}
                                        className={`w-full px-4 py-3 text-left flex items-center space-x-3 transition-colors font-source-sans ${
                                            activeTab === "history"
                                                ? "bg-accent-primary/10 text-accent-primary"
                                                : "text-text-primary hover:bg-background-primary"
                                        }`}
                                    >
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
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveTab("progress");
                                            setShowMobileNav(false);
                                        }}
                                        className={`w-full px-4 py-3 text-left flex items-center space-x-3 transition-colors font-source-sans ${
                                            activeTab === "progress"
                                                ? "bg-accent-primary/10 text-accent-primary"
                                                : "text-text-primary hover:bg-background-primary"
                                        }`}
                                    >
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
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveTab("profile");
                                            setShowMobileNav(false);
                                        }}
                                        className={`w-full px-4 py-3 text-left flex items-center space-x-3 transition-colors font-source-sans ${
                                            activeTab === "profile"
                                                ? "bg-accent-primary/10 text-accent-primary"
                                                : "text-text-primary hover:bg-background-primary"
                                        }`}
                                    >
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
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Backdrop to close dropdown */}
                        {showMobileNav && (
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowMobileNav(false)}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Navigation Tabs - Desktop Only */}
            <div className="hidden md:block bg-background-secondary border-b border-accent-primary/20">
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
