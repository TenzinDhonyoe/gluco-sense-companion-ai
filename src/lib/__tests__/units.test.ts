import { describe, it, expect } from 'vitest';
import {
  mgdlToMmolL,
  mmolLToMgdl,
  convertGlucoseValue,
  formatGlucoseValue,
  getTargetRanges,
  type GlucoseUnit
} from '../units';

describe('Units Conversion', () => {
  describe('mgdlToMmolL', () => {
    it('converts mg/dL to mmol/L correctly', () => {
      expect(mgdlToMmolL(90)).toBe(5.0);
      expect(mgdlToMmolL(126)).toBe(7.0);
      expect(mgdlToMmolL(180)).toBe(10.0);
      expect(mgdlToMmolL(72)).toBe(4.0);
    });

    it('handles decimal results', () => {
      expect(mgdlToMmolL(100)).toBe(5.6); // 100/18 = 5.555... ≈ 5.6
      expect(mgdlToMmolL(140)).toBe(7.8); // 140/18 = 7.777... ≈ 7.8
    });

    it('handles edge cases', () => {
      expect(mgdlToMmolL(0)).toBe(0.0);
      expect(mgdlToMmolL(18)).toBe(1.0);
    });
  });

  describe('mmolLToMgdl', () => {
    it('converts mmol/L to mg/dL correctly', () => {
      expect(mmolLToMgdl(5.0)).toBe(90);
      expect(mmolLToMgdl(7.0)).toBe(126);
      expect(mmolLToMgdl(10.0)).toBe(180);
      expect(mmolLToMgdl(4.0)).toBe(72);
    });

    it('handles decimal inputs', () => {
      expect(mmolLToMgdl(5.6)).toBe(101); // 5.6 * 18 = 100.8 ≈ 101
      expect(mmolLToMgdl(7.8)).toBe(140); // 7.8 * 18 = 140.4 ≈ 140
    });

    it('handles edge cases', () => {
      expect(mmolLToMgdl(0)).toBe(0);
      expect(mmolLToMgdl(1.0)).toBe(18);
    });
  });

  describe('convertGlucoseValue', () => {
    it('converts between units correctly', () => {
      expect(convertGlucoseValue(90, 'mg/dL', 'mmol/L')).toBe(5.0);
      expect(convertGlucoseValue(5.0, 'mmol/L', 'mg/dL')).toBe(90);
    });

    it('returns same value when units are the same', () => {
      expect(convertGlucoseValue(100, 'mg/dL', 'mg/dL')).toBe(100);
      expect(convertGlucoseValue(5.5, 'mmol/L', 'mmol/L')).toBe(5.5);
    });
  });

  describe('formatGlucoseValue', () => {
    it('formats mg/dL values correctly', () => {
      expect(formatGlucoseValue(100, 'mg/dL')).toBe('100 mg/dL');
      expect(formatGlucoseValue(85, 'mg/dL')).toBe('85 mg/dL');
    });

    it('formats mmol/L values correctly with decimal', () => {
      expect(formatGlucoseValue(100, 'mmol/L')).toBe('5.6 mmol/L');
      expect(formatGlucoseValue(90, 'mmol/L')).toBe('5.0 mmol/L');
    });
  });

  describe('getTargetRanges', () => {
    it('returns correct ranges for mg/dL', () => {
      const ranges = getTargetRanges('mg/dL');
      expect(ranges).toEqual({
        low: 70,
        normal: 130,
        high: 160,
        critical: 200
      });
    });

    it('returns correct ranges for mmol/L', () => {
      const ranges = getTargetRanges('mmol/L');
      expect(ranges).toEqual({
        low: 3.9,      // 70 mg/dL
        normal: 7.2,   // 130 mg/dL
        high: 8.9,     // 160 mg/dL
        critical: 11.1 // 200 mg/dL
      });
    });
  });

  describe('Bidirectional conversion accuracy', () => {
    it('maintains accuracy through round-trip conversions', () => {
      const originalMgdl = 120;
      const mmolL = mgdlToMmolL(originalMgdl);
      const backToMgdl = mmolLToMgdl(mmolL);
      
      // Allow for small rounding differences
      expect(Math.abs(backToMgdl - originalMgdl)).toBeLessThanOrEqual(1);
    });

    it('handles typical glucose values accurately', () => {
      const testValues = [70, 100, 126, 140, 180, 200];
      
      testValues.forEach(mgdl => {
        const mmol = mgdlToMmolL(mgdl);
        const backToMgdl = mmolLToMgdl(mmol);
        expect(Math.abs(backToMgdl - mgdl)).toBeLessThanOrEqual(1);
      });
    });
  });
});