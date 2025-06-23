
import { getSuggestions } from '../suggestions';
import { GlucoseReading, MealLog, ExerciseLog } from '../types';

// Mock data
const mockGlucoseReadings: GlucoseReading[] = [
  { id: '1', value: 160, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), tag: 'post-meal' },
  { id: '2', value: 85, timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), tag: 'fasting' },
  { id: '3', value: 65, timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), tag: 'overnight' },
];

const mockMeals: MealLog[] = [
  { id: '1', description: 'Pizza and soda', timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), calories: 600, carbs: 80 },
];

const mockExercises: ExerciseLog[] = [];

describe('Rule-Based Suggestion Engine', () => {
  test('suggests walk after high post-meal glucose', () => {
    const suggestions = getSuggestions(mockGlucoseReadings, mockMeals, mockExercises);
    expect(suggestions.some(s => s.text.includes('walk'))).toBe(true);
  });

  test('suggests exercise when none logged', () => {
    const suggestions = getSuggestions(mockGlucoseReadings, mockMeals, []);
    expect(suggestions.some(s => s.category === 'exercise')).toBe(true);
  });

  test('suggests bedtime snack for overnight lows', () => {
    const overnightLowReadings = [
      { id: '1', value: 65, timestamp: new Date().setHours(2, 0, 0, 0).toString() },
      { id: '2', value: 70, timestamp: new Date().setHours(3, 0, 0, 0).toString() },
      { id: '3', value: 68, timestamp: new Date().setHours(4, 0, 0, 0).toString() },
    ] as GlucoseReading[];
    
    const suggestions = getSuggestions(overnightLowReadings, [], []);
    expect(suggestions.some(s => s.text.includes('bedtime snack'))).toBe(true);
  });

  test('returns maximum 3 suggestions', () => {
    const suggestions = getSuggestions(mockGlucoseReadings, mockMeals, mockExercises);
    expect(suggestions.length).toBeLessThanOrEqual(3);
  });

  test('prioritizes high-level suggestions', () => {
    const suggestions = getSuggestions(mockGlucoseReadings, mockMeals, mockExercises);
    if (suggestions.length > 1) {
      expect(suggestions[0].level).not.toBe('low');
    }
  });
});
