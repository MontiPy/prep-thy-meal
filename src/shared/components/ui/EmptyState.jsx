import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import SearchOffIcon from '@mui/icons-material/SearchOff';

const NeonPlateIcon = ({ size = 48, color = '#ff2d78' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="24" cy="28" rx="18" ry="8" stroke={color} strokeWidth="1.5" opacity="0.6" />
    <ellipse cx="24" cy="26" rx="14" ry="6" stroke={color} strokeWidth="1.5" opacity="0.4" />
    <path d="M8 20c0-8.8 7.2-16 16-16s16 7.2 16 16" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    <circle cx="24" cy="20" r="3" stroke={color} strokeWidth="1" opacity="0.3" />
    <line x1="20" y1="12" x2="20" y2="8" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5">
      <animate attributeName="opacity" values="0.5;0.2;0.5" dur="2s" repeatCount="indefinite" />
    </line>
    <line x1="24" y1="10" x2="24" y2="5" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.4">
      <animate attributeName="opacity" values="0.4;0.15;0.4" dur="2.5s" repeatCount="indefinite" />
    </line>
    <line x1="28" y1="12" x2="28" y2="8" stroke={color} strokeWidth="1" strokeLinecap="round" opacity="0.5">
      <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1.8s" repeatCount="indefinite" />
    </line>
  </svg>
);

const EmptyState = ({
  illustration,
  icon = SearchOffIcon,
  title = "No items found",
  description = "Try adjusting your search or filters",
  action,
  sx = {}
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const Icon = icon;
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        textAlign: 'center',
        bgcolor: 'background.paper',
        borderRadius: 2,
        border: '1px dashed',
        borderColor: isDark
          ? 'rgba(255,45,120,0.15)'
          : 'divider',
        ...sx
      }}
    >
      <Box sx={{ p: 2, mb: 2 }}>
        {illustration ? (
          <Box
            sx={{
              bgcolor: isDark ? 'rgba(255,45,120,0.08)' : 'rgba(214,36,94,0.05)',
              p: 2,
              borderRadius: '50%',
              '& svg': {
                width: 96,
                height: 96,
              },
            }}
          >
            {illustration}
          </Box>
        ) : icon === SearchOffIcon ? (
          <NeonPlateIcon size={48} color={isDark ? '#ff2d78' : '#d6245e'} />
        ) : (
          <Box
            sx={{
              bgcolor: isDark
                ? 'rgba(255,45,120,0.08)'
                : 'rgba(214,36,94,0.05)',
              p: 2,
              borderRadius: '50%',
              color: isDark
                ? '#ff2d78'
                : '#d6245e',
            }}
          >
            <Icon sx={{ fontSize: 40, opacity: 0.7 }} />
          </Box>
        )}
      </Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, mb: action ? 3 : 0 }}>
        {description}
      </Typography>
      {action && (
        <Box sx={{ mt: 2 }}>
          {action}
        </Box>
      )}
    </Box>
  );
};

export default EmptyState;
