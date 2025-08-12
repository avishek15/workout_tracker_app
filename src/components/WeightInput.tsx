import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import {
    convertToKgFromUnit,
    convertFromKgToUnit,
    validateWeight,
    roundWeight,
    formatValueInUnit,
    type WeightUnit,
} from "../lib/unitConversion";

interface WeightInputProps {
    value?: number;
    unit?: WeightUnit;
    onWeightChange: (weight: number, unit: WeightUnit) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    showUnitToggle?: boolean;
    defaultUnit?: WeightUnit;
}

export function WeightInput({
    value,
    unit: initialUnit,
    onWeightChange,
    placeholder = "0",
    className,
    disabled = false,
    showUnitToggle = true,
    defaultUnit = "kg",
}: WeightInputProps) {
    const [inputValue, setInputValue] = useState<string>("");
    const [currentUnit, setCurrentUnit] = useState<WeightUnit>(
        initialUnit || defaultUnit
    );
    const [isValid, setIsValid] = useState(true);

    // Initialize input value when value prop changes
    useEffect(() => {
        if (value !== undefined && initialUnit) {
            const displayValue = convertToKgFromUnit(value, initialUnit);
            setInputValue(displayValue.toString());
            setCurrentUnit(initialUnit);
        } else {
            setInputValue("");
        }
    }, [value, initialUnit]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        // Validate input
        const numValue = parseFloat(newValue);
        const valid =
            newValue === "" ||
            (!isNaN(numValue) && validateWeight(numValue, currentUnit));
        setIsValid(valid);

        // Update parent if valid
        if (valid && !isNaN(numValue)) {
            const kgValue = convertToKgFromUnit(numValue, currentUnit);
            onWeightChange(kgValue, currentUnit);
        } else if (newValue === "") {
            // Handle empty input
            onWeightChange(0, currentUnit);
        }
    };

    const handleUnitChange = (newUnit: WeightUnit) => {
        if (inputValue && !isNaN(parseFloat(inputValue))) {
            const currentValue = parseFloat(inputValue);
            const kgValue = convertToKgFromUnit(currentValue, currentUnit);
            const newDisplayValue = convertFromKgToUnit(kgValue, newUnit);
            const roundedValue = roundWeight(newDisplayValue, newUnit);

            setInputValue(roundedValue.toString());
            setCurrentUnit(newUnit);

            // Update parent with new unit
            onWeightChange(kgValue, newUnit);
        } else {
            setCurrentUnit(newUnit);
        }
    };

    const handleBlur = () => {
        if (inputValue && !isNaN(parseFloat(inputValue))) {
            const numValue = parseFloat(inputValue);
            const roundedValue = roundWeight(numValue, currentUnit);
            setInputValue(roundedValue.toString());
        }
    };

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="relative flex-1">
                <input
                    type="number"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                        "w-full px-3 py-2 border rounded-md bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary transition-colors",
                        !isValid && "border-red-500 focus:ring-red-500",
                        isValid && "border-accent-primary/20",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                    min="0"
                    step="any"
                />
                {!isValid && (
                    <div className="absolute -bottom-6 left-0 text-xs text-red-500">
                        Invalid weight
                    </div>
                )}
            </div>

            {showUnitToggle && (
                <div className="flex bg-background-secondary rounded-md border border-accent-primary/20 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => handleUnitChange("kg")}
                        disabled={disabled}
                        className={cn(
                            "px-3 py-2 text-sm font-medium transition-colors",
                            currentUnit === "kg"
                                ? "bg-accent-primary text-white"
                                : "text-text-secondary hover:text-text-primary hover:bg-background-primary",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        kg
                    </button>
                    <button
                        type="button"
                        onClick={() => handleUnitChange("lbs")}
                        disabled={disabled}
                        className={cn(
                            "px-3 py-2 text-sm font-medium transition-colors",
                            currentUnit === "lbs"
                                ? "bg-accent-primary text-white"
                                : "text-text-secondary hover:text-text-primary hover:bg-background-primary",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        lbs
                    </button>
                </div>
            )}
        </div>
    );
}

// Hook for managing weight state with unit
export function useWeightInput(
    initialWeight?: number,
    initialUnit?: WeightUnit
) {
    const [weight, setWeight] = useState<number>(initialWeight || 0);
    const [unit, setUnit] = useState<WeightUnit>(initialUnit || "kg");

    const handleWeightChange = (newWeight: number, newUnit: WeightUnit) => {
        setWeight(newWeight);
        setUnit(newUnit);
    };

    return {
        weight,
        unit,
        handleWeightChange,
        // Helper to get display value in current unit
        displayValue: weight > 0 ? convertToKgFromUnit(weight, unit) : 0,
        // Helper to format for display
        formattedValue:
            weight > 0
                ? formatValueInUnit(convertToKgFromUnit(weight, unit), unit)
                : "",
    };
}
