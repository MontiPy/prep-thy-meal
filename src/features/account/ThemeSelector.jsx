import React from 'react';
import { Box, Card, CardContent, CardHeader, Grid, Typography } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded';
import { useAppTheme } from '../../shared/context/ThemeContext';
import CustomThemeEditor from './CustomThemeEditor';

const ThemeSwatch = ({ theme, isActive, isDark, onClick, customConfig }) => {
  // For the custom theme, derive preview colors from customConfig
  const preview =
    theme.id === 'custom' && customConfig
      ? {
        primary: customConfig.primaryColor,
        secondary: customConfig.accentColor,
        bg: '#f9fafb',
        bgDark: '#111827',
      }
      : theme.preview;

  const bgColor = preview
    ? isDark
      ? preview.bgDark
      : preview.bg
    : isDark
      ? '#111827'
      : '#f9fafb';

  return (
    <Box
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        borderRadius: 2,
        border: 2,
        borderColor: isActive ? 'primary.main' : 'divider',
        overflow: 'hidden',
        transition: 'all 200ms ease',
        position: 'relative',
        '&:hover': {
          borderColor: isActive ? 'primary.main' : 'text.secondary',
        },
      }}
    >
      {/* Color preview bar */}
      <Box
        sx={{
          height: 48,
          display: 'flex',
          bgcolor: bgColor,
        }}
      >
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              width: '60%',
              height: 20,
              borderRadius: 1,
              bgcolor: preview?.primary || '#888',
            }}
          />
        </Box>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              width: '60%',
              height: 20,
              borderRadius: 1,
              bgcolor: preview?.secondary || '#aaa',
            }}
          />
        </Box>
      </Box>

      {/* Theme name label */}
      <Box sx={{ px: 1, py: 0.75, textAlign: 'center' }}>
        <Typography variant="caption" fontWeight={600} noWrap>
          {theme.label}
        </Typography>
      </Box>

      {/* Active check icon */}
      {isActive && (
        <CheckCircleIcon
          color="primary"
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            fontSize: 20,
            bgcolor: 'background.paper',
            borderRadius: '50%',
          }}
        />
      )}
    </Box>
  );
};

const ThemeSelector = () => {
  const { themeName, setThemeName, isDark, themeList, customConfig } = useAppTheme();

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardHeader
        title={<Typography variant="h6" fontWeight={800}>Theme</Typography>}
      />
      <CardContent>
        <Grid container spacing={1.5}>
          {themeList.map((theme) => (
            <Grid key={theme.id} size={{ xs: 4, sm: 3, md: 2 }}>
              <ThemeSwatch
                theme={theme}
                isActive={themeName === theme.id}
                isDark={isDark}
                onClick={() => setThemeName(theme.id)}
                customConfig={customConfig}
              />
            </Grid>
          ))}
        </Grid>

        {themeName === 'custom' && <CustomThemeEditor />}
      </CardContent>
    </Card>
  );
};

export default ThemeSelector;
