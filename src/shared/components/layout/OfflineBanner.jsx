// src/shared/components/layout/OfflineBanner.jsx
import React, { useEffect, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOffRounded';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <Snackbar
      open={isOffline}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        severity="warning"
        icon={<WifiOffIcon sx={{ fontSize: 20 }} />}
        sx={{
          width: '100%',
          bgcolor: (theme) => theme.palette.mode === 'dark'
            ? 'rgba(255,176,32,0.12)'
            : undefined,
          borderColor: (theme) => theme.palette.mode === 'dark'
            ? 'rgba(255,176,32,0.3)'
            : undefined,
          border: (theme) => theme.palette.mode === 'dark'
            ? '1px solid'
            : undefined,
        }}
      >
        You are offline. Edits will be kept locally and cloud sync/search is disabled until you reconnect.
      </Alert>
    </Snackbar>
  );
};

export default OfflineBanner;
