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
            style: {
              background: 'rgba(18, 18, 30, 0.92)',
              backdropFilter: 'blur(12px)',
              color: '#e8e6f0',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '12px',
              fontFamily: '"Urbanist", sans-serif',
              fontSize: '0.9rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(255,45,120,0.08)',
            },
            success: {
              iconTheme: {
                primary: '#39ff7f',
                secondary: '#12121e',
              },
              style: {
                border: '1px solid rgba(57,255,127,0.15)',
              },
            },
            error: {
              iconTheme: {
                primary: '#ff4757',
                secondary: '#12121e',
              },
              style: {
                border: '1px solid rgba(255,71,87,0.15)',
              },
            },
          }}
        />
      </UserProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
