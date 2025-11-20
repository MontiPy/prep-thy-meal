import React, { useEffect, useState } from 'react';

const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);

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

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-white text-sm py-2 px-4 shadow">
      You are offline. Edits will be kept locally and cloud sync/search is disabled until you reconnect.
    </div>
  );
};

export default OfflineBanner;
