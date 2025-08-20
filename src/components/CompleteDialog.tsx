interface CompleteDialogProps {
    isOpen: boolean;
    notes: string;
    onNotesChange: (notes: string) => void;
    onCancel: () => void;
    onComplete: () => void;
}

export function CompleteDialog({
    isOpen,
    notes,
    onNotesChange,
    onCancel,
    onComplete,
}: CompleteDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4">Complete Workout</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes (optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => onNotesChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            rows={3}
                            placeholder="How did the workout go?"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={onCancel}
                            className="w-full sm:flex-1 px-4 py-3 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onComplete}
                            className="w-full sm:flex-1 bg-accent-primary text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-accent-primary/90 transition-colors"
                        >
                            Complete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
