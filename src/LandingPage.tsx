import { useState } from "react";
import { SignInForm } from "./components/SignInForm";
import { SignOutButton } from "./components/SignOutButton";

export function LandingPage() {
    const [showAuth, setShowAuth] = useState(false);
    const [authMode, setAuthMode] = useState<"login" | "signup">("login");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleAuthClick = (mode: "login" | "signup") => {
        setAuthMode(mode);
        setShowAuth(true);
        setMobileMenuOpen(false); // Close mobile menu when auth opens
    };

    const handleCloseAuth = () => {
        setShowAuth(false);
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <div className="min-h-screen bg-background-primary overflow-x-hidden">
            {/* Navigation */}
            <nav className="relative z-10 px-6 lg:px-8 py-4">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    {/* Logo */}
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

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {/* Future navigation items will go here */}
                        {/* <a href="#features" className="text-text-primary hover:text-accent-primary transition-colors font-medium font-source-sans">
                            Features
                        </a>
                        <a href="#pricing" className="text-text-primary hover:text-accent-primary transition-colors font-medium font-source-sans">
                            Pricing
                        </a>
                        <a href="#about" className="text-text-primary hover:text-accent-primary transition-colors font-medium font-source-sans">
                            About
                        </a> */}
                    </div>

                    {/* Desktop Auth Buttons */}
                    <div className="hidden md:flex items-center space-x-4">
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

                    {/* Mobile Menu Button */}
                    <button
                        onClick={toggleMobileMenu}
                        className="md:hidden p-2 rounded-lg hover:bg-accent-primary/10 transition-colors"
                        aria-label="Toggle mobile menu"
                    >
                        <div className="w-6 h-6 flex flex-col justify-center items-center">
                            <span
                                className={`block w-5 h-0.5 bg-text-primary transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-1" : "-translate-y-1"}`}
                            ></span>
                            <span
                                className={`block w-5 h-0.5 bg-text-primary transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : "opacity-100"}`}
                            ></span>
                            <span
                                className={`block w-5 h-0.5 bg-text-primary transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-1" : "translate-y-1"}`}
                            ></span>
                        </div>
                    </button>
                </div>

                {/* Mobile Menu */}
                <div
                    className={`md:hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}
                >
                    <div className="pt-4 pb-6 space-y-4 border-t border-accent-primary/20 mt-4">
                        {/* Future mobile navigation items will go here */}
                        {/* <a href="#features" className="block px-4 py-2 text-text-primary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors font-medium font-source-sans">
                            Features
                        </a>
                        <a href="#pricing" className="block px-4 py-2 text-text-primary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors font-medium font-source-sans">
                            Pricing
                        </a>
                        <a href="#about" className="block px-4 py-2 text-text-primary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors font-medium font-source-sans">
                            About
                        </a> */}

                        {/* Mobile Auth Buttons */}
                        <div className="px-4 space-y-3">
                            <button
                                onClick={() => handleAuthClick("login")}
                                className="w-full px-6 py-3 text-text-primary hover:text-accent-primary hover:bg-accent-primary/10 rounded-lg transition-colors font-medium font-source-sans text-left"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => handleAuthClick("signup")}
                                className="w-full px-6 py-3 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-colors font-medium font-source-sans"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative min-h-screen flex items-center justify-center px-6 lg:px-8">
                <div className="w-full max-w-6xl text-center">
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary mb-6 font-montserrat leading-tight">
                        <span className="block">Track. Progress.</span>
                        <span className="block text-accent-primary">
                            Transform.
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-text-secondary mb-8 max-w-3xl mx-auto font-source-sans leading-relaxed">
                        The ultimate fitness tracking platform that helps you
                        monitor your workouts, analyze your progress, and
                        achieve your fitness goals with precision.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={() => handleAuthClick("signup")}
                            className="w-full sm:w-auto px-8 py-4 bg-accent-primary text-white rounded-lg hover:bg-accent-primary/90 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 font-montserrat"
                        >
                            Start Your Journey
                        </button>
                        <button
                            onClick={() => handleAuthClick("login")}
                            className="w-full sm:w-auto px-8 py-4 border-2 border-accent-primary text-accent-primary rounded-lg hover:bg-accent-primary hover:text-white transition-all duration-300 font-semibold text-lg font-montserrat"
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
                        <SignInForm initialMode={authMode} />
                    </div>
                </div>
            )}
        </div>
    );
}
