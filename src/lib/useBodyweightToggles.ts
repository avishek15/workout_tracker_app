import { useState, useEffect } from "react";

// Local storage utilities for bodyweight toggles
const getBodyweightTogglesFromStorage = (
    sessionId: string
): Record<string, boolean> => {
    try {
        const stored = localStorage.getItem(`bodyweight-toggles-${sessionId}`);
        return stored ? JSON.parse(stored) : {};
    } catch (error) {
        console.warn(
            "Failed to parse bodyweight toggles from localStorage:",
            error
        );
        return {};
    }
};

const saveBodyweightTogglesToStorage = (
    sessionId: string,
    toggles: Record<string, boolean>
) => {
    try {
        localStorage.setItem(
            `bodyweight-toggles-${sessionId}`,
            JSON.stringify(toggles)
        );
    } catch (error) {
        console.warn(
            "Failed to save bodyweight toggles to localStorage:",
            error
        );
    }
};

const clearBodyweightTogglesFromStorage = (sessionId: string) => {
    try {
        localStorage.removeItem(`bodyweight-toggles-${sessionId}`);
    } catch (error) {
        console.warn(
            "Failed to clear bodyweight toggles from localStorage:",
            error
        );
    }
};

export function useBodyweightToggles(sessionId: string | undefined) {
    const [optimisticBodyweightToggles, setOptimisticBodyweightToggles] =
        useState<Record<string, boolean>>({});

    // Load bodyweight toggles from localStorage when session changes
    useEffect(() => {
        if (sessionId) {
            const storedToggles = getBodyweightTogglesFromStorage(sessionId);
            setOptimisticBodyweightToggles(storedToggles);
        }
    }, [sessionId]);

    // Save bodyweight toggles to localStorage whenever they change
    useEffect(() => {
        if (sessionId && Object.keys(optimisticBodyweightToggles).length > 0) {
            saveBodyweightTogglesToStorage(
                sessionId,
                optimisticBodyweightToggles
            );
        }
    }, [sessionId, optimisticBodyweightToggles]);

    // Clear localStorage when session is completed or cancelled
    useEffect(() => {
        if (!sessionId) {
            // Session is no longer active, clear localStorage for any previous session
            // We'll clear all bodyweight toggle entries since we don't have the session ID
            // This is a simple cleanup approach
            const keys = Object.keys(localStorage);
            keys.forEach((key) => {
                if (key.startsWith("bodyweight-toggles-")) {
                    localStorage.removeItem(key);
                }
            });
        }
    }, [sessionId]);

    const toggleExerciseBodyweight = (
        exerciseName: string,
        isBodyweight: boolean
    ) => {
        setOptimisticBodyweightToggles((prev) => ({
            ...prev,
            [exerciseName]: isBodyweight,
        }));
    };

    const getExerciseBodyweight = (
        exerciseName: string,
        defaultIsBodyweight: boolean = false
    ) => {
        return Object.prototype.hasOwnProperty.call(
            optimisticBodyweightToggles,
            exerciseName
        )
            ? optimisticBodyweightToggles[exerciseName]
            : defaultIsBodyweight;
    };

    return {
        optimisticBodyweightToggles,
        toggleExerciseBodyweight,
        getExerciseBodyweight,
    };
}
