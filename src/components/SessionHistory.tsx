import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { History } from "lucide-react";

export function SessionHistory() {
    const sessions = useQuery(api.sessions.list);
    const deleteSession = useMutation(api.sessions.deleteSession);
    const [selectedSession, setSelectedSession] = useState<any>(null);
    const [showDetails, setShowDetails] = useState(false);

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
        } catch (error) {
            toast.error("Failed to delete session");
        }
    };

    const handleViewDetails = (session: any) => {
        setSelectedSession(session);
        setShowDetails(true);
    };

    const getSessionStats = (session: any) => {
        if (!session.sets) return { completed: 0, total: 0, exercises: 0 };

        const completed = session.sets.filter(
            (set: any) => set.completed
        ).length;
        const total = session.sets.length;
        const exercises = new Set(
            session.sets.map((set: any) => set.exerciseName)
        ).size;

        return { completed, total, exercises };
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                    Workout History
                </h2>
                <div className="text-sm text-gray-600">
                    {allSessions.length} workout
                    {allSessions.length !== 1 ? "s" : ""}
                </div>
            </div>

            <div className="space-y-6">
                {allSessions.map((session) => {
                    const stats = getSessionStats(session);
                    return (
                        <div
                            key={session._id}
                            className="border rounded-lg p-8 hover:shadow-lg transition-shadow bg-white"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {session.workout?.name ||
                                            "Unknown Workout"}
                                    </h3>
                                    <p className="text-gray-600">
                                        {formatDate(session.startTime)} at{" "}
                                        {formatTime(session.startTime)}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <span>
                                            {stats.completed}/{stats.total} sets
                                            completed
                                        </span>
                                        <span>{stats.exercises} exercises</span>
                                    </div>
                                </div>

                                <div className="text-right ml-4">
                                    <div className="text-sm text-gray-600">
                                        Duration
                                    </div>
                                    <div className="font-medium">
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

                            {session.notes && (
                                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                    <div className="text-sm font-medium text-gray-700 mb-1">
                                        Notes:
                                    </div>
                                    <div className="text-gray-600">
                                        {session.notes}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 mt-6">
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
            {showDetails && selectedSession && (
                <SessionDetailsModal
                    session={selectedSession}
                    onClose={() => setShowDetails(false)}
                />
            )}
        </div>
    );
}

interface SessionDetailsModalProps {
    session: any;
    onClose: () => void;
}

function SessionDetailsModal({ session, onClose }: SessionDetailsModalProps) {
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
                            {session.workout?.name}
                        </h3>
                        <p className="text-gray-600">
                            {new Date(session.startTime).toLocaleDateString()}{" "}
                            at {formatTime(session.startTime)}
                        </p>
                        <p className="text-gray-600">
                            Duration:{" "}
                            {formatDuration(session.startTime, session.endTime)}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                    >
                        ×
                    </button>
                </div>

                {session.notes && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                            Notes:
                        </div>
                        <div className="text-gray-600">{session.notes}</div>
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
                                    {sets.map((set: any, index: number) => (
                                        <div
                                            key={set._id}
                                            className={`flex items-center gap-4 p-3 rounded-lg ${
                                                set.completed
                                                    ? "bg-green-50 border border-green-200"
                                                    : "bg-gray-50 border border-gray-200"
                                            }`}
                                        >
                                            <div className="w-8 text-center font-medium text-gray-600">
                                                {index + 1}
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-gray-700">
                                                    {set.reps} reps
                                                </span>
                                                {set.weight !== undefined && (
                                                    <span className="text-gray-700">
                                                        {set.weight} lbs
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1"></div>
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
                                    ))}
                                </div>
                            </div>
                        )
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
