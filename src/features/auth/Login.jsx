import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  Stack,
  Typography
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../shared/services/firebase.js';
import { migrateGuestData } from '../../shared/services/guestMigration.js';

const Login = ({ isOpen = true, onClose, onSuccess }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      try {
        const migrationResult = await migrateGuestData(user.uid);

        if (migrationResult.migratedPlans > 0) {
          toast.success(
            `Welcome, ${user.displayName}! ${migrationResult.migratedPlans} meal plan${
              migrationResult.migratedPlans > 1 ? 's' : ''
            } saved to your account.`
          );
        } else {
          toast.success(`Welcome back, ${user.displayName}!`);
        }
      } catch (migrationError) {
        console.error('Migration failed:', migrationError);
        toast.error('Signed in successfully, but some data may not have migrated. Your local data is safe.');
      }

      if (onSuccess) onSuccess(user);
      if (onClose) onClose();
    } catch (loginError) {
      console.error('Login failed:', loginError);
      setError('Failed to sign in. Please try again.');
      toast.error('Failed to sign in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <Card
      sx={{
        maxWidth: 400,
        width: '100%',
        borderRadius: 3,
        border: isDark ? '1px solid rgba(255,45,120,0.15)' : '1px solid',
        borderColor: isDark ? undefined : 'divider',
      }}
      variant="outlined"
    >
      <CardContent>
        <Stack spacing={2.5} alignItems="center">
          <Typography variant="h5" fontWeight={800} textAlign="center">
            Sign in to Prep Thy Meal
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Unlock cloud sync, multi-device access, and secure backup
          </Typography>

          {error && (
            <Typography variant="body2" color="error" textAlign="center">
              {error}
            </Typography>
          )}

          <Button
            fullWidth
            size="large"
            variant="contained"
            color="primary"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </Button>

          {onClose && (
            <Button
              fullWidth
              variant="text"
              onClick={onClose}
              disabled={isLoading}
              sx={{ textTransform: 'none' }}
            >
              Continue as Guest
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  if (onClose) {
    return (
      <Dialog
        open={isOpen}
        onClose={isLoading ? undefined : onClose}
        maxWidth="xs"
        fullWidth
      >
        <DialogContent sx={{ p: 3 }}>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '70vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
      }}
    >
      {content}
    </Box>
  );
};

export default Login;
