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
          border: `1px solid ${theme.palette.divider}`,
          backgroundColor: isDark ? 'grey.900' : 'grey.100',
          color: isDark ? 'warning.light' : 'text.primary',
          boxShadow: theme.shadows[1],
          transition: theme.transitions.create(['transform', 'box-shadow'], {
            duration: theme.transitions.duration.shorter,
          }),
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: theme.shadows[4],
            backgroundColor: isDark ? 'grey.800' : 'grey.200',
          },
        })}
      >
        {isDark ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
