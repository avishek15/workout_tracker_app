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
    const [savedBodyWeight, setSavedBodyWeight] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleBodyWeightChange = (weight: number, unit: "kg" | "lbs") => {
        setBodyWeight(weight);
        setBodyWeightUnit(unit);
    };

    const handleSaveBodyWeight = async () => {
        if (!bodyWeight || bodyWeight <= 0) {
            toast.error("Please enter a valid body weight");
            return;
        }

        setIsSaving(true);
        try {
            const result = await addBodyWeight({
                sessionId: sessionId as any,
                weight: bodyWeight,
                weightUnit: bodyWeightUnit,
            });
            toast.success("Body weight saved!");
            setSavedBodyWeight({
                _id: result,
                weight: bodyWeight,
                weightUnit: bodyWeightUnit,
                measuredAt: Date.now(),
            });
            setBodyWeight(undefined);
        } catch (error) {
            toast.error("Failed to save body weight");
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveBodyWeight = async (bodyWeightId: string) => {
        try {
            await removeBodyWeight({ weightId: bodyWeightId as any });
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

            {!savedBodyWeight ? (
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
                        disabled={isSaving}
                        className="bg-accent-primary text-white px-4 py-2 rounded-lg hover:bg-accent-primary/90 transition-colors font-medium disabled:opacity-50"
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                    <div className="flex items-center gap-3">
                        <span className="text-green-600 font-medium">✓</span>
                        <span className="text-sm text-gray-900">
                            {savedBodyWeight.weight}{" "}
                            {savedBodyWeight.weightUnit}
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            setSavedBodyWeight(null);
                            setBodyWeight(undefined);
                        }}
                        className="text-red-500 hover:text-red-700 text-sm"
                    >
                        Edit
                    </button>
                </div>
            )}
        </div>
    );
}
