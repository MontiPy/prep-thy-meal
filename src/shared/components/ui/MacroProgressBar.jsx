import React from 'react';
import { Box, LinearProgress, Typography, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// Tokyo Nights macro colors
const MACRO_THEME_COLORS = {
  calories: '#ffb020',
  protein: '#00e5ff',
  carbs: '#ff2d78',
  fat: '#a855f7',
};

const MacroProgressBar = ({
  label,
  actual,
  target,
  unit = 'g',
  showPercentage = true,
  showDelta = true,
  size = 'small',
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const delta = actual - target;
  const percentage = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
  const isOver = delta > 0;
  const isUnder = delta < 0;
  const tolerance = unit === 'kcal' ? 50 : 5;
  const withinRange = Math.abs(delta) <= tolerance;

  let color = 'success';
  if (isOver) {
    color = 'error';
  } else if (isUnder && !withinRange) {
    color = 'warning';
  } else if (withinRange) {
    color = 'success';
  }

  const displayPercentage = Math.min(100, percentage);
  const overPercentage = isOver ? Math.min(20, ((actual - target) / target) * 100) : 0;

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
        <Typography variant={size === 'small' ? 'caption' : 'body2'} color="text.secondary">
          {label}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
          <Typography
            variant={size === 'small' ? 'caption' : 'body2'}
            fontWeight={700}
            color={color === 'success' ? 'success.main' : color === 'warning' ? 'warning.main' : 'error.main'}
            sx={{ transition: 'color 0.3s ease', whiteSpace: 'nowrap' }}
          >
            {actual.toFixed(unit === 'kcal' ? 0 : 1)} / {target.toFixed(unit === 'kcal' ? 0 : 1)} {unit}
          </Typography>
          {showDelta && (
            <Typography
              variant="caption"
              color={color === 'success' ? 'success.main' : color === 'warning' ? 'warning.main' : 'error.main'}
              fontWeight={600}
              sx={{ transition: 'color 0.3s ease', whiteSpace: 'nowrap' }}
            >
              {delta >= 0 ? '+' : ''}{delta.toFixed(unit === 'kcal' ? 0 : 1)}
            </Typography>
          )}
          {showPercentage && (
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              ({percentage.toFixed(0)}%)
            </Typography>
          )}
        </Box>
      </Box>
      <Tooltip title={`${actual.toFixed(1)} ${unit} of ${target.toFixed(1)} ${unit} target`}>
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          <LinearProgress
            variant="determinate"
            value={displayPercentage}
            color={color}
            sx={{
              height: size === 'small' ? 6 : 8,
              borderRadius: 1,
              bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 1,
                transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isDark && displayPercentage > 10
                  ? `0 0 8px ${theme.palette[color].main}40`
                  : 'none',
              },
              ...(isDark && withinRange && !isOver && {
                animation: 'successGlow 2s ease-in-out infinite',
                '@keyframes successGlow': {
                  '0%, 100%': { boxShadow: '0 0 4px rgba(57,255,127,0.3)' },
                  '50%': { boxShadow: '0 0 12px rgba(57,255,127,0.5)' },
                },
              }),
              ...(isDark && isOver && {
                animation: 'overGlow 1.5s ease-in-out infinite',
                '@keyframes overGlow': {
                  '0%, 100%': { boxShadow: '0 0 4px rgba(255,71,87,0.3)' },
                  '50%': { boxShadow: '0 0 12px rgba(255,71,87,0.5)' },
                },
              }),
            }}
          />
          {isOver && overPercentage > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: '100%',
                width: `${Math.min(20, overPercentage)}%`,
                height: size === 'small' ? 6 : 8,
                bgcolor: 'error.main',
                borderRadius: 1,
                opacity: 0.7,
                boxShadow: isDark ? '0 0 8px rgba(255,71,87,0.4)' : 'none',
              }}
            />
          )}
        </Box>
      </Tooltip>
    </Box>
  );
};

export const MacroCircularProgress = ({
  label,
  actual,
  target,
  unit = 'g',
  size = 60,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const delta = actual - target;
  const percentage = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
  const isOver = delta > 0;
  const tolerance = unit === 'kcal' ? 50 : 5;
  const withinRange = Math.abs(delta) <= tolerance;

  let color = 'success';
  if (isOver) {
    color = 'error';
  } else if (!withinRange) {
    color = 'warning';
  }

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="caption" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `4px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
          borderTopColor: theme.palette[color].main,
          borderRightColor: percentage > 25 ? theme.palette[color].main : 'transparent',
          borderBottomColor: percentage > 50 ? theme.palette[color].main : 'transparent',
          borderLeftColor: percentage > 75 ? theme.palette[color].main : 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 0.5,
          transition: 'border-color 0.3s',
          boxShadow: isDark ? `0 0 8px ${theme.palette[color].main}30` : 'none',
        }}
      >
        <Typography variant="caption" fontWeight={700}>
          {percentage.toFixed(0)}%
        </Typography>
      </Box>
      <Typography variant="caption" color="text.secondary">
        {actual.toFixed(0)}/{target.toFixed(0)}
      </Typography>
    </Box>
  );
};

export default MacroProgressBar;
