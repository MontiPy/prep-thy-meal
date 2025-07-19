import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider } from '../utils/firebase.js';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch {
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } catch (err) {
        setError('Login failed');
      }
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-800">Sign In</h2>
        </div>
        <input
          className="border border-gray-300 rounded w-full p-3 mb-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="border border-gray-300 rounded w-full p-3 mb-4"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        <button className="btn-green w-full" onClick={handleLogin}>
          Login / Sign Up
        </button>
        <button className="btn-green w-full mt-3" onClick={handleGoogleLogin}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
