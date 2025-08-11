// Stability Score calculation module for wellness tracking
export interface StabilityScore {
  value: number; // 0-100
  label: string;
  components: {
    postMealExcursion: number;
    dayVar: number;
    overnightVar: number;
    coverage: number;
    lateMealRate: number;
  };
}

export interface GlucoseReading {
  value: number;
  timestamp: number;
}

export interface MealLog {
  timestamp: number;
  mealType?: string;
}

// Weights for stability score components (must sum to 1.0)
const WEIGHTS = {
  postMealExcursion: 0.35,
  dayVar: 0.25,
  overnightVar: 0.15,
  coverage: 0.15,
  lateMealRate: 0.10
};

/**
 * Winsorize outliers by capping extreme values
 */
const winsorize = (values: number[], percentile = 0.05): number[] => {
  if (values.length === 0) return values;
  
  const sorted = [...values].sort((a, b) => a - b);
  const lowerIndex = Math.floor(values.length * percentile);
  const upperIndex = Math.floor(values.length * (1 - percentile));
  
  const lowerBound = sorted[lowerIndex];
  const upperBound = sorted[upperIndex];
  
  return values.map(v => Math.min(Math.max(v, lowerBound), upperBound));
};

/**
 * Calculate mean absolute deviation (MAD) for variability
 */
const calculateMAD = (values: number[]): number => {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const deviations = values.map(val => Math.abs(val - mean));
  return deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
};

/**
 * Normalize value to 0-100 scale using z-score approach
 */
const normalize = (value: number, typical: number, stdDev: number): number => {
  if (stdDev === 0) return 50; // Default to middle if no variation
  
  const zScore = (value - typical) / stdDev;
  // Convert z-score to 0-100 scale (clamped)
  const normalized = 50 + (zScore * 16.67); // ±3 std devs = 0-100 range
  return Math.max(0, Math.min(100, normalized));
};

/**
 * Calculate post-meal excursion (0-2h rise after meals)
 */
const calculatePostMealExcursion = (
  glucoseReadings: GlucoseReading[],
  meals: MealLog[]
): number => {
  const excursions: number[] = [];
  
  meals.forEach(meal => {
    const mealTime = meal.timestamp;
    const twoHoursAfter = mealTime + (2 * 60 * 60 * 1000);
    
    // Find baseline reading (30 min before to 30 min after meal)
    const baselineWindow = glucoseReadings.filter(r => 
      r.timestamp >= (mealTime - 30 * 60 * 1000) &&
      r.timestamp <= (mealTime + 30 * 60 * 1000)
    );
    
    // Find post-meal readings (30 min to 2h after meal)
    const postMealReadings = glucoseReadings.filter(r =>
      r.timestamp >= (mealTime + 30 * 60 * 1000) &&
      r.timestamp <= twoHoursAfter
    );
    
    if (baselineWindow.length > 0 && postMealReadings.length > 0) {
      const baseline = baselineWindow.reduce((sum, r) => sum + r.value, 0) / baselineWindow.length;
      const peak = Math.max(...postMealReadings.map(r => r.value));
      const excursion = Math.max(0, peak - baseline);
      excursions.push(excursion);
    }
  });
  
  if (excursions.length === 0) return 0;
  
  // Winsorize outliers
  const winsorizedExcursions = winsorize(excursions);
  return winsorizedExcursions.reduce((sum, exc) => sum + exc, 0) / winsorizedExcursions.length;
};

/**
 * Calculate daytime variability (7am - 11pm)
 */
const calculateDaytimeVariability = (glucoseReadings: GlucoseReading[]): number => {
  const daytimeReadings = glucoseReadings.filter(reading => {
    const hour = new Date(reading.timestamp).getHours();
    return hour >= 7 && hour <= 23;
  });
  
  if (daytimeReadings.length === 0) return 0;
  
  const values = daytimeReadings.map(r => r.value);
  return calculateMAD(values);
};

/**
 * Calculate overnight variability (11pm - 7am)
 */
const calculateOvernightVariability = (glucoseReadings: GlucoseReading[]): number => {
  const overnightReadings = glucoseReadings.filter(reading => {
    const hour = new Date(reading.timestamp).getHours();
    return hour >= 23 || hour <= 7;
  });
  
  if (overnightReadings.length === 0) return 0;
  
  const values = overnightReadings.map(r => r.value);
  return calculateMAD(values);
};

/**
 * Calculate coverage percentage (% of waking hours with readings)
 */
const calculateCoverage = (glucoseReadings: GlucoseReading[]): number => {
  if (glucoseReadings.length === 0) return 0;
  
  // Assume 16 waking hours per day (7am - 11pm)
  const wakingHoursPerDay = 16;
  const daysInPeriod = 7; // Calculate for last 7 days
  const totalWakingHours = wakingHoursPerDay * daysInPeriod;
  
  const now = Date.now();
  const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
  
  const recentReadings = glucoseReadings.filter(r => 
    r.timestamp >= sevenDaysAgo && r.timestamp <= now
  );
  
  // Count unique waking hours with readings
  const hoursWithReadings = new Set();
  recentReadings.forEach(reading => {
    const date = new Date(reading.timestamp);
    const hour = date.getHours();
    
    // Only count waking hours (7am - 11pm)
    if (hour >= 7 && hour <= 23) {
      const dayHourKey = `${date.toDateString()}-${hour}`;
      hoursWithReadings.add(dayHourKey);
    }
  });
  
  const coveragePercentage = (hoursWithReadings.size / totalWakingHours) * 100;
  return Math.min(100, coveragePercentage);
};

/**
 * Calculate late meal rate (proportion of meals after 9pm)
 */
const calculateLateMealRate = (meals: MealLog[]): number => {
  if (meals.length === 0) return 0;
  
  const lateMeals = meals.filter(meal => {
    const hour = new Date(meal.timestamp).getHours();
    return hour >= 21; // 9pm or later
  });
  
  return (lateMeals.length / meals.length) * 100;
};

/**
 * Calculate overall stability score
 */
export const calculateStabilityScore = (
  glucoseReadings: GlucoseReading[],
  meals: MealLog[]
): StabilityScore => {
  // Calculate individual components
  const postMealExcursion = calculatePostMealExcursion(glucoseReadings, meals);
  const dayVar = calculateDaytimeVariability(glucoseReadings);
  const overnightVar = calculateOvernightVariability(glucoseReadings);
  const coverage = calculateCoverage(glucoseReadings);
  const lateMealRate = calculateLateMealRate(meals);
  
  // Typical values for normalization (based on clinical data)
  const typicalValues = {
    postMealExcursion: 45, // mg/dL
    dayVar: 20,           // mg/dL MAD
    overnightVar: 10,     // mg/dL MAD
    lateMealRate: 20      // % of meals
  };
  
  const stdDeviations = {
    postMealExcursion: 25,
    dayVar: 15,
    overnightVar: 8,
    lateMealRate: 15
  };
  
  // Normalize each component (lower variability = higher score)
  const normalizedComponents = {
    postMealExcursion: 100 - normalize(postMealExcursion, typicalValues.postMealExcursion, stdDeviations.postMealExcursion),
    dayVar: 100 - normalize(dayVar, typicalValues.dayVar, stdDeviations.dayVar),
    overnightVar: 100 - normalize(overnightVar, typicalValues.overnightVar, stdDeviations.overnightVar),
    coverage: coverage, // Already 0-100
    lateMealRate: 100 - normalize(lateMealRate, typicalValues.lateMealRate, stdDeviations.lateMealRate)
  };
  
  // Calculate weighted score
  const weightedScore = 
    WEIGHTS.postMealExcursion * normalizedComponents.postMealExcursion +
    WEIGHTS.dayVar * normalizedComponents.dayVar +
    WEIGHTS.overnightVar * normalizedComponents.overnightVar +
    WEIGHTS.coverage * normalizedComponents.coverage +
    WEIGHTS.lateMealRate * normalizedComponents.lateMealRate;
  
  // Clamp to 0-100 range
  const finalScore = Math.max(0, Math.min(100, Math.round(weightedScore)));
  
  // Generate label based on score
  let label: string;
  if (finalScore >= 80) {
    label = "Very steady";
  } else if (finalScore >= 60) {
    label = "Mostly steady";
  } else if (finalScore >= 40) {
    label = "Some ups & downs";
  } else {
    label = "Wide swings";
  }
  
  return {
    value: finalScore,
    label,
    components: {
      postMealExcursion,
      dayVar,
      overnightVar,
      coverage,
      lateMealRate
    }
  };
};

/**
 * Get stability score for a specific time period
 */
export const getStabilityScoreForPeriod = (
  glucoseReadings: GlucoseReading[],
  meals: MealLog[],
  startDate: Date,
  endDate: Date
): StabilityScore => {
  const startTime = startDate.getTime();
  const endTime = endDate.getTime();
  
  const filteredReadings = glucoseReadings.filter(r =>
    r.timestamp >= startTime && r.timestamp <= endTime
  );
  
  const filteredMeals = meals.filter(m =>
    m.timestamp >= startTime && m.timestamp <= endTime
  );
  
  return calculateStabilityScore(filteredReadings, filteredMeals);
};

/**
 * Get daily stability score
 */
export const getDailyStabilityScore = (
  glucoseReadings: GlucoseReading[],
  meals: MealLog[],
  date: Date = new Date()
): StabilityScore => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return getStabilityScoreForPeriod(glucoseReadings, meals, startOfDay, endOfDay);
};

/**
 * Get weekly stability score
 */
export const getWeeklyStabilityScore = (
  glucoseReadings: GlucoseReading[],
  meals: MealLog[],
  endDate: Date = new Date()
): StabilityScore => {
  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - 7);
  
  return getStabilityScoreForPeriod(glucoseReadings, meals, startDate, endDate);
};