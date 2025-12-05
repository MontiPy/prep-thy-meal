import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage "smart" numeric input behavior.
 * Allows seamless typing of decimals, clearing fields, and syncing with external state.
 * 
 * @param {number|string} value - The external numeric value
 * @param {function} onChange - Callback (newValue: number) => void
 * @returns {object} Props to spread onto the input component { value, onChange, onBlur, onFocus }
 */
export const useSmartNumberInput = ({ value, onChange }) => {
  // Internal string state to allow "invalid" intermediate states (e.g., "0.", "", "1.0")
  const [displayValue, setDisplayValue] = useState(value?.toString() ?? '');
  const [isFocused, setIsFocused] = useState(false);

  // Sync internal state with external value when NOT focused
  // This ensures that if the value changes from another source (e.g. slider, undo/redo), the input updates.
  useEffect(() => {
    if (!isFocused) {
      // Handle null/undefined gracefully
      setDisplayValue(value === null || value === undefined ? '' : value.toString());
    }
  }, [value, isFocused]);

  const handleChange = useCallback((e) => {
    const val = e.target.value;
    setDisplayValue(val);

    // Allow empty string (clearing the field)
    if (val === '') {
      onChange(0); // or null, depending on requirement. Defaulting to 0 for this app's logic.
      return;
    }

    // Only trigger parent update if it's a valid number
    // We allow trailing decimals ("1.") and leading zeros ("05") in display, but parse them for the parent
    const num = parseFloat(val);
    if (!isNaN(num)) {
      onChange(num);
    }
  }, [onChange]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    // On blur, snap to the canonical string representation of the value
    // This cleans up artifacts like "1.000" or "0." -> "0"
    setDisplayValue(value === null || value === undefined ? '' : value.toString());
  }, [value]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  return {
    value: displayValue,
    onChange: handleChange,
    onBlur: handleBlur,
    onFocus: handleFocus,
  };
};
