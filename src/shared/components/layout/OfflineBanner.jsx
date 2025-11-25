// src/shared/components/layout/OfflineBanner.jsx
import React, { useEffect, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { WifiOff } from 'lucide-react';

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
        icon={<WifiOff size={20} />}
        sx={{ width: '100%' }}
      >
        You are offline. Edits will be kept locally and cloud sync/search is disabled until you reconnect.
      </Alert>
    </Snackbar>
  );
};

export default OfflineBanner;
