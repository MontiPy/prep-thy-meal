import React from 'react';
import { TextField } from '@mui/material';
import { useSmartNumberInput } from '../../hooks/useSmartNumberInput';

/**
 * A MUI TextField wrapper that handles numeric input weirdness.
 * Allows typing decimals ("0.5") and clearing fields without them snapping back.
 */
const SmartTextField = ({ value, onChange, ...props }) => {
  const inputProps = useSmartNumberInput({ value, onChange });

  return (
    <TextField
      {...props}
      // Override value and handlers with our smart logic
      value={inputProps.value}
      onChange={inputProps.onChange}
      onBlur={(e) => {
        inputProps.onBlur();
        if (props.onBlur) props.onBlur(e);
      }}
      onFocus={(e) => {
        inputProps.onFocus();
        if (props.onFocus) props.onFocus(e);
      }}
      // Force type="number" behavior for mobile keyboards, but strict validation is handled by hook
      type="number"
    />
  );
};

export default SmartTextField;
