import { useEffect, useRef, useState } from "react";

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
    const endAtRef = useRef<number | null>(null); // epoch ms
    const completedRef = useRef(false);
    const wakeLockRef = useRef<any>(null);
    const storageKey = `restTimer:endAt:${exerciseName}`;

    // Initialize from storage or set a new endAt when (re)starting
    useEffect(() => {
        if (!isActive) {
            return;
        }

        // Try restoring an existing end time
        const stored = localStorage.getItem(storageKey);
        const now = Date.now();
        if (stored) {
            const parsed = Number(stored);
            if (!Number.isNaN(parsed) && parsed > now) {
                endAtRef.current = parsed;
            }
        }

        // If no stored endAt, start a new rest window
        if (!endAtRef.current) {
            endAtRef.current = now + restTime * 1000;
            localStorage.setItem(storageKey, String(endAtRef.current));
        }

        // Request a wake lock if supported (best effort)
        const requestWakeLock = async () => {
            try {
                const anyNav: any = navigator as any;
                if (anyNav?.wakeLock?.request) {
                    wakeLockRef.current =
                        await anyNav.wakeLock.request("screen");
                }
            } catch {
                // ignore if not supported or denied
            }
        };
        void requestWakeLock();

        return () => {
            // Release wake lock on stop/unmount
            try {
                if (wakeLockRef.current && wakeLockRef.current.release) {
                    void wakeLockRef.current.release();
                }
            } catch {
                // ignore
            }
            wakeLockRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive, restTime, exerciseName]);

    // Countdown effect based on wall-clock time
    useEffect(() => {
        if (!isActive) return;

        const computeRemaining = () => {
            const endAt = endAtRef.current;
            if (!endAt) {
                setRemainingTime(restTime);
                return;
            }
            const now = Date.now();
            const ms = Math.max(0, endAt - now);
            const secs = Math.ceil(ms / 1000);
            setRemainingTime(secs);
            if (secs <= 0 && !completedRef.current) {
                completedRef.current = true;
                // Cleanup storage and wake lock when done
                localStorage.removeItem(storageKey);
                try {
                    if (wakeLockRef.current && wakeLockRef.current.release) {
                        void wakeLockRef.current.release();
                    }
                } catch {
                    // ignore
                }
                wakeLockRef.current = null;
                onComplete();
            }
        };

        // Tick every second; background throttling is fine because we recompute from Date.now
        const interval = setInterval(computeRemaining, 1000);
        // Also compute immediately on start
        computeRemaining();

        const handleVisibility = () => computeRemaining();
        window.addEventListener("visibilitychange", handleVisibility);
        window.addEventListener("focus", handleVisibility);

        return () => {
            clearInterval(interval);
            window.removeEventListener("visibilitychange", handleVisibility);
            window.removeEventListener("focus", handleVisibility);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive, restTime, onComplete, exerciseName]);

    // Format time as MM:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    // Calculate progress percentage
    const total = Math.max(1, restTime);
    const progressPercentage = ((total - remainingTime) / total) * 100;

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
