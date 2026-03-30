/**
 * MacroWarnings Component
 * Displays validation warnings and alerts for protein, fat, and carb intake
 */

import { Alert, AlertTitle, Box, Collapse, IconButton, Stack } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { useState } from 'react';
import { SEVERITY_COLORS } from '../../constants/macroValidation';

/**
 * Single macro warning/alert
 */
function MacroAlert({ validation, macroName, onDismiss }) {
  const [expanded, setExpanded] = useState(false);

  if (!validation || !validation.severity || validation.severity === 'success') {
    return null;
  }

  const severity = SEVERITY_COLORS[validation.severity];
  const severityLabel =
    validation.severity === 'critical'
      ? 'Critical'
      : validation.severity === 'warning'
        ? 'Warning'
        : 'Info';

  return (
    <Alert
      severity={severity}
      onClose={onDismiss}
      sx={{ mb: 1 }}
      action={
        validation.recommendation && (
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{ ml: 1 }}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        )
      }
    >
      <AlertTitle sx={{ fontWeight: 600, mb: 0.5 }}>
        {macroName} {severityLabel}
      </AlertTitle>

      <Box sx={{ fontSize: '0.875rem' }}>{validation.message}</Box>

      {/* Additional context */}
      {validation.gramsPerPound !== undefined && (
        <Box sx={{ fontSize: '0.75rem', mt: 0.5, opacity: 0.9 }}>
          Current: {validation.gramsPerPound.toFixed(2)}g per pound bodyweight
        </Box>
      )}

      {validation.percentage !== undefined && (
        <Box sx={{ fontSize: '0.75rem', mt: 0.5, opacity: 0.9 }}>
          Current: {validation.percentage.toFixed(1)}% of total calories
        </Box>
      )}

      {/* Recommendation (collapsible) */}
      {validation.recommendation && (
        <Collapse in={expanded}>
          <Box
            sx={{
              mt: 1,
              pt: 1,
              borderTop: 1,
              borderColor: 'divider',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Recommendation: {validation.recommendation}
          </Box>
        </Collapse>
      )}
    </Alert>
  );
}

/**
 * Main MacroWarnings component
 * Shows all validation warnings for macros
 */
export default function MacroWarnings({ validation, onDismiss, sx }) {
  if (!validation) {
    return null;
  }

  const { protein, fat, carbs, calories, hasCritical, hasWarnings } = validation;

  // Don't show anything if all is good
  if (!hasCritical && !hasWarnings) {
    return null;
  }

  return (
    <Stack spacing={1} sx={sx}>
      {/* Calories */}
      {calories?.severity && calories.severity !== 'success' && (
        <MacroAlert
          validation={calories}
          macroName="Calories"
          onDismiss={() => onDismiss?.('calories')}
        />
      )}

      {/* Protein */}
      {protein?.severity && protein.severity !== 'success' && (
        <MacroAlert
          validation={protein}
          macroName="Protein"
          onDismiss={() => onDismiss?.('protein')}
        />
      )}

      {/* Fat */}
      {fat?.severity && fat.severity !== 'success' && (
        <MacroAlert
          validation={fat}
          macroName="Fat"
          onDismiss={() => onDismiss?.('fat')}
        />
      )}

      {/* Carbs */}
      {carbs?.severity && carbs.severity !== 'success' && (
        <MacroAlert
          validation={carbs}
          macroName="Carbs"
          onDismiss={() => onDismiss?.('carbs')}
        />
      )}
    </Stack>
  );
}

/**
 * Compact version showing just a summary badge
 */
export function MacroWarningsBadge({ validation }) {
  if (!validation) {
    return null;
  }

  const { hasCritical, hasWarnings, criticals, warnings } = validation;

  if (!hasCritical && !hasWarnings) {
    return (
      <Alert severity="success" sx={{ py: 0.5 }}>
        All macros within optimal ranges
      </Alert>
    );
  }

  if (hasCritical) {
    return (
      <Alert severity="error" sx={{ py: 0.5 }}>
        {criticals.length} critical {criticals.length === 1 ? 'issue' : 'issues'} detected
      </Alert>
    );
  }

  return (
    <Alert severity="warning" sx={{ py: 0.5 }}>
      {warnings.length} {warnings.length === 1 ? 'warning' : 'warnings'} detected
    </Alert>
  );
}

/**
 * Inline indicator (compact chip/badge)
 */
export function MacroValidationIndicator({ validation }) {
  if (!validation || !validation.severity || validation.severity === 'success') {
    return null;
  }

  const colors = {
    critical: 'error.main',
    warning: 'warning.main',
    info: 'info.main',
  };

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 0.75,
        py: 0.25,
        borderRadius: 1,
        fontSize: '0.75rem',
        fontWeight: 600,
        bgcolor: `${colors[validation.severity]}`,
        color: 'white',
        ml: 1,
      }}
    >
      {validation.severity === 'critical' ? '⚠️' : '⚡'}
    </Box>
  );
}
