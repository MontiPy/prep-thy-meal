import React from 'react';
import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/AddRounded';

/**
 * EmptyStateMessage
 * Provides contextual messaging when a list or section is empty
 * Includes an optional call-to-action button
 */
const EmptyStateMessage = ({
  title,
  description,
  icon = null,
  actionLabel = null,
  onAction = null,
  variant = 'outlined', // 'outlined' or 'filled'
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';

  return (
    <Paper
      variant={variant}
      sx={{
        p: { xs: 2.5, sm: 3.5 },
        textAlign: 'center',
        borderRadius: 2,
        bgcolor: variant === 'filled'
          ? isDarkMode
            ? 'action.hover'
            : 'action.hover'
          : 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200,
        gap: 1.5,
      }}
    >
      <Stack spacing={1.5} alignItems="center" width="100%">
        {/* Icon */}
        {icon && (
          <Box
            sx={{
              fontSize: { xs: 48, sm: 64 },
              opacity: isDarkMode ? 0.5 : 0.6,
            }}
          >
            {icon}
          </Box>
        )}

        {/* Title */}
        <Typography
          variant="h6"
          fontWeight={700}
          color="text.primary"
          sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
        >
          {title}
        </Typography>

        {/* Description */}
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              maxWidth: 320,
              lineHeight: 1.6,
            }}
          >
            {description}
          </Typography>
        )}

        {/* CTA Button */}
        {actionLabel && onAction && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onAction}
            sx={{
              mt: 1,
              minHeight: { xs: 44, sm: 'auto' },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {actionLabel}
          </Button>
        )}
      </Stack>
    </Paper>
  );
};

export default EmptyStateMessage;
