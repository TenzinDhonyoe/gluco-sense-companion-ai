
import { GlucoseReading, MealLog, ExerciseLog, Suggestion } from './types';
import { supabase } from '../../integrations/supabase/client';

export class AISuggestionEngine {
  private readonly GLUCOSE_TARGET_MIN = 70;
  private readonly GLUCOSE_TARGET_MAX = 140;
  private readonly GLUCOSE_HIGH_THRESHOLD = 180;
  private readonly GLUCOSE_LOW_THRESHOLD = 70;

  async getSuggestions(
    glucoseReadings: GlucoseReading[],
    meals: MealLog[],
    exercises: ExerciseLog[]
  ): Promise<Suggestion[]> {
    try {
      // For now, use rule-based suggestions until AI function is properly deployed
      // This ensures the app works smoothly in development
      console.log('Using rule-based suggestions engine for stable experience');
      return this.getFallbackSuggestions(glucoseReadings, meals, exercises);

      // AI function call is commented out until backend is properly configured
      /*
      // Prepare data for AI analysis
      const glucoseData = glucoseReadings.map(reading => ({
        value: reading.value,
        time: new Date(reading.timestamp).toLocaleTimeString()
      }));

      const logs = [
        ...meals.map(meal => ({
          type: 'meal',
          description: meal.description,
          timestamp: meal.timestamp
        })),
        ...exercises.map(exercise => ({
          type: 'exercise',
          description: exercise.description,
          timestamp: exercise.timestamp
        }))
      ];

      // Call the AI-powered suggestions function with comprehensive user data
      const { data, error } = await supabase.functions.invoke('ai-suggestions', {
        body: { 
          glucoseData: glucoseData,
          logs: logs,
          userProfile: {
            totalGlucoseReadings: glucoseData.length,
            totalLogs: logs.length,
            dataRange: logs.length > 0 ? 
              `${new Date(logs[logs.length-1].timestamp).toLocaleDateString()} to ${new Date(logs[0].timestamp).toLocaleDateString()}` : 
              'No data available',
            analysisTimestamp: new Date().toISOString()
          }
        }
      });

      if (error) {
        console.error('AI suggestions error:', error);
        return this.getFallbackSuggestions(glucoseReadings, meals, exercises);
      }

      if (data?.suggestions && Array.isArray(data.suggestions)) {
        return data.suggestions.slice(0, 3).map((suggestion: string, index: number) => ({
          text: suggestion,
          level: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
          category: this.categorizeSuggestion(suggestion)
        }));
      }
      */

      return this.getFallbackSuggestions(glucoseReadings, meals, exercises);
    } catch (error) {
      console.error('Error calling AI suggestions:', error);
      return this.getFallbackSuggestions(glucoseReadings, meals, exercises);
    }
  }

  private categorizeSuggestion(suggestion: string): 'glucose' | 'meal' | 'exercise' | 'general' {
    const text = suggestion.toLowerCase();
    if (text.includes('glucose') || text.includes('blood sugar') || text.includes('reading')) {
      return 'glucose';
    } else if (text.includes('meal') || text.includes('eat') || text.includes('food') || text.includes('carb')) {
      return 'meal';
    } else if (text.includes('exercise') || text.includes('walk') || text.includes('activity')) {
      return 'exercise';
    }
    return 'general';
  }

  private getFallbackSuggestions(
    glucoseReadings: GlucoseReading[],
    meals: MealLog[],
    exercises: ExerciseLog[]
  ): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    // Filter recent data (last 24 hours)
    const recentReadings = glucoseReadings.filter(r => 
      new Date(r.timestamp).getTime() > oneDayAgo
    );
    const recentMeals = meals.filter(m => 
      new Date(m.timestamp).getTime() > oneDayAgo
    );
    const recentExercises = exercises.filter(e => 
      new Date(e.timestamp).getTime() > oneDayAgo
    );

    // Analyze glucose patterns
    const avgGlucose = recentReadings.length > 0 
      ? recentReadings.reduce((sum, r) => sum + r.value, 0) / recentReadings.length 
      : 100;
    const highReadings = recentReadings.filter(r => r.value > 140).length;
    const lowReadings = recentReadings.filter(r => r.value < 70).length;

    // High glucose pattern detected
    if (highReadings > recentReadings.length * 0.3 && recentReadings.length > 3) {
      suggestions.push({
        text: 'Try a 15-minute walk after meals to help manage levels',
        level: 'high',
        category: 'exercise'
      });
    }

    // Low activity pattern
    if (recentExercises.length === 0 && suggestions.length < 3) {
      suggestions.push({
        text: 'Add gentle movement like stretching or walking today',
        level: 'medium',
        category: 'exercise'
      });
    }

    // Meal frequency analysis
    if (recentMeals.length < 2 && suggestions.length < 3) {
      suggestions.push({
        text: 'Consider consistent meal timing for steady levels',
        level: 'medium',
        category: 'meal'
      });
    }

    // Average glucose is high
    if (avgGlucose > 150 && suggestions.length < 3) {
      suggestions.push({
        text: 'Focus on portion control and fiber-rich foods',
        level: 'high',
        category: 'meal'
      });
    }

    // Good glucose control encouragement
    if (avgGlucose >= 80 && avgGlucose <= 130 && lowReadings === 0 && suggestions.length < 3) {
      suggestions.push({
        text: 'Your levels are looking steady - keep up the great work!',
        level: 'low',
        category: 'general'
      });
    }

    // Default wellness suggestions if no specific patterns found
    const defaultSuggestions = [
      {
        text: 'Stay hydrated with water throughout the day',
        level: 'low',
        category: 'general'
      },
      {
        text: 'Consider logging your next meal for better tracking',
        level: 'low',
        category: 'meal'
      },
      {
        text: 'Take a few deep breaths - stress affects glucose too',
        level: 'low',
        category: 'general'
      }
    ];

    // Fill remaining slots with default suggestions
    while (suggestions.length < 3) {
      const remainingDefaults = defaultSuggestions.filter(def => 
        !suggestions.some(s => s.text === def.text)
      );
      if (remainingDefaults.length > 0) {
        suggestions.push(remainingDefaults[0]);
      } else {
        break;
      }
    }

    return suggestions.slice(0, 3);
  }

}

export const getSuggestions = async (
  glucoseReadings: GlucoseReading[],
  meals: MealLog[],
  exercises: ExerciseLog[]
): Promise<Suggestion[]> => {
  const engine = new AISuggestionEngine();
  return engine.getSuggestions(glucoseReadings, meals, exercises);
};

// Keep the old class name for backwards compatibility
export const RuleBasedSuggestionEngine = AISuggestionEngine;
