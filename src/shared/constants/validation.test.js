// src/shared/constants/validation.test.js
import { describe, it, expect } from 'vitest';
import {
  CALORIE_LIMITS,
  MACRO_TOLERANCE,
  DEFAULT_MACROS,
  DEFAULT_CALORIE_TARGET,
  UI_LIMITS,
  getCalorieWarning,
  isValidCalorieTarget,
  isWithinMacroTargets,
} from './validation';

describe('Validation Constants', () => {
  describe('CALORIE_LIMITS', () => {
    it('should have correct limit values', () => {
      expect(CALORIE_LIMITS.MIN).toBe(500);
      expect(CALORIE_LIMITS.MAX).toBe(10000);
      expect(CALORIE_LIMITS.WARNING_LOW).toBe(800);
      expect(CALORIE_LIMITS.WARNING_HIGH).toBe(5000);
    });
  });

  describe('MACRO_TOLERANCE', () => {
    it('should have correct tolerance values', () => {
      expect(MACRO_TOLERANCE.CALORIES).toBe(25);
      expect(MACRO_TOLERANCE.PROTEIN).toBe(5);
      expect(MACRO_TOLERANCE.CARBS).toBe(5);
      expect(MACRO_TOLERANCE.FAT).toBe(5);
    });
  });

  describe('DEFAULT_MACROS', () => {
    it('should sum to 100%', () => {
      const total = DEFAULT_MACROS.PROTEIN + DEFAULT_MACROS.FAT + DEFAULT_MACROS.CARBS;
      expect(total).toBe(100);
    });
  });
});

describe('getCalorieWarning', () => {
  it('should return warning for very low calories', () => {
    const warning = getCalorieWarning(700);
    expect(warning).toContain('Very low calorie target');
  });

  it('should return caution for low calories', () => {
    const warning = getCalorieWarning(1000);
    expect(warning).toContain('Low calorie target');
  });

  it('should return empty string for normal calories', () => {
    const warning = getCalorieWarning(2000);
    expect(warning).toBe('');
  });

  it('should return info for high calories', () => {
    const warning = getCalorieWarning(4000);
    expect(warning).toContain('High calorie target');
  });

  it('should return warning for very high calories', () => {
    const warning = getCalorieWarning(6000);
    expect(warning).toContain('Very high calorie target');
  });
});

describe('isValidCalorieTarget', () => {
  it('should return false for calories below minimum', () => {
    expect(isValidCalorieTarget(400)).toBe(false);
  });

  it('should return false for calories above maximum', () => {
    expect(isValidCalorieTarget(15000)).toBe(false);
  });

  it('should return true for valid calories', () => {
    expect(isValidCalorieTarget(500)).toBe(true);
    expect(isValidCalorieTarget(2000)).toBe(true);
    expect(isValidCalorieTarget(10000)).toBe(true);
  });
});

describe('isWithinMacroTargets', () => {
  const baseTarget = {
    calories: 2000,
    protein: 150,
    carbs: 175,
    fat: 67,
  };

  it('should return true when all macros are within tolerance', () => {
    const actual = {
      calories: 2020,
      protein: 152,
      carbs: 173,
      fat: 65,
    };
    expect(isWithinMacroTargets(actual, baseTarget)).toBe(true);
  });

  it('should return false when calories are out of tolerance', () => {
    const actual = {
      calories: 2100, // 100 over, tolerance is 25
      protein: 150,
      carbs: 175,
      fat: 67,
    };
    expect(isWithinMacroTargets(actual, baseTarget)).toBe(false);
  });

  it('should return false when protein is out of tolerance', () => {
    const actual = {
      calories: 2000,
      protein: 160, // 10 over, tolerance is 5
      carbs: 175,
      fat: 67,
    };
    expect(isWithinMacroTargets(actual, baseTarget)).toBe(false);
  });

  it('should return true at exactly the tolerance boundary', () => {
    const actual = {
      calories: 2025, // exactly at tolerance
      protein: 155, // exactly at tolerance
      carbs: 180, // exactly at tolerance
      fat: 72, // exactly at tolerance
    };
    expect(isWithinMacroTargets(actual, baseTarget)).toBe(true);
  });

  it('should return false when just over tolerance', () => {
    const actual = {
      calories: 2026, // 1 over tolerance
      protein: 150,
      carbs: 175,
      fat: 67,
    };
    expect(isWithinMacroTargets(actual, baseTarget)).toBe(false);
  });
});
