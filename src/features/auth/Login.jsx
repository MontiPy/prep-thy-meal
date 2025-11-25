import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography
} from '@mui/material';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../shared/services/firebase.js';

const Login = () => {
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch {
      setError('Login failed');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '70vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: '100%', borderRadius: 3 }} variant="outlined">
        <CardContent>
          <Stack spacing={2.5} alignItems="center">
            <Typography variant="h5" fontWeight={800}>
              Sign In
            </Typography>
            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}
            <Button
              fullWidth
              size="large"
              variant="contained"
              color="primary"
              onClick={handleGoogleLogin}
            >
              Sign in with Google
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
