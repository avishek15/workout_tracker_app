import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { History, Calendar, Target, TrendingUp } from "lucide-react";
import {
    getDefaultWeightUnit,
    convertWeight,
    type WeightUnit,
} from "../lib/unitConversion";

export function SessionHistory() {
    const sessions = useQuery(api.sessions.list);
    const deleteSession = useMutation(api.sessions.deleteSession);
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // Lazy load sets for selected session
    const selectedSessionSets = useQuery(
        api.sets.list,
        selectedSession && isLoadingDetails
            ? { sessionId: selectedSession._id }
            : "skip"
    );

    // Update selected session with sets when they're loaded
    useEffect(() => {
        if (
            selectedSessionSets !== undefined &&
            isLoadingDetails &&
            selectedSession
        ) {
            setSelectedSession({
                ...selectedSession,
                sets: selectedSessionSets,
            });
            setIsLoadingDetails(false);
        }
    }, [selectedSessionSets, isLoadingDetails, selectedSession]);

    if (sessions === undefined) {
        return <div className="text-center py-8">Loading history...</div>;
    }

    const completedSessions = sessions.filter(
        (session) => session.status === "completed"
    );
    const cancelledSessions = sessions.filter(
        (session) => session.status === "cancelled"
    );
    const allSessions = [...completedSessions, ...cancelledSessions].sort(
        (a, b) => b.startTime - a.startTime
    );

    if (allSessions.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="w-16 h-16 bg-accent-primary rounded-full flex items-center justify-center mx-auto mb-6">
                    <History className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2 font-montserrat">
                    No workout history yet
                </h3>
                <p className="text-text-secondary font-source-sans">
                    Complete your first workout to see your progress here!
                </p>
            </div>
        );
    }

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatDuration = (startTime: number, endTime: number) => {
        if (!endTime) {
            return "Incomplete";
        }

        const duration = Math.max(0, endTime - startTime);
        const minutes = Math.floor(duration / 60000);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (duration < 60000) {
            return "Less than 1m";
        }

        if (hours > 0) {
            return `${hours}h ${remainingMinutes}m`;
        }
        return `${minutes}m`;
    };

    const getSessionVolume = (session: any) => {
        // Use pre-computed totalVolume for better performance
        return session.totalVolume || 0;
    };

    const formatVolume = (volume: number) => {
        // Volume is stored in kg, convert to user's preferred unit
        const userUnit = getDefaultWeightUnit();
        const convertedVolume =
            userUnit === "kg" ? volume : convertWeight(volume, "kg", "lbs");

        // Format with unit abbreviation
        let formatted: string;
        if (convertedVolume >= 1000000) {
            formatted = `${(convertedVolume / 1000000).toFixed(1)}M`;
        } else if (convertedVolume >= 1000) {
            formatted = `${(convertedVolume / 1000).toFixed(1)}k`;
        } else {
            formatted = Math.round(convertedVolume).toString();
        }

        return `${formatted} ${userUnit}`;
    };

    const handleDeleteSession = async (sessionId: string) => {
        if (
            !confirm(
                "Are you sure you want to delete this workout session? This action cannot be undone."
            )
        ) {
            return;
        }

        try {
            await deleteSession({ sessionId: sessionId as any });
            toast.success("Workout session deleted");
        } catch {
            toast.error("Failed to delete session");
        }
    };

    const handleViewDetails = (session: any) => {
        // Set the selected session without sets first
        setSelectedSession(session);
        setShowDetails(true);
        setIsLoadingDetails(true);
    };

    const getSessionStats = (session: any) => {
        // Use pre-computed denormalized values for better performance
        return {
            completed: session.completedSets || 0,
            total: session.totalSets || 0,
            exercises: session.exerciseCount || 0,
        };
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl sm:text-2xl font-bold text-text-primary font-montserrat">
                    Workout History
                </h2>
                <div className="text-sm text-text-secondary font-source-sans">
                    {allSessions.length} workout
                    {allSessions.length !== 1 ? "s" : ""}
                </div>
            </div>

            {/* Desktop Grid Layout */}
            <div className="hidden lg:grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {allSessions.map((session) => {
                    const stats = getSessionStats(session);
                    const volume = getSessionVolume(session);

                    return (
                        <div
                            key={session._id}
                            className="border border-accent-primary/20 rounded-lg p-4 hover:shadow-md transition-shadow bg-background-secondary"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-text-primary truncate font-montserrat">
                                        {session.workout?.name ||
                                            "Unknown Workout"}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-text-secondary mt-1">
                                        <Calendar className="w-3 h-3" />
                                        <span>
                                            {formatDate(session.startTime)}
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className={`text-xs px-2 py-1 rounded-full ${
                                        session.status === "completed"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-orange-100 text-orange-700"
                                    }`}
                                >
                                    {session.status === "completed" ? "✓" : "✗"}
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="text-center p-2 bg-background-primary rounded">
                                    <div className="text-xs text-text-secondary mb-1">
                                        Sets
                                    </div>
                                    <div className="font-semibold text-text-primary">
                                        {stats.completed}/{stats.total}
                                    </div>
                                </div>
                                <div className="text-center p-2 bg-background-primary rounded">
                                    <div className="text-xs text-text-secondary mb-1">
                                        Volume
                                    </div>
                                    <div className="font-semibold text-text-primary">
                                        {formatVolume(volume)}
                                    </div>
                                </div>
                                <div className="text-center p-2 bg-background-primary rounded">
                                    <div className="text-xs text-text-secondary mb-1">
                                        Exercises
                                    </div>
                                    <div className="font-semibold text-text-primary">
                                        {stats.exercises}
                                    </div>
                                </div>
                                <div className="text-center p-2 bg-background-primary rounded">
                                    <div className="text-xs text-text-secondary mb-1">
                                        Duration
                                    </div>
                                    <div className="font-semibold text-text-primary">
                                        {formatDuration(
                                            session.startTime,
                                            session.endTime || 0
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="mb-4 p-3 bg-background-primary rounded-lg">
                                <div className="text-xs text-text-secondary mb-1 font-medium">
                                    Notes:
                                </div>
                                <div className="text-sm text-text-primary">
                                    {session.notes || (
                                        <span className="text-text-secondary italic">
                                            No notes recorded
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleViewDetails(session)}
                                    className="flex-1 bg-accent-primary text-white px-3 py-2 rounded text-sm hover:bg-accent-primary/90 transition-colors font-medium"
                                >
                                    Details
                                </button>
                                <button
                                    onClick={() =>
                                        void handleDeleteSession(session._id)
                                    }
                                    className="px-3 py-2 text-danger hover:bg-danger/10 rounded text-sm transition-colors font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Mobile List Layout */}
            <div className="lg:hidden space-y-4">
                {allSessions.map((session) => {
                    const stats = getSessionStats(session);
                    const volume = getSessionVolume(session);

                    return (
                        <div
                            key={session._id}
                            className="border border-accent-primary/20 rounded-lg p-4 hover:shadow-md transition-shadow bg-background-secondary"
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-text-primary font-montserrat">
                                        {session.workout?.name ||
                                            "Unknown Workout"}
                                    </h3>
                                    <p className="text-text-secondary text-sm mt-1">
                                        {formatDate(session.startTime)} at{" "}
                                        {formatTime(session.startTime)}
                                    </p>
                                </div>
                                <div className="text-right ml-4">
                                    <div className="text-sm text-text-secondary">
                                        Duration
                                    </div>
                                    <div className="font-medium text-text-primary">
                                        {formatDuration(
                                            session.startTime,
                                            session.endTime || 0
                                        )}
                                    </div>
                                    <div
                                        className={`text-xs mt-1 ${
                                            session.status === "completed"
                                                ? "text-green-600"
                                                : "text-orange-600"
                                        }`}
                                    >
                                        {session.status === "completed"
                                            ? "✓ Completed"
                                            : "✗ Cancelled"}
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Stats */}
                            <div className="flex items-center gap-4 mb-3 text-sm text-text-secondary">
                                <span className="flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    {stats.completed}/{stats.total} sets
                                </span>
                                <span className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" />
                                    {formatVolume(volume)} volume
                                </span>
                                <span>{stats.exercises} exercises</span>
                            </div>

                            {session.notes && (
                                <div className="mb-3 p-3 bg-background-primary rounded-lg">
                                    <div className="text-sm font-medium text-text-primary mb-1">
                                        Notes:
                                    </div>
                                    <div className="text-text-secondary text-sm">
                                        {session.notes}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleViewDetails(session)}
                                    className="bg-accent-primary text-white px-4 py-2 rounded-lg hover:bg-accent-primary/90 transition-colors font-medium text-sm"
                                >
                                    View Details
                                </button>
                                <button
                                    onClick={() =>
                                        void handleDeleteSession(session._id)
                                    }
                                    className="bg-danger text-white px-4 py-2 rounded-lg hover:bg-danger-hover transition-colors font-medium text-sm"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Session Details Modal */}
            {showDetails && (
                <SessionDetailsModal
                    session={selectedSession}
                    isLoading={isLoadingDetails}
                    onClose={() => setShowDetails(false)}
                />
            )}
        </div>
    );
}

interface SessionDetailsModalProps {
    session: any;
    isLoading: boolean;
    onClose: () => void;
}

function SessionDetailsModal({
    session,
    isLoading,
    onClose,
}: SessionDetailsModalProps) {
    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const formatDuration = (startTime: number, endTime: number) => {
        if (!endTime) return "Incomplete";

        const duration = Math.max(0, endTime - startTime);
        const minutes = Math.floor(duration / 60000);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (duration < 60000) return "Less than 1m";
        if (hours > 0) return `${hours}h ${remainingMinutes}m`;
        return `${minutes}m`;
    };

    const formatWeightForDisplay = (set: any) => {
        if (set.weight === undefined || set.weight === null) {
            return null;
        }

        const userPreferredUnit = getDefaultWeightUnit();
        const setUnit: WeightUnit = set.weightUnit || "kg"; // Assume kg if null

        // If the set is already in the user's preferred unit, no conversion needed
        if (setUnit === userPreferredUnit) {
            return {
                weight: Number(set.weight.toFixed(3)),
                unit: userPreferredUnit,
            };
        }

        // Convert to user's preferred unit
        const convertedWeight = convertWeight(
            set.weight,
            setUnit,
            userPreferredUnit
        );
        return {
            weight: Number(convertedWeight.toFixed(3)),
            unit: userPreferredUnit,
        };
    };

    // Group sets by exercise
    const exerciseGroups =
        session.sets?.reduce((groups: any, set: any) => {
            if (!groups[set.exerciseName]) {
                groups[set.exerciseName] = [];
            }
            groups[set.exerciseName].push(set);
            return groups;
        }, {}) || {};

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">
                            {session?.workout?.name || "Loading..."}
                        </h3>
                        {session && (
                            <>
                                <p className="text-gray-600">
                                    {new Date(
                                        session.startTime
                                    ).toLocaleDateString()}{" "}
                                    at {formatTime(session.startTime)}
                                </p>
                                <p className="text-gray-600">
                                    Duration:{" "}
                                    {formatDuration(
                                        session.startTime,
                                        session.endTime
                                    )}
                                </p>
                            </>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">
                            Loading session details...
                        </p>
                    </div>
                ) : session ? (
                    <>
                        {session.notes && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <div className="text-sm font-medium text-gray-700 mb-2">
                                    Notes:
                                </div>
                                <div className="text-gray-600">
                                    {session.notes}
                                </div>
                            </div>
                        )}

                        <div className="space-y-8">
                            {Object.entries(exerciseGroups).map(
                                ([exerciseName, sets]: [string, any]) => (
                                    <div
                                        key={exerciseName}
                                        className="border rounded-lg p-6"
                                    >
                                        <h4 className="text-lg font-semibold text-gray-900 mb-3">
                                            {exerciseName}
                                        </h4>
                                        <div className="space-y-2">
                                            {sets.map(
                                                (set: any, index: number) => (
                                                    <div
                                                        key={set._id}
                                                        className={`flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 p-3 rounded-lg ${
                                                            set.completed
                                                                ? "bg-green-50 border border-green-200"
                                                                : "bg-gray-50 border border-gray-200"
                                                        }`}
                                                    >
                                                        <div className="w-8 text-center font-medium text-gray-600 flex-shrink-0">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                                                            <span className="text-gray-700 text-sm sm:text-base">
                                                                {set.reps} reps
                                                            </span>
                                                            {(() => {
                                                                const weightInfo =
                                                                    formatWeightForDisplay(
                                                                        set
                                                                    );
                                                                return (
                                                                    weightInfo && (
                                                                        <span className="text-gray-700 text-sm sm:text-base">
                                                                            {
                                                                                weightInfo.weight
                                                                            }{" "}
                                                                            {
                                                                                weightInfo.unit
                                                                            }
                                                                        </span>
                                                                    )
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                                                            <div
                                                                className={`text-sm font-medium ${
                                                                    set.completed
                                                                        ? "text-green-600"
                                                                        : "text-gray-500"
                                                                }`}
                                                            >
                                                                {set.completed
                                                                    ? "✓ Completed"
                                                                    : "○ Incomplete"}
                                                            </div>
                                                            {set.completedAt && (
                                                                <div className="text-xs text-gray-500">
                                                                    {formatTime(
                                                                        set.completedAt
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </>
                ) : null}

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-danger text-white px-6 py-2 rounded-lg hover:bg-danger-hover transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
