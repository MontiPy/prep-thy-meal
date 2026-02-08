// src/app/App.jsx
import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import MealPrep from '../shared/components/layout/MealPrep';
import { UserProvider, useUser } from '../features/auth/UserContext';
import { ThemeProvider } from '../shared/context/ThemeContext';
import ErrorBoundary from '../shared/components/ui/ErrorBoundary';
import OfflineBanner from '../shared/components/layout/OfflineBanner';
import OnboardingModal from '../shared/components/onboarding/OnboardingModal';
import { hasCompletedOnboarding, completeOnboarding } from '../shared/services/onboarding';

const AppContent = () => {
  const { user } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show onboarding for authenticated users who haven't completed it
  useEffect(() => {
    if (user && !hasCompletedOnboarding()) {
      // Small delay to let the UI load first
      const timer = setTimeout(() => setShowOnboarding(true), 500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  return (
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
    </Box>
  );
};

const App = () => (
  <ErrorBoundary message="A critical error occurred. Please refresh the page to continue.">
    <ThemeProvider>
      <UserProvider>
        <AppContent />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            className: 'toast-neon',
            success: {
              duration: 3000,
              className: 'toast-neon toast-neon-success',
              iconTheme: {
                primary: '#39ff7f',
                secondary: '#12121e',
              },
            },
            error: {
              duration: 5000,
              className: 'toast-neon toast-neon-error',
              iconTheme: {
                primary: '#ff4757',
                secondary: '#12121e',
              },
            },
          }}
        />
      </UserProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
