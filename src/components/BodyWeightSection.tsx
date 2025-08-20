import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { WeightInput } from "./WeightInput";

interface BodyWeightSectionProps {
    sessionId: string;
    bodyWeightHistory: any[] | undefined;
}

export function BodyWeightSection({
    sessionId,
    bodyWeightHistory,
}: BodyWeightSectionProps) {
    const addBodyWeight = useMutation(api.bodyWeights.add);
    const removeBodyWeight = useMutation(api.bodyWeights.remove);

    const [bodyWeight, setBodyWeight] = useState<number | undefined>();
    const [bodyWeightUnit, setBodyWeightUnit] = useState<"kg" | "lbs">("kg");

    const handleBodyWeightChange = (weight: number, unit: "kg" | "lbs") => {
        setBodyWeight(weight);
        setBodyWeightUnit(unit);
    };

    const handleSaveBodyWeight = async () => {
        if (!bodyWeight || bodyWeight <= 0) {
            toast.error("Please enter a valid body weight");
            return;
        }

        try {
            await addBodyWeight({
                sessionId: sessionId as any,
                weight: bodyWeight,
                unit: bodyWeightUnit,
            });
            toast.success("Body weight saved!");
            setBodyWeight(undefined);
        } catch (error) {
            toast.error("Failed to save body weight");
        }
    };

    const handleRemoveBodyWeight = async (bodyWeightId: string) => {
        try {
            await removeBodyWeight({ bodyWeightId: bodyWeightId as any });
            toast.success("Body weight removed");
        } catch (error) {
            toast.error("Failed to remove body weight");
        }
    };

    return (
        <div className="border border-gray-200 rounded-lg p-4 sm:p-6 bg-gray-50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                <div>
                    <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Body Weight (Optional)
                    </h3>
                    <p className="text-sm text-gray-600">
                        Log your weight at the start of your workout
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <WeightInput
                        value={bodyWeight}
                        unit={bodyWeightUnit}
                        onWeightChange={handleBodyWeightChange}
                        placeholder="Enter weight"
                    />
                </div>
                <button
                    onClick={() => void handleSaveBodyWeight()}
                    className="bg-accent-primary text-white px-4 py-2 rounded-lg hover:bg-accent-primary/90 transition-colors font-medium"
                >
                    Save
                </button>
            </div>

            {/* Body Weight History */}
            {bodyWeightHistory && bodyWeightHistory.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Today's Entries
                    </h4>
                    <div className="space-y-2">
                        {bodyWeightHistory.map((entry) => (
                            <div
                                key={entry._id}
                                className="flex items-center justify-between bg-white rounded-lg px-3 py-2 border border-gray-200"
                            >
                                <span className="text-sm text-gray-900">
                                    {entry.weight} {entry.unit}
                                </span>
                                <button
                                    onClick={() =>
                                        void handleRemoveBodyWeight(entry._id)
                                    }
                                    className="text-red-500 hover:text-red-700 text-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
