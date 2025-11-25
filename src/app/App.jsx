// src/app/App.jsx
import React from 'react';
import { Box, Container } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import MealPrep from '../shared/components/layout/MealPrep';
import Login from '../features/auth/Login';
import { UserProvider, useUser } from '../features/auth/UserContext';
import { ThemeProvider } from '../shared/context/ThemeContext';
import ThemeToggle from '../shared/components/layout/ThemeToggle';
import ErrorBoundary from '../shared/components/ui/ErrorBoundary';
import OfflineBanner from '../shared/components/layout/OfflineBanner';

const AppContent = () => {
  const { user } = useUser();
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
      {user ? (
        <ErrorBoundary message="An error occurred in the meal planning app. Please try refreshing the page.">
          <MealPrep />
        </ErrorBoundary>
      ) : (
        <Container maxWidth="sm" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="flex-end" mb={3}>
            <ThemeToggle />
          </Box>
          <ErrorBoundary message="An error occurred during login. Please try refreshing the page.">
            <Login />
          </ErrorBoundary>
        </Container>
      )}
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
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </UserProvider>
    </ThemeProvider>
  </ErrorBoundary>
);

export default App;
