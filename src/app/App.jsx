// src/app/App.jsx
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import MealPrep from '../shared/components/layout/MealPrep';
import { UserProvider } from '../features/auth/UserContext';
import { ThemeProvider } from '../shared/context/ThemeContext';
import { useAppTheme } from '../shared/context/ThemeContext';
import { MacroTargetsProvider } from '../shared/context/MacroTargetsContext';
import ErrorBoundary from '../shared/components/ui/ErrorBoundary';
import OfflineBanner from '../shared/components/layout/OfflineBanner';
import OnboardingModal from '../shared/components/onboarding/OnboardingModal';
import { hasCompletedOnboarding, completeOnboarding } from '../shared/services/onboarding';
import { useUser } from '../features/auth/UserContext';
import { loadUserPreferences, updateUserPreference } from '../shared/services/userPreferences';

const ThemeSync = () => {
  const { user } = useUser();
  const { themeName, isDark, customConfig, setThemeName, setIsDark, setCustomConfig } = useAppTheme();
  const hasLoadedRef = useRef(false);

  // Load from Firebase on login (once per session)
  useEffect(() => {
    if (user?.uid && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadUserPreferences(user.uid).then(prefs => {
        if (prefs.themePrefs) {
          setThemeName(prefs.themePrefs.themeName);
          setIsDark(prefs.themePrefs.isDark);
          if (prefs.themePrefs.customConfig) {
            setCustomConfig(prefs.themePrefs.customConfig);
          }
        }
      });
    }
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save to Firebase on change (debounced, skip initial load)
  useEffect(() => {
    if (user?.uid && hasLoadedRef.current) {
      const timer = setTimeout(() => {
        updateUserPreference(user.uid, 'themePrefs', { themeName, isDark, customConfig });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user?.uid, themeName, isDark, customConfig]);

  return null;
};

const AppContent = () => {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { muiTheme } = useAppTheme();

  const toastOptions = useMemo(() => {
    const toastConfig = muiTheme.custom?.toast ?? {};
    return {
      duration: 4000,
      className: toastConfig.className || '',
      success: {
        duration: 3000,
        className: toastConfig.success?.className || toastConfig.className || '',
        iconTheme: toastConfig.success?.iconTheme ?? {
          primary: toastConfig.success?.primary ?? muiTheme.palette.success.main,
          secondary: toastConfig.success?.secondary ?? muiTheme.palette.background.default,
        },
      },
      error: {
        duration: 5000,
        className: toastConfig.error?.className || toastConfig.className || '',
        iconTheme: toastConfig.error?.iconTheme ?? {
          primary: toastConfig.error?.primary ?? muiTheme.palette.error.main,
          secondary: toastConfig.error?.secondary ?? muiTheme.palette.background.default,
        },
      },
    };
  }, [muiTheme]);

  // Show onboarding for all users (guest or authenticated) who haven't completed it
  useEffect(() => {
    if (!hasCompletedOnboarding()) {
      // Small delay to let the UI load first
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, []); // No dependencies - run once on mount

  return (
    <>
      <ThemeSync />
      <Box
        component="main"
        sx={(theme) => ({
          minHeight: '100vh',
          bgcolor: 'background.default',
          color: 'text.primary',
          transition: theme.transitions.create('background-color', {
            duration: theme.transitions.duration.standard,
          }),
        })}
      >
        <OfflineBanner />
        <ErrorBoundary message="An error occurred in the meal planning app. Please try refreshing the page.">
          <MealPrep />
        </ErrorBoundary>
        <OnboardingModal
          isOpen={showOnboarding}
          onComplete={() => {
            completeOnboarding();
            setShowOnboarding(false);
            toast.success("Welcome! Let's start planning your meals.");
          }}
        />
        <Toaster
          position="top-center"
          toastOptions={toastOptions}
        />
      </Box>
    </>
  );
};

const App = () => (
  <ErrorBoundary message="A critical error occurred. Please refresh the page to continue.">
    <ThemeProvider>
      <UserProvider>
        <MacroTargetsProvider>
          <AppContent />
        </MacroTargetsProvider>
      </UserProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
