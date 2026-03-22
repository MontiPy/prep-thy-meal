import React from 'react';
import {
  Box,
  Collapse,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

/**
 * MicronutrientDisplay
 * Shows fiber, sugar, and sodium with recommended daily intake guidelines
 */
const MicronutrientDisplay = ({ micronutrients = {}, isExpanded = false, onToggleExpand }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const fiber = micronutrients.fiber || 0;
  const sugar = micronutrients.sugar || 0;
  const sodium = micronutrients.sodium || 0;

  // Recommended daily intake guidelines (approximate)
  // Fiber: 25-35g/day, Sugar: <25-36g/day, Sodium: <2300mg/day
  const guidelines = {
    fiber: { target: 30, unit: 'g', label: 'Fiber' },
    sugar: { target: 30, unit: 'g', label: 'Sugar' }, // 6-9 tsp, ~25-36g for women/men
    sodium: { target: 2300, unit: 'mg', label: 'Sodium' },
  };

  const getProgressColor = (current, target) => {
    if (current <= target * 0.5) return 'info';
    if (current <= target) return 'success';
    if (current <= target * 1.2) return 'warning';
    return 'error';
  };

  const MicronutrientRow = ({ label, value, target, unit }) => {
    const percentage = (value / target) * 100;
    const color = getProgressColor(value, target);

    return (
      <Box sx={{ mb: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 0.75,
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            {label}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: color === 'info' ? 'text.secondary' : color === 'success' ? 'success.main' : color === 'warning' ? 'warning.main' : 'error.main',
              fontWeight: 600,
            }}
          >
            {value.toFixed(1)} {unit} / {target} {unit}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={Math.min(percentage, 100)}
          color={color}
          sx={{ height: 6, borderRadius: 1 }}
        />
        {percentage > 100 && (
          <Typography variant="caption" color="error" sx={{ mt: 0.25, display: 'block' }}>
            {((percentage - 100) / 100).toFixed(0)}% over recommended daily intake
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2,
        backgroundColor: 'action.hover',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => onToggleExpand?.(!isExpanded)}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          💊 Micronutrients
        </Typography>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand?.(!isExpanded);
          }}
          sx={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s',
          }}
        >
          <ExpandMoreIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Summary line (always visible) */}
      {!isExpanded && (
        <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
          <Tooltip title={`${fiber.toFixed(1)}g fiber`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" fontWeight={600}>
                {fiber.toFixed(0)}g
              </Typography>
              <Typography variant="caption" color="text.secondary">
                fiber
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title={`${sugar.toFixed(1)}g sugar`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" fontWeight={600}>
                {sugar.toFixed(0)}g
              </Typography>
              <Typography variant="caption" color="text.secondary">
                sugar
              </Typography>
            </Box>
          </Tooltip>
          <Tooltip title={`${sodium.toFixed(0)}mg sodium`}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" fontWeight={600}>
                {sodium.toFixed(0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                mg Na
              </Typography>
            </Box>
          </Tooltip>
        </Stack>
      )}

      {/* Details (expandable) */}
      <Collapse in={isExpanded} timeout="auto">
        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <MicronutrientRow
            label="Fiber"
            value={fiber}
            target={guidelines.fiber.target}
            unit={guidelines.fiber.unit}
          />
          <MicronutrientRow
            label="Sugar"
            value={sugar}
            target={guidelines.sugar.target}
            unit={guidelines.sugar.unit}
          />
          <MicronutrientRow
            label="Sodium"
            value={sodium}
            target={guidelines.sodium.target}
            unit={guidelines.sodium.unit}
          />

          {/* Guidelines note */}
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              📋 <strong>Daily guidelines:</strong> Fiber 25-35g · Sugar &lt;25-36g · Sodium &lt;2300mg
            </Typography>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default MicronutrientDisplay;
