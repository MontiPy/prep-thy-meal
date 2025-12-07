import React from 'react';
import { Box, Typography, Button, Stack } from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';

const EmptyState = ({ 
  icon = SearchOffIcon, 
  title = "No items found", 
  description = "Try adjusting your search or filters", 
  action, 
  sx = {} 
}) => {
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
        borderColor: 'divider',
        ...sx 
      }}
    >
      <Box 
        sx={{ 
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
          p: 2,
          borderRadius: '50%',
          mb: 2,
          color: 'text.secondary'
        }}
      >
        <Icon sx={{ fontSize: 40, opacity: 0.7 }} />
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
