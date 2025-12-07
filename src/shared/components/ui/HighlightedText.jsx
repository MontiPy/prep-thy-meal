import React from 'react';
import { Typography } from '@mui/material';

const HighlightedText = ({ text, highlight, sx = {}, ...props }) => {
  if (!text) return null;
  
  if (!highlight) {
    return (
      <Typography component="span" sx={sx} {...props}>
        {text}
      </Typography>
    );
  }

  // Escape special regex characters in highlight string
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));

  return (
    <Typography component="span" sx={sx} {...props}>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Typography 
            key={i} 
            component="span" 
            sx={{
              bgcolor: '#fef08a', // Yellow-200
              color: 'black',
              fontWeight: 'inherit',
              fontSize: 'inherit',
              lineHeight: 'inherit',
              px: '2px',
              borderRadius: '2px'
            }}
          >
            {part}
          </Typography>
        ) : (
          part
        )
      )}
    </Typography>
  );
};

export default HighlightedText;