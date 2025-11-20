// src/App.jsx
import React from 'react';
import { Toaster } from 'react-hot-toast';
import MealPrep from './components/MealPrep';
import Login from './components/Login.jsx';
import { UserProvider, useUser } from './context/UserContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import ThemeToggle from './components/ThemeToggle';

const AppContent = () => {
  const { user, logout } = useUser();
  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-300">
      <ThemeToggle />
      {user ? (
        <>
          <button className="absolute top-2 left-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded z-40" onClick={logout}>
            Logout
          </button>
          <MealPrep />
        </>
      ) : (
        <Login />
      )}
    </main>
  );
};

const App = () => (
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
);

export default App;
