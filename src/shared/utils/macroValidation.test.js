/**
 * Tests for macro validation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateProtein,
  validateFatByBodyweight,
  validateFatByPercentage,
  validateCarbs,
  validateCalories,
  validateAllMacros,
} from './macroValidation';
import { SEVERITY } from '../constants/macroValidation';

describe('Protein Validation', () => {
  it('should return success for optimal protein (1.0 g/lb)', () => {
    const result = validateProtein(180, 180, 'moderate');
    expect(result.severity).toBe(SEVERITY.SUCCESS);
    expect(result.isInRange).toBe(true);
    expect(result.gramsPerPound).toBe(1.0);
  });

  it('should return warning for low protein (0.5 g/lb)', () => {
    const result = validateProtein(90, 180, 'moderate');
    expect(result.severity).toBe(SEVERITY.WARNING);
    expect(result.isInRange).toBe(false);
    expect(result.gramsPerPound).toBeCloseTo(0.5);
  });

  it('should return critical for very low protein (0.3 g/lb)', () => {
    const result = validateProtein(54, 180, 'moderate');
    expect(result.severity).toBe(SEVERITY.CRITICAL);
    expect(result.isInRange).toBe(false);
  });

  it('should return warning for high protein (1.6 g/lb)', () => {
    const result = validateProtein(288, 180, 'moderate');
    expect(result.severity).toBe(SEVERITY.WARNING);
    expect(result.isInRange).toBe(false);
    expect(result.gramsPerPound).toBeCloseTo(1.6);
  });

  it('should return critical for very high protein (2.2 g/lb)', () => {
    const result = validateProtein(396, 180, 'moderate');
    expect(result.severity).toBe(SEVERITY.CRITICAL);
    expect(result.isInRange).toBe(false);
  });

  it('should return null for invalid inputs', () => {
    const result = validateProtein(0, 0, 'moderate');
    expect(result.severity).toBeNull();
    expect(result.isInRange).toBe(false);
  });
});

describe('Fat Validation by Bodyweight', () => {
  it('should return success for optimal fat (0.35 g/lb)', () => {
    const result = validateFatByBodyweight(63, 180);
    expect(result.severity).toBe(SEVERITY.SUCCESS);
    expect(result.isInRange).toBe(true);
    expect(result.gramsPerPound).toBeCloseTo(0.35);
  });

  it('should return warning for low fat (0.23 g/lb)', () => {
    const result = validateFatByBodyweight(41, 180);
    expect(result.severity).toBe(SEVERITY.WARNING);
    expect(result.isInRange).toBe(false);
  });

  it('should return critical for very low fat (0.15 g/lb)', () => {
    const result = validateFatByBodyweight(27, 180);
    expect(result.severity).toBe(SEVERITY.CRITICAL);
    expect(result.isInRange).toBe(false);
  });

  it('should return warning for high fat (0.8 g/lb)', () => {
    const result = validateFatByBodyweight(144, 180);
    expect(result.severity).toBe(SEVERITY.WARNING);
    expect(result.isInRange).toBe(false);
  });

  it('should return critical for very high fat (1.2 g/lb)', () => {
    const result = validateFatByBodyweight(216, 180);
    expect(result.severity).toBe(SEVERITY.CRITICAL);
    expect(result.isInRange).toBe(false);
  });
});

describe('Fat Validation by Percentage', () => {
  const totalCalories = 2000;

  it('should return success for optimal fat percentage (25%)', () => {
    const fatGrams = (totalCalories * 0.25) / 9; // ~55g
    const result = validateFatByPercentage(fatGrams, totalCalories);
    expect(result.severity).toBe(SEVERITY.SUCCESS);
    expect(result.isInRange).toBe(true);
    expect(result.percentage).toBeCloseTo(25, 0);
  });

  it('should return warning for low fat percentage (12%)', () => {
    const fatGrams = (totalCalories * 0.12) / 9; // ~27g
    const result = validateFatByPercentage(fatGrams, totalCalories);
    expect(result.severity).toBe(SEVERITY.WARNING);
    expect(result.isInRange).toBe(false);
  });

  it('should return critical for very low fat percentage (8%)', () => {
    const fatGrams = (totalCalories * 0.08) / 9; // ~18g
    const result = validateFatByPercentage(fatGrams, totalCalories);
    expect(result.severity).toBe(SEVERITY.CRITICAL);
    expect(result.isInRange).toBe(false);
  });

  it('should return warning for high fat percentage (50%)', () => {
    const fatGrams = (totalCalories * 0.50) / 9; // ~111g
    const result = validateFatByPercentage(fatGrams, totalCalories);
    expect(result.severity).toBe(SEVERITY.WARNING);
    expect(result.isInRange).toBe(false);
  });

  it('should return critical for very high fat percentage (75%)', () => {
    const fatGrams = (totalCalories * 0.75) / 9; // ~167g
    const result = validateFatByPercentage(fatGrams, totalCalories);
    expect(result.severity).toBe(SEVERITY.CRITICAL);
    expect(result.isInRange).toBe(false);
  });
});

describe('Carb Validation', () => {
  it('should return success for normal carbs (150g)', () => {
    const result = validateCarbs(150, 2000);
    expect(result.severity).toBe(SEVERITY.SUCCESS);
    expect(result.isKeto).toBe(false);
    expect(result.isLowCarb).toBe(false);
  });

  it('should return info for ketogenic carbs (30g)', () => {
    const result = validateCarbs(30, 2000);
    expect(result.severity).toBe(SEVERITY.INFO);
    expect(result.isKeto).toBe(true);
    expect(result.isLowCarb).toBe(true);
  });

  it('should return info for low-carb (75g)', () => {
    const result = validateCarbs(75, 2000);
    expect(result.severity).toBe(SEVERITY.INFO);
    expect(result.isKeto).toBe(false);
    expect(result.isLowCarb).toBe(true);
  });

  it('should return critical for negative carbs', () => {
    const result = validateCarbs(-50, 2000);
    expect(result.severity).toBe(SEVERITY.CRITICAL);
    expect(result.isKeto).toBe(false);
    expect(result.isLowCarb).toBe(false);
  });
});

describe('Calorie Validation', () => {
  it('should return success for normal calories (2000)', () => {
    const result = validateCalories(2000);
    expect(result.severity).toBe(SEVERITY.SUCCESS);
    expect(result.isInRange).toBe(true);
  });

  it('should return info for low calories (1000)', () => {
    const result = validateCalories(1000);
    expect(result.severity).toBe(SEVERITY.INFO);
    expect(result.isInRange).toBe(true);
  });

  it('should return warning for very low calories (700)', () => {
    const result = validateCalories(700);
    expect(result.severity).toBe(SEVERITY.WARNING);
    expect(result.isInRange).toBe(false);
  });

  it('should return critical for extremely low calories (400)', () => {
    const result = validateCalories(400);
    expect(result.severity).toBe(SEVERITY.CRITICAL);
    expect(result.isInRange).toBe(false);
  });

  it('should return info for high calories (4000)', () => {
    const result = validateCalories(4000);
    expect(result.severity).toBe(SEVERITY.INFO);
    expect(result.isInRange).toBe(true);
  });

  it('should return warning for very high calories (6000)', () => {
    const result = validateCalories(6000);
    expect(result.severity).toBe(SEVERITY.WARNING);
    expect(result.isInRange).toBe(false);
  });
});

describe('Validate All Macros', () => {
  it('should validate all macros for optimal balanced diet', () => {
    const result = validateAllMacros({
      proteinGrams: 180, // 1.0 g/lb
      fatGrams: 67, // ~30% of 2000 cal
      carbGrams: 200,
      totalCalories: 2000,
      bodyweightLbs: 180,
      activityLevel: 'moderate',
    });

    expect(result.protein.severity).toBe(SEVERITY.SUCCESS);
    expect(result.fat.severity).toBe(SEVERITY.SUCCESS);
    expect(result.carbs.severity).toBe(SEVERITY.SUCCESS);
    expect(result.calories.severity).toBe(SEVERITY.SUCCESS);
    expect(result.hasWarnings).toBe(false);
    expect(result.hasCritical).toBe(false);
  });

  it('should detect low protein warning', () => {
    const result = validateAllMacros({
      proteinGrams: 90, // 0.5 g/lb - too low
      fatGrams: 67,
      carbGrams: 250,
      totalCalories: 2000,
      bodyweightLbs: 180,
      activityLevel: 'moderate',
    });

    expect(result.protein.severity).toBe(SEVERITY.WARNING);
    expect(result.hasWarnings).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should detect low fat warning issue', () => {
    const result = validateAllMacros({
      proteinGrams: 180,
      fatGrams: 25, // ~11% of 2000 cal - low but not critical
      carbGrams: 250,
      totalCalories: 2000,
      bodyweightLbs: 180,
      activityLevel: 'moderate',
    });

    expect(result.fat.severity).toBe(SEVERITY.WARNING);
    expect(result.hasWarnings).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should detect critically low fat', () => {
    const result = validateAllMacros({
      proteinGrams: 180,
      fatGrams: 18, // ~8% of 2000 cal - critical
      carbGrams: 250,
      totalCalories: 2000,
      bodyweightLbs: 180,
      activityLevel: 'moderate',
    });

    expect(result.fat.severity).toBe(SEVERITY.CRITICAL);
    expect(result.hasCritical).toBe(true);
    expect(result.criticals.length).toBeGreaterThan(0);
  });

  it('should detect ketogenic diet (info)', () => {
    const result = validateAllMacros({
      proteinGrams: 150,
      fatGrams: 155, // ~70% of 2000 cal
      carbGrams: 25, // Ketogenic
      totalCalories: 2000,
      bodyweightLbs: 180,
      activityLevel: 'moderate',
    });

    expect(result.carbs.isKeto).toBe(true);
    expect(result.carbs.severity).toBe(SEVERITY.INFO);
  });

  it('should handle invalid bodyweight gracefully', () => {
    const result = validateAllMacros({
      proteinGrams: 180,
      fatGrams: 67,
      carbGrams: 200,
      totalCalories: 2000,
      bodyweightLbs: 0, // Invalid
      activityLevel: 'moderate',
    });

    expect(result.protein.severity).toBeNull();
    expect(result.fat.bodyweightValidation.severity).toBeNull();
  });
});
