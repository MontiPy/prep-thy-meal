import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../utils/firebase.js';

const Login = () => {
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      setError('Login failed');
    }
  };

  return (
    <div className="calculator flex items-center justify-center">
      <div className="card w-full max-w-sm">
        <div className="center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Sign In</h2>
        </div>
        {error && <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>}
        <button className="btn-green w-full" onClick={handleGoogleLogin}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
