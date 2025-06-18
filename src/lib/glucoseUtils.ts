
export type GlucoseUnit = 'mg/dL' | 'mmol/L';
export type GlucoseTag = 'fasting' | 'post-meal' | 'before-sleep' | 'random' | 'pre-meal' | 'bedtime' | 'exercise';

export const glucoseTags: { value: GlucoseTag; label: string }[] = [
  { value: 'fasting', label: 'Fasting' },
  { value: 'post-meal', label: 'After Meal' },
  { value: 'pre-meal', label: 'Before Meal' },
  { value: 'bedtime', label: 'Bedtime' },
  { value: 'before-sleep', label: 'Before Sleep' },
  { value: 'exercise', label: 'Exercise' },
  { value: 'random', label: 'Random' },
];

// Convert mg/dL to mmol/L
export const mgdlToMmol = (value: number): number => {
  return Math.round((value / 18.018) * 100) / 100;
};

// Convert mmol/L to mg/dL
export const mmolToMgdl = (value: number): number => {
  return Math.round((value * 18.018) * 10) / 10;
};

// Convert between units
export const convertGlucoseValue = (value: number, fromUnit: GlucoseUnit, toUnit: GlucoseUnit): number => {
  if (fromUnit === toUnit) return value;
  
  if (fromUnit === 'mg/dL' && toUnit === 'mmol/L') {
    return mgdlToMmol(value);
  }
  
  if (fromUnit === 'mmol/L' && toUnit === 'mg/dL') {
    return mmolToMgdl(value);
  }
  
  return value;
};

// Get glucose level category for styling
export const getGlucoseCategory = (value: number, unit: GlucoseUnit): 'low' | 'normal' | 'high' => {
  const mgdlValue = unit === 'mmol/L' ? mmolToMgdl(value) : value;
  
  if (mgdlValue < 70) return 'low';
  if (mgdlValue > 180) return 'high';
  return 'normal';
};

// Format glucose value for display
export const formatGlucoseValue = (value: number, unit: GlucoseUnit): string => {
  if (unit === 'mmol/L') {
    return value.toFixed(1);
  }
  return Math.round(value).toString();
};
