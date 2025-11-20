// src/app/App.jsx
import React from 'react';
import { Toaster } from 'react-hot-toast';
import MealPrep from '../shared/components/layout/MealPrep';
import Login from '../features/auth/Login';
import { UserProvider, useUser } from '../features/auth/UserContext';
import { ThemeProvider } from '../shared/context/ThemeContext';
import ThemeToggle from '../shared/components/layout/ThemeToggle';
import ErrorBoundary from '../shared/components/ui/ErrorBoundary';
import OfflineBanner from '../shared/components/layout/OfflineBanner';

const AppContent = () => {
  const { user, logout } = useUser();
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <OfflineBanner />
      <ThemeToggle />
      {user ? (
        <>
          <button className="absolute top-2 left-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded z-40" onClick={logout}>
            Logout
          </button>
          <ErrorBoundary message="An error occurred in the meal planning app. Please try refreshing the page.">
            <MealPrep />
          </ErrorBoundary>
        </>
      ) : (
        <ErrorBoundary message="An error occurred during login. Please try refreshing the page.">
          <Login />
        </ErrorBoundary>
      )}
    </main>
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
