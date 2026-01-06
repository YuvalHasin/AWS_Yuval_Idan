import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Card,
  TextField,
  Button,
  Typography,
  Stack,
  Link,
  IconButton,
  Tooltip,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import { signUp } from 'aws-amplify/auth';

const Register = () => {
  const navigate = useNavigate();
  
  const [userType, setUserType] = useState('CLIENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  // Handle Registration
  const handleRegister = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Register with Cognito
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password: password,
        options: {
          userAttributes: {
            email: email,
            name: name,
            'custom:userType': userType,
          },
          autoSignIn: false,
        },
      });

      console.log('Sign up successful:', { userId, nextStep });

      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Registration successful! Please check your email to verify your account.' 
          } 
        });
      }, 3000);

    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.name === 'UsernameExistsException') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.name === 'InvalidPasswordException') {
        errorMessage = 'Password does not meet requirements. Must be at least 8 characters.';
      } else if (error.name === 'InvalidParameterException') {
        errorMessage = 'Invalid input. Please check your details.';
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)', // ✅ CHANGED: Blue gradient (same as Login)
        px: { xs: 2, sm: 3 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '-50px',
          right: '-100px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.1)',
          filter: 'blur(40px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-50px',
          left: '-100px',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.05)',
          filter: 'blur(40px)',
        }}
      />

      {/* Back to Home Button */}
      <Tooltip title="Back to home">
        <IconButton
          onClick={() => navigate('/')}
          sx={{
            position: 'absolute',
            top: { xs: 16, md: 24 },
            left: { xs: 16, md: 24 },
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            color: 'white',
            transition: 'all 0.3s ease',
            zIndex: 10,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              transform: 'translateX(-4px)',
            },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>

      {/* Registration Card */}
      <Card
        sx={{
          width: '100%',
          maxWidth: '480px',
          p: { xs: 3, sm: 4, md: 5 },
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          backgroundColor: '#ffffff',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Logo */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', // ✅ CHANGED: Blue gradient
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)', // ✅ CHANGED: Blue shadow
            }}
          >
            <FolderIcon sx={{ fontSize: '1.8rem' }} />
          </Box>
        </Box>

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: '#1a202c',
              mb: 1,
              fontSize: { xs: '1.75rem', sm: '1.95rem' },
            }}
          >
            Create Account
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Join ScanBook today
          </Typography>
        </Box>

        {/* Success Message */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Registration successful! Check your email to verify your account. Redirecting...
          </Alert>
        )}

        {/* User Type Toggle */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" sx={{ color: '#6b7280', mb: 1.5, fontWeight: 500 }}>
            Select Account Type
          </Typography>
          <ToggleButtonGroup
            value={userType}
            exclusive
            onChange={(e, newType) => newType && setUserType(newType)}
            fullWidth
            sx={{
              '& .MuiToggleButton-root': {
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '8px',
                '&.Mui-selected': {
                  background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', // ✅ CHANGED: Blue gradient
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2980b9 0%, #1f618d 100%)', // ✅ CHANGED: Darker blue on hover
                  },
                },
              },
            }}
          >
            <ToggleButton value="CLIENT">
              <PersonIcon sx={{ mr: 1 }} />
              Client
            </ToggleButton>
            <ToggleButton value="CPA">
              <BusinessCenterIcon sx={{ mr: 1 }} />
              CPA
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Form */}
        <Box component="form" onSubmit={handleRegister} noValidate>
          <Stack spacing={2.5}>
            {/* Name Field */}
            <TextField
              fullWidth
              label="Full Name"
              placeholder="John Doe"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              error={!!errors.name}
              helperText={errors.name}
              variant="outlined"
              autoComplete="name"
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb',
                  '&:hover': { backgroundColor: '#f3f4f6' },
                  '&.Mui-focused': {
                    backgroundColor: '#ffffff',
                    '& fieldset': { borderColor: '#3498db', borderWidth: '2px' }, // ✅ CHANGED: Blue focus
                  },
                },
              }}
            />

            {/* Email Field */}
            <TextField
              fullWidth
              type="email"
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              error={!!errors.email}
              helperText={errors.email}
              variant="outlined"
              autoComplete="email"
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb',
                  '&:hover': { backgroundColor: '#f3f4f6' },
                  '&.Mui-focused': {
                    backgroundColor: '#ffffff',
                    '& fieldset': { borderColor: '#3498db', borderWidth: '2px' }, // ✅ CHANGED: Blue focus
                  },
                },
              }}
            />

            {/* Password Field */}
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              error={!!errors.password}
              helperText={errors.password || 'Minimum 8 characters'}
              variant="outlined"
              autoComplete="new-password"
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowPassword}
                      edge="end"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb',
                  '&:hover': { backgroundColor: '#f3f4f6' },
                  '&.Mui-focused': {
                    backgroundColor: '#ffffff',
                    '& fieldset': { borderColor: '#3498db', borderWidth: '2px' }, // ✅ CHANGED: Blue focus
                  },
                },
              }}
            />

            {/* Confirm Password Field */}
            <TextField
              fullWidth
              type={showConfirmPassword ? 'text' : 'password'}
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
              }}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              variant="outlined"
              autoComplete="new-password"
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowConfirmPassword}
                      edge="end"
                      disabled={loading}
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  backgroundColor: '#f9fafb',
                  '&:hover': { backgroundColor: '#f3f4f6' },
                  '&.Mui-focused': {
                    backgroundColor: '#ffffff',
                    '& fieldset': { borderColor: '#3498db', borderWidth: '2px' }, // ✅ CHANGED: Blue focus
                  },
                },
              }}
            />

            {/* Error Message */}
            {errors.submit && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: '8px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                }}
              >
                <Typography variant="body2" sx={{ color: '#991b1b', fontWeight: 500 }}>
                  {errors.submit}
                </Typography>
              </Box>
            )}

            {/* Register Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={loading || success}
              sx={{
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)', // ✅ CHANGED: Blue gradient
                color: 'white',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                py: 1.5,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)', // ✅ CHANGED: Blue shadow
                mt: 1,
                '&:hover:not(:disabled)': {
                  background: 'linear-gradient(135deg, #2980b9 0%, #1f618d 100%)', // ✅ CHANGED: Darker blue hover
                  transform: 'translateY(-2px)',
                },
                '&:disabled': {
                  opacity: 0.7,
                },
              }}
            >
              {loading ? 'Creating Account...' : `Register as ${userType}`}
            </Button>
          </Stack>
        </Box>

        {/* Link to Login */}
        <Box sx={{ mt: 4, textAlign: 'center', pt: 3, borderTop: '1px solid #e5e7eb' }}>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Already have an account?{' '}
            <Link
              component={RouterLink}
              to="/login"
              sx={{
                color: '#3498db', // ✅ CHANGED: Blue link
                textDecoration: 'none',
                fontWeight: 600,
                '&:hover': { textDecoration: 'underline', color: '#2980b9' }, // ✅ CHANGED: Darker blue hover
              }}
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};
export default Register;