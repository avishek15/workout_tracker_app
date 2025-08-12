// Unit conversion utilities for standardizing weight units across the app

export type WeightUnit = "kg" | "lbs";

// Conversion factors
const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 0.453592;

/**
 * Convert weight from one unit to another
 */
export function convertWeight(
    value: number,
    fromUnit: WeightUnit,
    toUnit: WeightUnit
): number {
    if (fromUnit === toUnit) {
        return value;
    }

    if (fromUnit === "kg" && toUnit === "lbs") {
        return value * KG_TO_LBS;
    }

    if (fromUnit === "lbs" && toUnit === "kg") {
        return value * LBS_TO_KG;
    }

    return value;
}

/**
 * Format weight with unit
 */
export function formatWeight(
    value: number,
    unit: WeightUnit,
    decimals: number = 1
): string {
    const roundedValue =
        Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
    return `${roundedValue} ${unit}`;
}

/**
 * Get user's preferred weight unit from localStorage or default to kg
 */
export function getUserWeightUnit(): WeightUnit {
    if (typeof window === "undefined") {
        return "kg"; // Default for server-side rendering
    }

    const stored = localStorage.getItem("weightUnit");
    return (stored as WeightUnit) || "kg";
}

/**
 * Set user's preferred weight unit
 */
export function setUserWeightUnit(unit: WeightUnit): void {
    if (typeof window === "undefined") {
        return;
    }

    localStorage.setItem("weightUnit", unit);
}

/**
 * Convert weight to user's preferred unit
 */
export function convertToUserUnit(value: number, fromUnit: WeightUnit): number {
    const userUnit = getUserWeightUnit();
    return convertWeight(value, fromUnit, userUnit);
}

/**
 * Format weight in user's preferred unit
 */
export function formatWeightForUser(
    value: number,
    fromUnit: WeightUnit
): string {
    const userUnit = getUserWeightUnit();
    const convertedValue = convertWeight(value, fromUnit, userUnit);
    return formatWeight(convertedValue, userUnit);
}

/**
 * Get display unit for user
 */
export function getUserDisplayUnit(): WeightUnit {
    return getUserWeightUnit();
}

/**
 * Convert weight from user's preferred unit to storage unit (kg)
 */
export function convertFromUserUnit(value: number): number {
    const userUnit = getUserWeightUnit();
    return convertWeight(value, userUnit, "kg");
}
