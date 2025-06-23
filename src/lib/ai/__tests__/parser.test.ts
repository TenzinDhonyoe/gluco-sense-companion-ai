
import { parseMealInput, parseExerciseInput } from '../parser';

describe('Rule-Based Parser', () => {
  describe('Meal Parser', () => {
    test('parses simple meal input', () => {
      const result = parseMealInput('I had an apple');
      expect(result.description).toBe('I had an apple');
      expect(result.estimatedCalories).toBe(80);
      expect(result.estimatedCarbs).toBe(21);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('handles quantities', () => {
      const result = parseMealInput('2 slices of pizza');
      expect(result.estimatedCalories).toBe(600);
      expect(result.estimatedCarbs).toBe(70);
    });

    test('determines meal type from keywords', () => {
      const breakfast = parseMealInput('breakfast oatmeal');
      expect(breakfast.mealType).toBe('breakfast');
      
      const snack = parseMealInput('quick snack nuts');
      expect(snack.mealType).toBe('snack');
    });

    test('handles unknown foods with fallback', () => {
      const result = parseMealInput('some exotic dish');
      expect(result.estimatedCalories).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('Exercise Parser', () => {
    test('parses simple exercise input', () => {
      const result = parseExerciseInput('went for a run');
      expect(result.description).toBe('went for a run');
      expect(result.exerciseType).toBe('cardio');
      expect(result.intensity).toBe('high');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('extracts duration from text', () => {
      const result = parseExerciseInput('30 min walk');
      expect(result.estimatedDuration).toBe(30);
      expect(result.exerciseType).toBe('cardio');
    });

    test('handles hour format', () => {
      const result = parseExerciseInput('1 hour bike ride');
      expect(result.estimatedDuration).toBe(60);
    });

    test('determines intensity from keywords', () => {
      const light = parseExerciseInput('light yoga session');
      expect(light.intensity).toBe('low');
      
      const intense = parseExerciseInput('intense workout');
      expect(intense.intensity).toBe('high');
    });

    test('handles unknown exercises with fallback', () => {
      const result = parseExerciseInput('did some activity');
      expect(result.estimatedDuration).toBe(20);
      expect(result.confidence).toBeLessThan(0.5);
    });
  });
});
