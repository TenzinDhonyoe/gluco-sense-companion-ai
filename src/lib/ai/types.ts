
export interface GlucoseReading {
  id: string;
  value: number;
  timestamp: string;
  tag?: string;
}

export interface MealLog {
  id: string;
  description: string;
  timestamp: string;
  calories?: number;
  carbs?: number;
  type?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface ExerciseLog {
  id: string;
  description: string;
  timestamp: string;
  duration?: number;
  intensity?: 'low' | 'moderate' | 'high' | 'very_high';
  type?: string;
}

export interface Suggestion {
  text: string;
  level: 'low' | 'medium' | 'high';
  category: 'glucose' | 'meal' | 'exercise' | 'general';
}

export interface ParsedMeal {
  description: string;
  estimatedCalories?: number;
  estimatedCarbs?: number;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  confidence: number;
}

export interface ParsedExercise {
  description: string;
  estimatedDuration?: number;
  intensity?: 'low' | 'moderate' | 'high' | 'very_high';
  exerciseType?: string;
  confidence: number;
}
