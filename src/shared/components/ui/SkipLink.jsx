import React from 'react';
import { Box, Button } from '@mui/material';

/**
 * SkipLink
 * Keyboard accessibility helper - allows users to skip to main content
 * Only visible when keyboard-focused
 */
const SkipLink = ({ mainContentId = 'main-content' }) => {
  return (
    <Button
      href={`#${mainContentId}`}
      sx={{
        position: 'absolute',
        top: -40,
        left: 0,
        zIndex: 100,
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        padding: '8px 16px',
        '&:focus': {
          top: 0,
        },
      }}
      variant="contained"
    >
      Skip to main content
    </Button>
  );
};

export default SkipLink;
