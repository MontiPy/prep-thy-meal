import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', size = 'medium' }) => {
  const sizeClasses = {
    small: { spinner: '16px', fontSize: '0.875rem' },
    medium: { spinner: '32px', fontSize: '1rem' },
    large: { spinner: '48px', fontSize: '1.25rem' }
  };

  const { spinner: spinnerSize, fontSize } = sizeClasses[size] || sizeClasses.medium;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      padding: '2rem'
    }}>
      <div
        style={{
          width: spinnerSize,
          height: spinnerSize,
          border: '3px solid rgba(255,255,255,0.06)',
          borderTop: '3px solid #ff2d78',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          boxShadow: '0 0 16px rgba(255,45,120,0.3)',
        }}
      />
      {message && (
        <p style={{
          fontSize,
          color: '#7a78a0',
          margin: 0,
          fontFamily: '"Urbanist", sans-serif',
        }}>
          {message}
        </p>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
