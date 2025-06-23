
import { ParsedMeal, ParsedExercise } from './types';

export class RuleBasedParser {
  // Common food keywords and their estimated values
  private readonly FOOD_DATABASE = {
    // Fruits
    'apple': { calories: 80, carbs: 21 },
    'banana': { calories: 105, carbs: 27 },
    'orange': { calories: 65, carbs: 16 },
    'berries': { calories: 50, carbs: 12 },
    'grapes': { calories: 90, carbs: 23 },
    
    // Proteins
    'chicken': { calories: 200, carbs: 0 },
    'salmon': { calories: 250, carbs: 0 },
    'egg': { calories: 70, carbs: 1 },
    'eggs': { calories: 140, carbs: 2 },
    'tuna': { calories: 150, carbs: 0 },
    
    // Grains/Starches
    'rice': { calories: 150, carbs: 33 },
    'pasta': { calories: 200, carbs: 40 },
    'bread': { calories: 80, carbs: 15 },
    'quinoa': { calories: 160, carbs: 30 },
    'oatmeal': { calories: 120, carbs: 22 },
    
    // Vegetables
    'salad': { calories: 50, carbs: 10 },
    'broccoli': { calories: 30, carbs: 6 },
    'spinach': { calories: 20, carbs: 3 },
    'carrots': { calories: 40, carbs: 9 },
    
    // Fast food
    'pizza': { calories: 300, carbs: 35 },
    'burger': { calories: 400, carbs: 30 },
    'fries': { calories: 300, carbs: 40 },
    'sandwich': { calories: 250, carbs: 25 },
    
    // Snacks
    'yogurt': { calories: 100, carbs: 15 },
    'nuts': { calories: 200, carbs: 8 },
    'cheese': { calories: 100, carbs: 2 },
    'crackers': { calories: 120, carbs: 20 }
  };

  private readonly EXERCISE_DATABASE = {
    'walk': { duration: 30, intensity: 'low' as const, type: 'cardio' },
    'walking': { duration: 30, intensity: 'low' as const, type: 'cardio' },
    'run': { duration: 20, intensity: 'high' as const, type: 'cardio' },
    'running': { duration: 20, intensity: 'high' as const, type: 'cardio' },
    'jog': { duration: 25, intensity: 'moderate' as const, type: 'cardio' },
    'jogging': { duration: 25, intensity: 'moderate' as const, type: 'cardio' },
    'bike': { duration: 30, intensity: 'moderate' as const, type: 'cardio' },
    'cycling': { duration: 30, intensity: 'moderate' as const, type: 'cardio' },
    'swim': { duration: 30, intensity: 'moderate' as const, type: 'cardio' },
    'swimming': { duration: 30, intensity: 'moderate' as const, type: 'cardio' },
    'yoga': { duration: 45, intensity: 'low' as const, type: 'flexibility' },
    'pilates': { duration: 45, intensity: 'low' as const, type: 'flexibility' },
    'weights': { duration: 45, intensity: 'moderate' as const, type: 'strength' },
    'weightlifting': { duration: 45, intensity: 'moderate' as const, type: 'strength' },
    'gym': { duration: 60, intensity: 'moderate' as const, type: 'strength' }
  };

  parseMealInput(input: string): ParsedMeal {
    const cleanInput = input.toLowerCase().trim();
    
    // Extract quantities
    const quantityMatch = cleanInput.match(/(\d+)\s*(slice|slices|piece|pieces|cup|cups|bowl|bowls)?/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
    
    // Determine meal type based on time or keywords
    const mealType = this.determineMealType(cleanInput);
    
    // Calculate nutrition estimates
    let totalCalories = 0;
    let totalCarbs = 0;
    let confidence = 0;
    
    const foundFoods = [];
    
    for (const [food, nutrition] of Object.entries(this.FOOD_DATABASE)) {
      if (cleanInput.includes(food)) {
        foundFoods.push({ food, nutrition, quantity });
        totalCalories += nutrition.calories * quantity;
        totalCarbs += nutrition.carbs * quantity;
        confidence += 0.8; // High confidence for known foods
      }
    }
    
    // If no specific foods found, make general estimates
    if (foundFoods.length === 0) {
      if (this.containsKeywords(cleanInput, ['meal', 'dinner', 'lunch'])) {
        totalCalories = 400;
        totalCarbs = 50;
        confidence = 0.3;
      } else if (this.containsKeywords(cleanInput, ['snack', 'small'])) {
        totalCalories = 150;
        totalCarbs = 20;
        confidence = 0.3;
      } else {
        totalCalories = 250;
        totalCarbs = 30;
        confidence = 0.2;
      }
    }
    
    // Adjust confidence based on input quality
    confidence = Math.min(confidence, 1.0);
    if (cleanInput.length < 5) confidence *= 0.5;
    
    return {
      description: input,
      estimatedCalories: Math.round(totalCalories),
      estimatedCarbs: Math.round(totalCarbs),
      mealType,
      confidence: Math.round(confidence * 100) / 100
    };
  }

  parseExerciseInput(input: string): ParsedExercise {
    const cleanInput = input.toLowerCase().trim();
    
    // Extract duration
    const durationMatch = cleanInput.match(/(\d+)\s*(min|minutes|hour|hours|hrs?)/);
    let duration = durationMatch ? parseInt(durationMatch[1]) : undefined;
    
    // Convert hours to minutes
    if (durationMatch && (durationMatch[2].includes('hour') || durationMatch[2].includes('hr'))) {
      duration = duration! * 60;
    }
    
    let exerciseType = 'other';
    let intensity: 'low' | 'moderate' | 'high' | 'very_high' = 'moderate';
    let confidence = 0;
    
    // Find matching exercises
    for (const [exercise, data] of Object.entries(this.EXERCISE_DATABASE)) {
      if (cleanInput.includes(exercise)) {
        exerciseType = data.type;
        intensity = data.intensity;
        if (!duration) duration = data.duration;
        confidence += 0.8;
        break;
      }
    }
    
    // Determine intensity from keywords
    if (this.containsKeywords(cleanInput, ['light', 'easy', 'gentle'])) {
      intensity = 'low';
    } else if (this.containsKeywords(cleanInput, ['intense', 'hard', 'vigorous', 'fast'])) {
      intensity = 'high';
    } else if (this.containsKeywords(cleanInput, ['moderate', 'medium'])) {
      intensity = 'moderate';
    }
    
    // Default estimates if nothing specific found
    if (confidence === 0) {
      duration = duration || 20;
      confidence = 0.3;
    }
    
    // Adjust confidence
    confidence = Math.min(confidence, 1.0);
    if (cleanInput.length < 5) confidence *= 0.5;
    
    return {
      description: input,
      estimatedDuration: duration,
      intensity,
      exerciseType,
      confidence: Math.round(confidence * 100) / 100
    };
  }

  private determineMealType(input: string): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
    const hour = new Date().getHours();
    
    if (this.containsKeywords(input, ['breakfast', 'morning', 'cereal', 'oatmeal'])) {
      return 'breakfast';
    } else if (this.containsKeywords(input, ['lunch', 'noon'])) {
      return 'lunch';
    } else if (this.containsKeywords(input, ['dinner', 'evening', 'supper'])) {
      return 'dinner';
    } else if (this.containsKeywords(input, ['snack', 'small', 'quick'])) {
      return 'snack';
    }
    
    // Time-based fallback
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    if (hour >= 16 && hour < 22) return 'dinner';
    return 'snack';
  }

  private containsKeywords(input: string, keywords: string[]): boolean {
    return keywords.some(keyword => input.includes(keyword));
  }
}

export const parseMealInput = (input: string): ParsedMeal => {
  const parser = new RuleBasedParser();
  return parser.parseMealInput(input);
};

export const parseExerciseInput = (input: string): ParsedExercise => {
  const parser = new RuleBasedParser();
  return parser.parseExerciseInput(input);
};
