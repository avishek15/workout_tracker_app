import React from "react";
import { UnitToggle } from "./UnitToggle";
import { WeightInput } from "./WeightInput";
import { useWeightUnit } from "./UnitToggle";
import { formatKgForUser } from "../lib/unitConversion";

export function WeightInputDemo() {
    const currentUnit = useWeightUnit();
    const [demoWeight, setDemoWeight] = React.useState<number>(0);
    const [demoUnit, setDemoUnit] = React.useState<"kg" | "lbs">("kg");

    const handleWeightChange = (weight: number, unit: "kg" | "lbs") => {
        setDemoWeight(weight);
        setDemoUnit(unit);
    };

    return (
        <div className="space-y-6 p-6 bg-background-primary rounded-lg border border-accent-primary/20">
            <h2 className="text-xl font-semibold text-text-primary">
                Weight Unit System Demo
            </h2>

            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-medium text-text-primary mb-2">
                        Global Unit Toggle
                    </h3>
                    <UnitToggle />
                    <p className="text-sm text-text-secondary mt-2">
                        Current global preference: {currentUnit}
                    </p>
                </div>

                <div>
                    <h3 className="text-lg font-medium text-text-primary mb-2">
                        Weight Input Component
                    </h3>
                    <WeightInput
                        onWeightChange={handleWeightChange}
                        placeholder="Enter weight..."
                        className="max-w-xs"
                    />
                    <div className="mt-2 text-sm text-text-secondary">
                        <p>
                            Input value:{" "}
                            {demoWeight > 0 ? `${demoWeight} kg` : "No weight"}
                        </p>
                        <p>Input unit: {demoUnit}</p>
                        <p>
                            Display in user's unit:{" "}
                            {demoWeight > 0
                                ? formatKgForUser(demoWeight)
                                : "No weight"}
                        </p>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-medium text-text-primary mb-2">
                        Example Conversions
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-background-secondary p-3 rounded">
                            <p className="font-medium">100 kg</p>
                            <p className="text-text-secondary">= 220.5 lbs</p>
                        </div>
                        <div className="bg-background-secondary p-3 rounded">
                            <p className="font-medium">225 lbs</p>
                            <p className="text-text-secondary">= 102.1 kg</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
