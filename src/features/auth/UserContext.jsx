/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../../shared/services/firebase.js';
import LoadingSpinner from '../../shared/components/ui/LoadingSpinner';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const logout = () => signOut(auth);

  // Show loading state while checking authentication
  if (loading) {
    return <LoadingSpinner message="Signing you in..." size="large" />;
  }

  return (
    <UserContext.Provider value={{ user, logout, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
