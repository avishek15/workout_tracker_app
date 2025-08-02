import { useState } from "react";
import { SignInForm } from "./components/SignInForm";
import { SignOutButton } from "./components/SignOutButton";

export function LandingPage() {
    const [showAuth, setShowAuth] = useState(false);
    const [authMode, setAuthMode] = useState<"login" | "signup">("login");

    const handleAuthClick = (mode: "login" | "signup") => {
        setAuthMode(mode);
        setShowAuth(true);
    };

    const handleCloseAuth = () => {
        setShowAuth(false);
    };

    return (
        <div className="min-h-screen bg-background-primary overflow-x-hidden">
            {/* Navigation */}
            <nav className="relative z-10 px-6 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-accent-primary rounded-lg flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">
                                ⚡
                            </span>
                        </div>
                        <span className="text-2xl font-bold text-text-primary font-montserrat">
                            FitFlow Pro
                        </span>
                    </div>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => handleAuthClick("login")}
                            className="px-6 py-2 text-text-primary hover:text-accent-primary transition-colors font-medium font-source-sans"
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => handleAuthClick("signup")}
                            className="px-6 py-2 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors font-medium font-source-sans"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative min-h-screen flex items-center justify-center w-screen -mx-6">
                <div className="w-full text-center px-6">
                    <h1 className="text-5xl md:text-7xl font-bold text-text-primary mb-6 font-montserrat">
                        Track. Progress.
                        <span className="block text-accent-primary">
                            Transform.
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-3xl mx-auto font-source-sans">
                        The ultimate fitness tracking platform that helps you
                        monitor your workouts, analyze your progress, and
                        achieve your fitness goals with precision.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => handleAuthClick("signup")}
                            className="px-8 py-4 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 font-montserrat"
                        >
                            Start Your Journey
                        </button>
                        <button
                            onClick={() => handleAuthClick("login")}
                            className="px-8 py-4 border-2 border-accent-primary text-accent-primary rounded-lg hover:bg-accent-primary hover:text-white transition-all duration-300 font-semibold text-lg font-montserrat"
                        >
                            Sign In
                        </button>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="px-6 py-20 bg-background-secondary">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-bold text-text-primary text-center mb-16 font-montserrat">
                        Everything You Need to Succeed
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center p-8 rounded-lg bg-background-primary border border-accent-primary/20">
                            <div className="w-16 h-16 bg-accent-primary rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-2xl">📊</span>
                            </div>
                            <h3 className="text-xl font-semibold text-text-primary mb-4 font-montserrat">
                                Smart Analytics
                            </h3>
                            <p className="text-text-secondary font-source-sans">
                                Track your progress with detailed analytics,
                                charts, and insights to understand your fitness
                                journey better.
                            </p>
                        </div>
                        <div className="text-center p-8 rounded-lg bg-background-primary border border-accent-secondary/20">
                            <div className="w-16 h-16 bg-accent-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-2xl">🏋️‍♂️</span>
                            </div>
                            <h3 className="text-xl font-semibold text-text-primary mb-4 font-montserrat">
                                Workout Tracking
                            </h3>
                            <p className="text-text-secondary font-source-sans">
                                Create custom workouts, track sets and reps, and
                                monitor your performance in real-time during
                                sessions.
                            </p>
                        </div>
                        <div className="text-center p-8 rounded-lg bg-background-primary border border-accent-primary/20">
                            <div className="w-16 h-16 bg-accent-primary rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-2xl">📈</span>
                            </div>
                            <h3 className="text-xl font-semibold text-text-primary mb-4 font-montserrat">
                                Progress History
                            </h3>
                            <p className="text-text-secondary font-source-sans">
                                Review your workout history, see your
                                improvements over time, and celebrate your
                                achievements.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="px-6 py-20">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold text-text-primary mb-6 font-montserrat">
                        Ready to Transform Your Fitness Journey?
                    </h2>
                    <p className="text-xl text-text-secondary mb-8 font-source-sans">
                        Join thousands of users who are already tracking their
                        progress and achieving their goals.
                    </p>
                    <button
                        onClick={() => handleAuthClick("signup")}
                        className="px-10 py-4 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-all duration-300 font-semibold text-xl shadow-lg hover:shadow-xl transform hover:scale-105 font-montserrat"
                    >
                        Get Started Free
                    </button>
                </div>
            </div>

            {/* Footer */}
            <footer className="px-6 py-8 border-t border-accent-primary/20">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-text-secondary font-source-sans">
                        © 2024 FitFlow Pro. Track. Progress. Transform.
                    </p>
                </div>
            </footer>

            {/* Auth Modal */}
            {showAuth && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-background-secondary rounded-xl p-8 w-full max-w-md border border-accent-primary/20">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-text-primary font-montserrat">
                                {authMode === "login"
                                    ? "Welcome Back"
                                    : "Join FitFlow Pro"}
                            </h2>
                            <button
                                onClick={handleCloseAuth}
                                className="text-text-muted hover:text-text-primary text-2xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                        <SignInForm />
                    </div>
                </div>
            )}
        </div>
    );
}
