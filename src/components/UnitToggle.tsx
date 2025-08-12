import React from "react";
import {
    getDefaultWeightUnit,
    setDefaultWeightUnit,
    type WeightUnit,
} from "../lib/unitConversion";
import { cn } from "../lib/utils";

interface UnitToggleProps {
    className?: string;
    size?: "sm" | "md" | "lg";
    showLabel?: boolean;
    onUnitChange?: (unit: WeightUnit) => void;
}

export function UnitToggle({
    className,
    size = "md",
    showLabel = true,
    onUnitChange,
}: UnitToggleProps) {
    const [currentUnit, setCurrentUnit] = React.useState<WeightUnit>("kg");

    React.useEffect(() => {
        setCurrentUnit(getDefaultWeightUnit());
    }, []);

    const handleUnitChange = (newUnit: WeightUnit) => {
        setDefaultWeightUnit(newUnit);
        setCurrentUnit(newUnit);
        onUnitChange?.(newUnit);

        // Trigger a custom event to notify other components
        window.dispatchEvent(
            new CustomEvent("weightUnitChanged", {
                detail: { unit: newUnit },
            })
        );
    };

    const sizeClasses = {
        sm: "text-xs px-2 py-1",
        md: "text-sm px-3 py-1.5",
        lg: "text-base px-4 py-2",
    };

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {showLabel && (
                <span className="text-text-secondary text-sm">Weight:</span>
            )}
            <div className="flex bg-background-secondary rounded-md border border-accent-primary/20 overflow-hidden">
                <button
                    onClick={() => handleUnitChange("kg")}
                    className={cn(
                        "px-3 py-1.5 text-sm font-medium transition-colors",
                        sizeClasses[size],
                        currentUnit === "kg"
                            ? "bg-accent-primary text-white"
                            : "text-text-secondary hover:text-text-primary hover:bg-background-primary"
                    )}
                >
                    kg
                </button>
                <button
                    onClick={() => handleUnitChange("lbs")}
                    className={cn(
                        "px-3 py-1.5 text-sm font-medium transition-colors",
                        sizeClasses[size],
                        currentUnit === "lbs"
                            ? "bg-accent-primary text-white"
                            : "text-text-secondary hover:text-text-primary hover:bg-background-primary"
                    )}
                >
                    lbs
                </button>
            </div>
        </div>
    );
}

// Hook for components to listen to unit changes
export function useWeightUnit() {
    const [unit, setUnit] = React.useState<WeightUnit>(getDefaultWeightUnit());

    React.useEffect(() => {
        const handleUnitChange = (event: CustomEvent) => {
            setUnit(event.detail.unit);
        };

        window.addEventListener(
            "weightUnitChanged",
            handleUnitChange as EventListener
        );

        return () => {
            window.removeEventListener(
                "weightUnitChanged",
                handleUnitChange as EventListener
            );
        };
    }, []);

    return unit;
}
