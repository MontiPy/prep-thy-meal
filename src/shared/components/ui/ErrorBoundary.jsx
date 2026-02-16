import React from 'react';
import { Alert, AlertTitle, Button, Box, Collapse } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // MUI theme-aware fallback UI
      return (
        <Box
          sx={{
            p: 4,
            m: '2rem auto',
            maxWidth: 600,
          }}
        >
          <Alert severity="error" sx={{ mb: 2 }}>
            <AlertTitle>Something went wrong</AlertTitle>
            {this.props.message || 'An unexpected error occurred. Please try refreshing the page.'}
          </Alert>

          {import.meta.env?.DEV && this.state.error && (
            <Collapse in={Boolean(this.state.error)}>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <AlertTitle>Error Details (Development Only)</AlertTitle>
                <Box
                  component="pre"
                  sx={{
                    mt: 1,
                    p: 2,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    overflow: 'auto',
                    fontSize: '0.875rem',
                    fontFamily: 'monospace',
                  }}
                >
                  {this.state.error && this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </Box>
              </Alert>
            </Collapse>
          )}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
