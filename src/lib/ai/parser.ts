
import { ParsedMeal, ParsedExercise } from './types';
import { supabase } from '../../integrations/supabase/client';

export class AIParser {
  
  async parseMealInput(input: string): Promise<ParsedMeal> {
    try {
      // Call the AI-powered parse-user-input function
      const { data, error } = await supabase.functions.invoke('parse-user-input', {
        body: { input }
      });

      if (error) {
        console.error('AI parsing error:', error);
        return this.fallbackMealParsing(input);
      }

      if (data?.success && data?.data?.type === 'meal') {
        // Convert the AI response to our ParsedMeal format
        const aiResult = data.data;
        return {
          description: aiResult.meal_name || input,
          estimatedCalories: aiResult.total_calories || 200,
          estimatedCarbs: aiResult.total_carbs || 25,
          mealType: aiResult.meal_type || this.determineMealType(input),
          confidence: 0.8 // High confidence for AI parsing
        };
      }

      return this.fallbackMealParsing(input);
    } catch (error) {
      console.error('Error calling AI parser:', error);
      return this.fallbackMealParsing(input);
    }
  }

  private fallbackMealParsing(input: string): ParsedMeal {
    // Simple fallback when AI is unavailable
    const mealType = this.determineMealType(input);
    return {
      description: input,
      estimatedCalories: 200,
      estimatedCarbs: 25,
      mealType,
      confidence: 0.3
    };
  }

  async parseExerciseInput(input: string): Promise<ParsedExercise> {
    try {
      // Call the AI-powered parse-user-input function
      const { data, error } = await supabase.functions.invoke('parse-user-input', {
        body: { input }
      });

      if (error) {
        console.error('AI parsing error:', error);
        return this.fallbackExerciseParsing(input);
      }

      if (data?.success && data?.data?.type === 'exercise') {
        // Convert the AI response to our ParsedExercise format
        const aiResult = data.data;
        return {
          description: aiResult.exercise_name || input,
          estimatedDuration: aiResult.duration_minutes || 30,
          intensity: aiResult.intensity || 'moderate',
          exerciseType: aiResult.exercise_type || 'other',
          confidence: 0.8 // High confidence for AI parsing
        };
      }

      return this.fallbackExerciseParsing(input);
    } catch (error) {
      console.error('Error calling AI parser:', error);
      return this.fallbackExerciseParsing(input);
    }
  }

  private fallbackExerciseParsing(input: string): ParsedExercise {
    // Simple fallback when AI is unavailable
    return {
      description: input,
      estimatedDuration: 30,
      intensity: 'moderate',
      exerciseType: 'other',
      confidence: 0.3
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

// Update exports to use new AI parser
export const parseMealInput = async (input: string): Promise<ParsedMeal> => {
  const parser = new AIParser();
  return parser.parseMealInput(input);
};

export const parseExerciseInput = async (input: string): Promise<ParsedExercise> => {
  const parser = new AIParser();
  return parser.parseExerciseInput(input);
};

// Keep the old class name for backwards compatibility
export const RuleBasedParser = AIParser;
