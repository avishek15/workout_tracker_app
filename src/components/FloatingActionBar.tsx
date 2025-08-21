interface FloatingActionBarProps {
    onCancel: () => void;
    onComplete: () => void;
}

export function FloatingActionBar({
    onCancel,
    onComplete,
}: FloatingActionBarProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-300 shadow-lg z-40 px-3 sm:px-4 py-2 sm:py-3">
            <div className="max-w-7xl mx-auto flex gap-2 sm:gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 bg-danger text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-danger-hover transition-all duration-200 font-medium shadow-md hover:shadow-lg text-sm sm:text-base min-h-[48px] sm:min-h-0"
                >
                    Cancel
                </button>
                <button
                    onClick={onComplete}
                    className="flex-1 bg-accent-primary text-white px-3 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-accent-primary/90 transition-all duration-200 font-medium shadow-md hover:shadow-lg text-sm sm:text-base min-h-[48px] sm:min-h-0"
                >
                    Complete Workout
                </button>
            </div>
        </div>
    );
}
