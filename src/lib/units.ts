// Units conversion and management for glucose readings
export type GlucoseUnit = 'mg/dL' | 'mmol/L';

export interface UserPreferences {
  preferredUnit: GlucoseUnit;
}

// Conversion constants
const CONVERSION_FACTOR = 18.0;

/**
 * Convert mg/dL to mmol/L
 * Formula: mmol/L = mg/dL / 18.0
 */
export const mgdlToMmolL = (value: number): number => {
  return Number((value / CONVERSION_FACTOR).toFixed(1));
};

/**
 * Convert mmol/L to mg/dL  
 * Formula: mg/dL = mmol/L * 18.0
 */
export const mmolLToMgdl = (value: number): number => {
  return Number((value * CONVERSION_FACTOR).toFixed(0));
};

/**
 * Convert glucose value between units
 */
export const convertGlucoseValue = (
  value: number, 
  fromUnit: GlucoseUnit, 
  toUnit: GlucoseUnit
): number => {
  if (fromUnit === toUnit) return value;
  
  if (fromUnit === 'mg/dL' && toUnit === 'mmol/L') {
    return mgdlToMmolL(value);
  } else if (fromUnit === 'mmol/L' && toUnit === 'mg/dL') {
    return mmolLToMgdl(value);
  }
  
  return value;
};

/**
 * Format glucose value with appropriate unit
 */
export const formatGlucoseValue = (value: number, unit: GlucoseUnit): string => {
  const convertedValue = unit === 'mmol/L' ? 
    mgdlToMmolL(value) : 
    value;
  
  const decimals = unit === 'mmol/L' ? 1 : 0;
  return `${convertedValue.toFixed(decimals)} ${unit}`;
};

/**
 * Get default unit based on locale
 */
export const getDefaultUnit = (): GlucoseUnit => {
  // US uses mg/dL, most other countries use mmol/L
  const locale = navigator.language || 'en-US';
  return locale.startsWith('en-US') ? 'mg/dL' : 'mmol/L';
};

/**
 * Get target ranges for different units
 */
export const getTargetRanges = (unit: GlucoseUnit) => {
  if (unit === 'mmol/L') {
    return {
      low: 3.9,      // 70 mg/dL
      normal: 7.2,   // 130 mg/dL  
      high: 8.9,     // 160 mg/dL
      critical: 11.1 // 200 mg/dL
    };
  } else {
    return {
      low: 70,
      normal: 130,
      high: 160,
      critical: 200
    };
  }
};

// Local storage keys
const PREFERENCES_KEY = 'glucosense_user_preferences';

/**
 * Save user preferences to local storage
 */
export const saveUserPreferences = (preferences: UserPreferences): void => {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.error('Failed to save user preferences:', error);
  }
};

/**
 * Load user preferences from local storage
 */
export const loadUserPreferences = (): UserPreferences => {
  try {
    const saved = localStorage.getItem(PREFERENCES_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load user preferences:', error);
  }
  
  // Return defaults
  return {
    preferredUnit: getDefaultUnit()
  };
};

/**
 * Get current preferred unit
 */
export const getPreferredUnit = (): GlucoseUnit => {
  const preferences = loadUserPreferences();
  return preferences.preferredUnit;
};

/**
 * Update preferred unit and persist
 */
export const updatePreferredUnit = (unit: GlucoseUnit): void => {
  const preferences = loadUserPreferences();
  preferences.preferredUnit = unit;
  saveUserPreferences(preferences);
  
  // Dispatch custom event for real-time updates in the same page
  window.dispatchEvent(new CustomEvent('glucoseUnitsChanged', { 
    detail: { preferredUnit: unit } 
  }));
};