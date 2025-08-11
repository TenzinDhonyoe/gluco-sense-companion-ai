import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateStabilityScore,
  getDailyStabilityScore,
  getWeeklyStabilityScore,
  type GlucoseReading,
  type MealLog,
  type StabilityScore
} from '../stabilityScore';

describe('Stability Score Calculation', () => {
  let glucoseReadings: GlucoseReading[];
  let meals: MealLog[];

  beforeEach(() => {
    // Create sample data for testing
    const now = Date.now();
    
    glucoseReadings = [
      // Baseline readings - steady pattern
      { value: 85, timestamp: now - 6 * 60 * 60 * 1000 }, // 6 hours ago
      { value: 90, timestamp: now - 5 * 60 * 60 * 1000 }, // 5 hours ago
      { value: 95, timestamp: now - 4 * 60 * 60 * 1000 }, // 4 hours ago
      { value: 88, timestamp: now - 3 * 60 * 60 * 1000 }, // 3 hours ago
      { value: 92, timestamp: now - 2 * 60 * 60 * 1000 }, // 2 hours ago
      { value: 89, timestamp: now - 1 * 60 * 60 * 1000 }, // 1 hour ago
      { value: 91, timestamp: now }, // now
    ];

    meals = [
      { timestamp: now - 4 * 60 * 60 * 1000 }, // 4 hours ago
      { timestamp: now - 8 * 60 * 60 * 1000 }, // 8 hours ago (breakfast)
    ];
  });

  describe('calculateStabilityScore', () => {
    it('calculates stability score for steady glucose patterns', () => {
      const score = calculateStabilityScore(glucoseReadings, meals);
      
      expect(score).toBeDefined();
      expect(score.value).toBeGreaterThanOrEqual(0);
      expect(score.value).toBeLessThanOrEqual(100);
      expect(score.label).toBeDefined();
      expect(score.components).toBeDefined();
    });

    it('returns higher scores for stable glucose patterns', () => {
      const steadyReadings = Array.from({ length: 10 }, (_, i) => ({
        value: 90 + Math.random() * 4, // Very tight range
        timestamp: Date.now() - i * 30 * 60 * 1000
      }));

      const variableReadings = Array.from({ length: 10 }, (_, i) => ({
        value: 70 + Math.random() * 60, // Wide range
        timestamp: Date.now() - i * 30 * 60 * 1000
      }));

      const steadyScore = calculateStabilityScore(steadyReadings, meals);
      const variableScore = calculateStabilityScore(variableReadings, meals);

      expect(steadyScore.value).toBeGreaterThan(variableScore.value);
    });

    it('handles empty data gracefully', () => {
      const score = calculateStabilityScore([], []);
      
      expect(score).toBeDefined();
      expect(score.value).toBeGreaterThanOrEqual(0);
      expect(score.value).toBeLessThanOrEqual(100);
    });

    it('assigns correct labels based on score ranges', () => {
      // Mock high stability scenario
      const highStabilityReadings = Array.from({ length: 20 }, (_, i) => ({
        value: 88 + Math.random() * 4,
        timestamp: Date.now() - i * 15 * 60 * 1000
      }));

      const score = calculateStabilityScore(highStabilityReadings, []);
      
      if (score.value >= 80) {
        expect(score.label).toBe('Very steady');
      } else if (score.value >= 60) {
        expect(score.label).toBe('Mostly steady');
      } else if (score.value >= 40) {
        expect(score.label).toBe('Some ups & downs');
      } else {
        expect(score.label).toBe('Wide swings');
      }
    });

    it('calculates post-meal excursions correctly', () => {
      const mealTime = Date.now() - 2 * 60 * 60 * 1000;
      const testReadings = [
        { value: 85, timestamp: mealTime - 15 * 60 * 1000 }, // Before meal
        { value: 88, timestamp: mealTime + 15 * 60 * 1000 }, // 15 min after
        { value: 145, timestamp: mealTime + 60 * 60 * 1000 }, // 1 hour after (peak)
        { value: 110, timestamp: mealTime + 90 * 60 * 1000 }, // 1.5 hours after
      ];
      const testMeals = [{ timestamp: mealTime }];

      const score = calculateStabilityScore(testReadings, testMeals);
      
      expect(score.components.postMealExcursion).toBeGreaterThan(0);
      expect(score.components.postMealExcursion).toBeLessThan(100); // Reasonable excursion
    });

    it('handles overnight vs daytime variability separately', () => {
      const now = new Date();
      now.setHours(12, 0, 0, 0); // Set to noon
      const noonTime = now.getTime();

      const mixedReadings = [
        // Daytime readings (should be more variable)
        { value: 90, timestamp: noonTime - 2 * 60 * 60 * 1000 }, // 10 AM
        { value: 130, timestamp: noonTime - 1 * 60 * 60 * 1000 }, // 11 AM
        { value: 85, timestamp: noonTime }, // 12 PM
        
        // Overnight readings (should be more stable)
        { value: 88, timestamp: noonTime - 22 * 60 * 60 * 1000 }, // 2 AM
        { value: 86, timestamp: noonTime - 20 * 60 * 60 * 1000 }, // 4 AM
        { value: 87, timestamp: noonTime - 18 * 60 * 60 * 1000 }, // 6 AM
      ];

      const score = calculateStabilityScore(mixedReadings, []);
      
      expect(score.components.dayVar).toBeGreaterThan(0);
      expect(score.components.overnightVar).toBeGreaterThanOrEqual(0);
    });

    it('penalizes late meals correctly', () => {
      const now = Date.now();
      const lateMeals = [
        { timestamp: now - 2 * 60 * 60 * 1000 }, // 2 hours ago
        { timestamp: now - 4 * 60 * 60 * 1000 }, // 4 hours ago
      ];

      // Set one meal to be after 9 PM (21:00)
      const lateTime = new Date();
      lateTime.setHours(22, 0, 0, 0); // 10 PM
      lateMeals[0].timestamp = lateTime.getTime();

      const earlyTime = new Date();
      earlyTime.setHours(18, 0, 0, 0); // 6 PM
      lateMeals[1].timestamp = earlyTime.getTime();

      const score = calculateStabilityScore(glucoseReadings, lateMeals);
      
      expect(score.components.lateMealRate).toBeGreaterThan(0);
      expect(score.components.lateMealRate).toBeLessThanOrEqual(100);
    });
  });

  describe('getDailyStabilityScore', () => {
    it('calculates daily score for specific date', () => {
      const today = new Date();
      const score = getDailyStabilityScore(glucoseReadings, meals, today);
      
      expect(score).toBeDefined();
      expect(score.value).toBeGreaterThanOrEqual(0);
      expect(score.value).toBeLessThanOrEqual(100);
    });

    it('filters data to specific day correctly', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Create readings only for yesterday
      const yesterdayReadings = [
        { value: 85, timestamp: yesterday.setHours(10, 0, 0, 0) },
        { value: 120, timestamp: yesterday.setHours(14, 0, 0, 0) },
        { value: 95, timestamp: yesterday.setHours(18, 0, 0, 0) },
      ];

      const score = getDailyStabilityScore(yesterdayReadings, [], yesterday);
      
      // Should have data for yesterday
      expect(score.components.dayVar).toBeGreaterThan(0);
    });
  });

  describe('getWeeklyStabilityScore', () => {
    it('calculates weekly score correctly', () => {
      const score = getWeeklyStabilityScore(glucoseReadings, meals);
      
      expect(score).toBeDefined();
      expect(score.value).toBeGreaterThanOrEqual(0);
      expect(score.value).toBeLessThanOrEqual(100);
    });

    it('uses data from last 7 days', () => {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Create readings spanning more than a week
      const extendedReadings = [
        ...glucoseReadings,
        // Add readings from 10 days ago (should be excluded)
        { value: 200, timestamp: now.getTime() - 10 * 24 * 60 * 60 * 1000 },
        { value: 50, timestamp: now.getTime() - 9 * 24 * 60 * 60 * 1000 },
      ];

      const weeklyScore = getWeeklyStabilityScore(extendedReadings, meals);
      
      // The extreme old values shouldn't significantly affect the weekly score
      expect(weeklyScore.value).toBeGreaterThan(20); // Reasonable score despite extreme old values
    });
  });

  describe('Edge cases', () => {
    it('handles single reading', () => {
      const singleReading = [{ value: 90, timestamp: Date.now() }];
      const score = calculateStabilityScore(singleReading, []);
      
      expect(score).toBeDefined();
      expect(score.value).toBeGreaterThanOrEqual(0);
      expect(score.value).toBeLessThanOrEqual(100);
    });

    it('handles meals without corresponding glucose readings', () => {
      const futureMeals = [{ timestamp: Date.now() + 60 * 60 * 1000 }]; // 1 hour future
      const score = calculateStabilityScore(glucoseReadings, futureMeals);
      
      expect(score).toBeDefined();
      expect(score.components.postMealExcursion).toBe(0);
    });

    it('clamps scores to 0-100 range', () => {
      // Test with extreme data that might produce out-of-range scores
      const extremeReadings = [
        { value: 400, timestamp: Date.now() - 60 * 60 * 1000 },
        { value: 30, timestamp: Date.now() - 30 * 60 * 1000 },
        { value: 500, timestamp: Date.now() },
      ];

      const score = calculateStabilityScore(extremeReadings, []);
      
      expect(score.value).toBeGreaterThanOrEqual(0);
      expect(score.value).toBeLessThanOrEqual(100);
    });
  });

  describe('Components validation', () => {
    it('returns all required components', () => {
      const score = calculateStabilityScore(glucoseReadings, meals);
      
      expect(score.components).toHaveProperty('postMealExcursion');
      expect(score.components).toHaveProperty('dayVar');
      expect(score.components).toHaveProperty('overnightVar');
      expect(score.components).toHaveProperty('coverage');
      expect(score.components).toHaveProperty('lateMealRate');
      
      // All components should be non-negative
      Object.values(score.components).forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0);
      });
    });

    it('calculates coverage correctly', () => {
      // Create readings for good coverage (multiple hours)
      const now = Date.now();
      const goodCoverageReadings = Array.from({ length: 16 }, (_, i) => ({
        value: 90 + Math.random() * 10,
        timestamp: now - i * 60 * 60 * 1000 // Every hour for 16 hours
      }));

      const score = calculateStabilityScore(goodCoverageReadings, []);
      
      expect(score.components.coverage).toBeGreaterThan(0);
      expect(score.components.coverage).toBeLessThanOrEqual(100);
    });
  });
});