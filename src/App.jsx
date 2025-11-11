// src/App.jsx
import React from 'react';
import { Toaster } from 'react-hot-toast';
import MealPrep from './components/MealPrep';
import Login from './components/Login.jsx';
import { UserProvider, useUser } from './context/UserContext.jsx';

const AppContent = () => {
  const { user, logout } = useUser();
  return (
    <main>
      {user ? (
        <>
          <button className="absolute top-2 right-2" onClick={logout}>
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
);

export default App;
