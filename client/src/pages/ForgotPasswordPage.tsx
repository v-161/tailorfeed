import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, Link, Paper,
  Alert, CircularProgress
} from '@mui/material';
import { Email, ArrowBack } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth(); // Use our updated AuthContext
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Use the forgotPassword function from our MongoDB AuthContext
      await forgotPassword(email);
      
      setSuccess(`Password reset instructions sent to ${email}`);
      setEmail('');
      
    } catch (error: any) {
      setError(error.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Email sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
            Reset Password
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your email and we'll send you instructions to reset your password
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            disabled={loading || !!success}
            helperText="Enter the email associated with your account"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading || !!success}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Reset Instructions'}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Link 
              component={RouterLink} 
              to="/login" 
              sx={{ 
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}
            >
              <ArrowBack fontSize="small" />
              Back to Sign In
            </Link>
          </Box>
        </form>

        {/* Additional Help */}
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Didn't receive the email?</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            • Check your spam folder<br/>
            • Make sure you entered the correct email<br/>
            • Wait a few minutes and try again
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default ForgotPasswordPage;