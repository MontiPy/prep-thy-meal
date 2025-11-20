import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
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
      // Custom fallback UI
      return (
        <div className="error-boundary-fallback" style={{
          padding: '2rem',
          margin: '2rem auto',
          maxWidth: '600px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#856404', marginBottom: '1rem' }}>
            Something went wrong
          </h2>
          <p style={{ color: '#856404', marginBottom: '1.5rem' }}>
            {this.props.message || 'An unexpected error occurred. Please try refreshing the page.'}
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ textAlign: 'left', marginTop: '1rem' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                Error Details (Development Only)
              </summary>
              <pre style={{
                backgroundColor: '#f8f9fa',
                padding: '1rem',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '0.875rem'
              }}>
                {this.state.error && this.state.error.toString()}
                {'\n\n'}
                {this.state.errorInfo && this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1.5rem',
              backgroundColor: '#ffc107',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: 'bold',
              color: '#000'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
