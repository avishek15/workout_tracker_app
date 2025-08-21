import { useEffect, useState } from "react";

interface RestTimerProps {
    exerciseName: string;
    restTime: number;
    isActive: boolean;
    onSkip: () => void;
    onStartNextSet: () => void;
    onComplete: () => void;
}

export function RestTimer({
    exerciseName,
    restTime,
    isActive,
    onSkip,
    onStartNextSet,
    onComplete,
}: RestTimerProps) {
    const [remainingTime, setRemainingTime] = useState(restTime);

    // Reset timer when restTime changes
    useEffect(() => {
        setRemainingTime(restTime);
    }, [restTime]);

    // Countdown effect
    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            setRemainingTime((prev) => {
                if (prev <= 1) {
                    // Timer finished
                    onComplete();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isActive, onComplete]);

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Calculate progress percentage
    const progressPercentage = ((restTime - remainingTime) / restTime) * 100;

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 sm:bottom-24 sm:left-8 sm:right-8">
            <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-accent-primary rounded-full animate-pulse"></div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {exerciseName} - Rest Time
                        </h3>
                    </div>
                    <span className="text-sm text-gray-500">
                        {formatTime(remainingTime)}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div
                        className="bg-accent-primary h-2 rounded-full transition-all duration-1000 ease-linear"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>

                {/* Timer Display */}
                <div className="text-center mb-4">
                    <div className="text-3xl sm:text-4xl font-bold text-accent-primary">
                        {formatTime(remainingTime)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                        {remainingTime > 0
                            ? "Rest in progress..."
                            : "Ready for next set!"}
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onSkip}
                        className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        Skip Rest
                    </button>
                    {remainingTime === 0 && (
                        <button
                            onClick={onStartNextSet}
                            className="flex-1 bg-accent-primary text-white px-4 py-2 rounded-lg hover:bg-accent-primary/90 transition-colors font-medium"
                        >
                            Start Next Set
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
