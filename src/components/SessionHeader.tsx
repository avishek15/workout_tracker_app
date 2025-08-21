interface SessionHeaderProps {
    sessionName: string;
    startTime: number;
    completedSets: number;
    totalSets: number;
}

export function SessionHeader({
    sessionName,
    startTime,
    completedSets,
    totalSets,
}: SessionHeaderProps) {
    const formatDuration = (startTime: number) => {
        const duration = Date.now() - startTime;
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-6 relative overflow-hidden">
            {/* Animated background overlay */}
            <div className="absolute inset-0 bg-green-100 opacity-0 animate-pulse-slow pointer-events-none"></div>
            {/* Content */}
            <div className="relative z-10">
                <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex-1">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                            {sessionName}
                        </h2>
                        <p className="text-gray-600 text-sm sm:text-base">
                            Started {formatDuration(startTime)} ago
                        </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                        <div className="text-2xl sm:text-3xl font-bold text-green-600">
                            {completedSets}/{totalSets}
                        </div>
                        <div className="text-sm sm:text-base text-gray-600">
                            sets completed
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
