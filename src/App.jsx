// src/App.jsx
import React from 'react';
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
  </UserProvider>
);

export default App;
