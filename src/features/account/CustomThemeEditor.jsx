import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { useAppTheme } from '../../shared/context/ThemeContext';
import { FONT_PAIRS } from '../../shared/context/themes';

const colorPickerSx = {
  width: 48,
  height: 48,
  border: 'none',
  cursor: 'pointer',
  borderRadius: '8px',
  padding: 0,
};

const CustomThemeEditor = () => {
  const { customConfig, setCustomConfig } = useAppTheme();

  const update = (key, value) => {
    setCustomConfig({ ...customConfig, [key]: value });
  };

  return (
    <Stack spacing={3} sx={{ mt: 2 }}>
      {/* Color pickers */}
      <Stack direction="row" spacing={4}>
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Primary
          </Typography>
          <input
            type="color"
            value={customConfig.primaryColor}
            onChange={(e) => update('primaryColor', e.target.value)}
            style={colorPickerSx}
          />
        </Box>
        <Box>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
            Accent
          </Typography>
          <input
            type="color"
            value={customConfig.accentColor}
            onChange={(e) => update('accentColor', e.target.value)}
            style={colorPickerSx}
          />
        </Box>
      </Stack>

      {/* Font pair dropdown */}
      <FormControl fullWidth size="small">
        <InputLabel id="font-pair-label">Font Pair</InputLabel>
        <Select
          labelId="font-pair-label"
          label="Font Pair"
          value={customConfig.fontPair}
          onChange={(e) => update('fontPair', e.target.value)}
        >
          {Object.entries(FONT_PAIRS).map(([key, pair]) => (
            <MenuItem key={key} value={key}>
              {pair.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Border radius slider */}
      <Box>
        <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
          Border Radius: {customConfig.borderRadius}px
        </Typography>
        <Slider
          value={customConfig.borderRadius}
          onChange={(_, val) => update('borderRadius', val)}
          min={0}
          max={24}
          step={2}
          valueLabelDisplay="auto"
        />
      </Box>

      {/* Glow style toggle */}
      <Box>
        <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
          Glow Style
        </Typography>
        <ToggleButtonGroup
          value={customConfig.glowStyle}
          exclusive
          onChange={(_, val) => {
            if (val !== null) update('glowStyle', val);
          }}
          sx={{
            '& .MuiToggleButton-root': {
              minHeight: { xs: 44, sm: 'auto' },
              minWidth: { xs: 44, sm: 'auto' },
            },
          }}
        >
          <ToggleButton value="none">None</ToggleButton>
          <ToggleButton value="soft">Soft</ToggleButton>
          <ToggleButton value="neon">Neon</ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Stack>
  );
};

export default CustomThemeEditor;
