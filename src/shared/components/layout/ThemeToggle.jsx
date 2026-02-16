import React from 'react';
import DarkModeIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeIcon from '@mui/icons-material/LightModeOutlined';
import { IconButton, Tooltip } from '@mui/material';
import { useAppTheme } from '../../context/ThemeContext';

const ThemeToggle = () => {
  const { isDark, toggleTheme } = useAppTheme();

  return (
    <Tooltip title={isDark ? 'Light mode' : 'Dark mode'} arrow>
      <IconButton
        onClick={toggleTheme}
        size="medium"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        sx={(theme) => ({
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : theme.palette.divider}`,
          backgroundColor: isDark ? 'rgba(255,176,32,0.08)' : 'rgba(0,0,0,0.04)',
          color: isDark ? '#ffb020' : theme.palette.text.primary,
          transition: theme.transitions.create(['transform', 'box-shadow', 'color'], {
            duration: 250,
          }),
          '&:hover': {
            transform: 'translateY(-1px)',
            backgroundColor: isDark ? 'rgba(255,176,32,0.15)' : 'rgba(0,0,0,0.08)',
            boxShadow: isDark
              ? '0 0 16px rgba(255,176,32,0.3)'
              : theme.shadows[4],
          },
        })}
      >
        {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
