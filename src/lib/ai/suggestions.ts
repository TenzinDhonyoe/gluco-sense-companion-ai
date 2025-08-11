
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
          glucoseData: glucoseData, // ALL glucose readings for pattern analysis
          logs: logs, // ALL logs for comprehensive history analysis
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
        // Convert AI suggestions to our Suggestion format
        return data.suggestions.slice(0, 3).map((suggestion: string, index: number) => ({
          text: suggestion,
          level: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
          category: this.categorizeSuggestion(suggestion)
        }));
      }

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
    // Simple fallback suggestions when AI is unavailable
    const suggestions: Suggestion[] = [];

    // Check for recent high readings
    const recentHigh = glucoseReadings.some(r => r.value > 140);
    if (recentHigh) {
      suggestions.push({
        text: 'Consider a 10-minute walk to help lower glucose levels',
        level: 'medium',
        category: 'exercise'
      });
    }

    // Check for no exercise
    if (exercises.length === 0) {
      suggestions.push({
        text: 'Try to get at least 30 minutes of activity today',
        level: 'low',
        category: 'exercise'
      });
    }

    // General healthy advice
    suggestions.push({
      text: 'Stay hydrated and monitor your glucose regularly',
      level: 'low',
      category: 'general'
    });

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
