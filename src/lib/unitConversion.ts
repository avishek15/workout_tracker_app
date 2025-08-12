// Weight unit conversion utilities
// Database stores all weights in kg, frontend handles unit conversion

export type WeightUnit = "kg" | "lbs";

// Conversion constants
const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 0.453592;

// LocalStorage keys
const DEFAULT_WEIGHT_UNIT_KEY = "defaultWeightUnit";

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
 * Format weight with unit for display
 */
export function formatWeight(value: number, unit: WeightUnit): string {
    return `${value.toFixed(1)} ${unit}`;
}

/**
 * Get user's default weight unit preference
 */
export function getDefaultWeightUnit(): WeightUnit {
    if (typeof window === "undefined") {
        return "kg"; // Server-side fallback
    }

    const stored = localStorage.getItem(DEFAULT_WEIGHT_UNIT_KEY);
    return stored === "lbs" || stored === "kg" ? stored : "kg";
}

/**
 * Set user's default weight unit preference
 */
export function setDefaultWeightUnit(unit: WeightUnit): void {
    if (typeof window === "undefined") {
        return; // Server-side, do nothing
    }

    localStorage.setItem(DEFAULT_WEIGHT_UNIT_KEY, unit);
}

/**
 * Convert a value from kg to user's preferred unit
 */
export function convertFromKg(kgValue: number): number {
    const userUnit = getDefaultWeightUnit();
    return convertWeight(kgValue, "kg", userUnit);
}

/**
 * Convert a value to kg from user's preferred unit
 */
export function convertToKg(userValue: number): number {
    const userUnit = getDefaultWeightUnit();
    return convertWeight(userValue, userUnit, "kg");
}

/**
 * Convert a value to kg from specified unit
 */
export function convertToKgFromUnit(value: number, unit: WeightUnit): number {
    return convertWeight(value, unit, "kg");
}

/**
 * Convert a value from kg to specified unit
 */
export function convertFromKgToUnit(kgValue: number, unit: WeightUnit): number {
    return convertWeight(kgValue, "kg", unit);
}

/**
 * Format a kg value in user's preferred unit
 */
export function formatKgForUser(kgValue: number): string {
    const userUnit = getDefaultWeightUnit();
    const convertedValue = convertFromKg(kgValue);
    return formatWeight(convertedValue, userUnit);
}

/**
 * Format a value in specified unit
 */
export function formatValueInUnit(value: number, unit: WeightUnit): string {
    return formatWeight(value, unit);
}

/**
 * Get the user's preferred unit for display
 */
export function getUserDisplayUnit(): WeightUnit {
    return getDefaultWeightUnit();
}

/**
 * Validate if a weight value is reasonable for the given unit
 */
export function validateWeight(value: number, unit: WeightUnit): boolean {
    if (value < 0) return false;

    if (unit === "kg") {
        return value <= 1000; // 1000 kg max
    } else {
        return value <= 2200; // 2200 lbs max
    }
}

/**
 * Round weight to reasonable precision based on unit
 */
export function roundWeight(value: number, unit: WeightUnit): number {
    if (unit === "kg") {
        return Math.round(value * 10) / 10; // 1 decimal place
    } else {
        return Math.round(value); // Whole numbers for lbs
    }
}
