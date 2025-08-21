import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";
import { type WeightUnit } from "../lib/unitConversion";

interface WeightInputProps {
    value?: number;
    unit?: WeightUnit;
    onWeightChange: (weight: number, unit: WeightUnit) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    showUnitToggle?: boolean;
}

export function WeightInput({
    value,
    unit: initialUnit,
    onWeightChange,
    placeholder = "0",
    className,
    disabled = false,
    showUnitToggle = true,
}: WeightInputProps) {
    const [inputValue, setInputValue] = useState<string>("");
    const [currentUnit, setCurrentUnit] = useState<WeightUnit>(
        initialUnit || "kg"
    );

    // Update when props change
    useEffect(() => {
        if (value !== undefined) {
            setInputValue(value.toString());
        } else {
            setInputValue("0");
        }
    }, [value]);

    useEffect(() => {
        if (initialUnit) {
            setCurrentUnit(initialUnit);
        }
    }, [initialUnit]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);

        // Allow empty string for better UX with backspace
        if (newValue === "") {
            onWeightChange(0, currentUnit);
        } else {
            const numValue = parseFloat(newValue);
            if (!isNaN(numValue)) {
                onWeightChange(numValue, currentUnit);
            }
        }
    };

    const handleUnitChange = (newUnit: WeightUnit) => {
        setCurrentUnit(newUnit);

        // Update with new unit - allow empty string for better UX with backspace
        if (inputValue === "") {
            onWeightChange(0, newUnit);
        } else {
            const numValue = parseFloat(inputValue);
            if (!isNaN(numValue)) {
                onWeightChange(numValue, newUnit);
            }
        }
    };

    return (
        <div className={cn("flex items-center gap-1 sm:gap-2", className)}>
            <div className="relative flex-1">
                <input
                    type="number"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={() => {
                        // When input loses focus, show 0 if empty
                        if (inputValue === "") {
                            setInputValue("0");
                        }
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                        "w-full px-3 sm:px-4 py-2 border rounded-md bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary transition-colors text-sm sm:text-base",
                        "border-gray-300",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                    min="0"
                    step="any"
                />
            </div>

            {showUnitToggle && (
                <div className="flex bg-background-secondary rounded-md border border-accent-primary/20 overflow-hidden h-full">
                    <button
                        type="button"
                        onClick={() => handleUnitChange("kg")}
                        disabled={disabled}
                        className={cn(
                            "px-3 sm:px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center min-w-[48px]",
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
                            "px-3 sm:px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center min-w-[48px]",
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
