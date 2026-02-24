import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const LoadingSpinner = ({ message = 'Loading...', size = 'medium' }) => {
  const sizeMap = {
    small: 16,
    medium: 32,
    large: 48,
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 4,
      }}
    >
      <CircularProgress
        size={sizeMap[size] || sizeMap.medium}
        color="primary"
      />
      {message && (
        <Typography
          variant={size === 'small' ? 'caption' : 'body2'}
          color="text.secondary"
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;
