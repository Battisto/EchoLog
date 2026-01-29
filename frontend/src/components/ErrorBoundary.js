import React from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import { Refresh } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box 
          display="flex" 
          flexDirection="column" 
          alignItems="center" 
          justifyContent="center" 
          minHeight="50vh"
          p={3}
        >
          <Alert severity="error" sx={{ mb: 3, maxWidth: 600 }}>
            <Typography variant="h6" gutterBottom>
              Something went wrong!
            </Typography>
            <Typography variant="body2" gutterBottom>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={this.handleReload}
              sx={{ mt: 2 }}
            >
              Reload Page
            </Button>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
