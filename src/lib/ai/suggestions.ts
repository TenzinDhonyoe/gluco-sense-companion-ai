
import { GlucoseReading, MealLog, ExerciseLog, Suggestion } from './types';

export class RuleBasedSuggestionEngine {
  private readonly GLUCOSE_TARGET_MIN = 70;
  private readonly GLUCOSE_TARGET_MAX = 140;
  private readonly GLUCOSE_HIGH_THRESHOLD = 180;
  private readonly GLUCOSE_LOW_THRESHOLD = 70;

  getSuggestions(
    glucoseReadings: GlucoseReading[],
    meals: MealLog[],
    exercises: ExerciseLog[]
  ): Suggestion[] {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Filter data to last 24 hours
    const recentReadings = glucoseReadings.filter(
      r => new Date(r.timestamp) >= twentyFourHoursAgo
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const recentMeals = meals.filter(
      m => new Date(m.timestamp) >= twentyFourHoursAgo
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const recentExercises = exercises.filter(
      e => new Date(e.timestamp) >= twentyFourHoursAgo
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const suggestions: Suggestion[] = [];

    // Rule 1: Post-meal glucose spike
    const postMealSpike = this.checkPostMealSpike(recentReadings, recentMeals);
    if (postMealSpike) suggestions.push(postMealSpike);

    // Rule 2: Overnight lows
    const overnightLow = this.checkOvernightLows(recentReadings);
    if (overnightLow) suggestions.push(overnightLow);

    // Rule 3: No exercise today
    const exerciseReminder = this.checkExerciseActivity(recentExercises);
    if (exerciseReminder) suggestions.push(exerciseReminder);

    // Rule 4: High percentage of out-of-range readings
    const highRangeWarning = this.checkHighRangePercentage(recentReadings);
    if (highRangeWarning) suggestions.push(highRangeWarning);

    // Rule 5: Frequent lows
    const frequentLows = this.checkFrequentLows(recentReadings);
    if (frequentLows) suggestions.push(frequentLows);

    // Rule 6: Large glucose swings
    const glucoseSwings = this.checkGlucoseSwings(recentReadings);
    if (glucoseSwings) suggestions.push(glucoseSwings);

    // Rule 7: Late night eating
    const lateNightEating = this.checkLateNightEating(recentMeals);
    if (lateNightEating) suggestions.push(lateNightEating);

    // Rule 8: Meal timing irregularity
    const mealTiming = this.checkMealTiming(recentMeals);
    if (mealTiming) suggestions.push(mealTiming);

    // Return top 3 suggestions by priority
    return suggestions
      .sort((a, b) => this.getSuggestionPriority(b) - this.getSuggestionPriority(a))
      .slice(0, 3);
  }

  private checkPostMealSpike(readings: GlucoseReading[], meals: MealLog[]): Suggestion | null {
    if (meals.length === 0 || readings.length === 0) return null;

    const lastMeal = meals[0];
    const mealTime = new Date(lastMeal.timestamp);
    
    // Look for readings 30-120 minutes after the meal
    const postMealReadings = readings.filter(r => {
      const readingTime = new Date(r.timestamp);
      const timeDiff = readingTime.getTime() - mealTime.getTime();
      return timeDiff > 30 * 60 * 1000 && timeDiff < 120 * 60 * 1000;
    });

    if (postMealReadings.length === 0) return null;

    const highestPostMeal = Math.max(...postMealReadings.map(r => r.value));
    
    if (highestPostMeal > 140) {
      return {
        text: `Your glucose rose to ${highestPostMeal} mg/dL after your last meal—try a 10-min walk`,
        level: 'medium',
        category: 'glucose'
      };
    }

    return null;
  }

  private checkOvernightLows(readings: GlucoseReading[]): Suggestion | null {
    const overnightReadings = readings.filter(r => {
      const hour = new Date(r.timestamp).getHours();
      return hour >= 0 && hour <= 6;
    });

    const lowOvernightReadings = overnightReadings.filter(r => r.value < 80);
    
    if (lowOvernightReadings.length >= 3) {
      return {
        text: 'You dipped low overnight multiple times—consider a light bedtime snack',
        level: 'high',
        category: 'glucose'
      };
    }

    return null;
  }

  private checkExerciseActivity(exercises: ExerciseLog[]): Suggestion | null {
    if (exercises.length === 0) {
      return {
        text: 'No exercise logged today—aim for at least 15 min of walking',
        level: 'low',
        category: 'exercise'
      };
    }

    const totalDuration = exercises.reduce((sum, ex) => sum + (ex.duration || 15), 0);
    
    if (totalDuration < 30) {
      return {
        text: 'Try to get 30+ minutes of activity today for better glucose control',
        level: 'medium',
        category: 'exercise'
      };
    }

    return null;
  }

  private checkHighRangePercentage(readings: GlucoseReading[]): Suggestion | null {
    if (readings.length < 4) return null;

    const highReadings = readings.filter(r => r.value > 140);
    const highPercentage = (highReadings.length / readings.length) * 100;

    if (highPercentage > 25) {
      return {
        text: `Over ${Math.round(highPercentage)}% of readings were above range—reduce carb portions`,
        level: 'high',
        category: 'meal'
      };
    }

    return null;
  }

  private checkFrequentLows(readings: GlucoseReading[]): Suggestion | null {
    const lowReadings = readings.filter(r => r.value < 70);
    
    if (lowReadings.length >= 2) {
      return {
        text: 'Multiple low readings detected—check with your healthcare provider',
        level: 'high',
        category: 'glucose'
      };
    }

    return null;
  }

  private checkGlucoseSwings(readings: GlucoseReading[]): Suggestion | null {
    if (readings.length < 3) return null;

    let maxSwing = 0;
    for (let i = 0; i < readings.length - 1; i++) {
      const swing = Math.abs(readings[i].value - readings[i + 1].value);
      maxSwing = Math.max(maxSwing, swing);
    }

    if (maxSwing > 80) {
      return {
        text: 'Large glucose swings detected—try eating smaller, more frequent meals',
        level: 'medium',
        category: 'meal'
      };
    }

    return null;
  }

  private checkLateNightEating(meals: MealLog[]): Suggestion | null {
    const lateNightMeals = meals.filter(m => {
      const hour = new Date(m.timestamp).getHours();
      return hour >= 22 || hour <= 2;
    });

    if (lateNightMeals.length > 0) {
      return {
        text: 'Late night eating can affect overnight glucose—try earlier dinner',
        level: 'medium',
        category: 'meal'
      };
    }

    return null;
  }

  private checkMealTiming(meals: MealLog[]): Suggestion | null {
    if (meals.length < 2) return null;

    const mealTimes = meals.map(m => new Date(m.timestamp).getTime());
    const timeDiffs = [];
    
    for (let i = 0; i < mealTimes.length - 1; i++) {
      timeDiffs.push(mealTimes[i] - mealTimes[i + 1]);
    }

    const avgTimeBetweenMeals = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
    const hoursBetwenMeals = avgTimeBetweenMeals / (1000 * 60 * 60);

    if (hoursBetwenMeals > 8) {
      return {
        text: 'Long gaps between meals—try eating every 4-6 hours for stable glucose',
        level: 'low',
        category: 'meal'
      };
    }

    return null;
  }

  private getSuggestionPriority(suggestion: Suggestion): number {
    const levelPriority = { high: 3, medium: 2, low: 1 };
    return levelPriority[suggestion.level];
  }
}

export const getSuggestions = (
  glucoseReadings: GlucoseReading[],
  meals: MealLog[],
  exercises: ExerciseLog[]
): Suggestion[] => {
  const engine = new RuleBasedSuggestionEngine();
  return engine.getSuggestions(glucoseReadings, meals, exercises);
};
