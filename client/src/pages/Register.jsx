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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { signUp, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';

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

  // Verification popup state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Validation with AWS Cognito password requirements
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
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = 'Password must contain at least one number (0-9)';
    } else if (!/[a-z]/.test(password)) {
      newErrors.password = 'Password must contain at least one lowercase letter';
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      newErrors.password = 'Password must contain at least one special character (!@#$%^&*...)';
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

      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setUserEmail(email);
        setShowVerificationModal(true);
        setSuccess(true);
      } else if (isSignUpComplete) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      }

    } catch (error) {
      console.error('Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.name === 'UsernameExistsException') {
        errorMessage = 'An account with this email already exists.';
      } else if (error.name === 'InvalidPasswordException') {
        if (error.message.includes('numeric')) {
          errorMessage = 'Password must contain at least one number (0-9).';
        } else if (error.message.includes('symbolic') || error.message.includes('special')) {
          errorMessage = 'Password must contain at least one special character (!@#$%^&*...).';
        } else if (error.message.includes('uppercase')) {
          errorMessage = 'Password must contain at least one uppercase letter.';
        } else if (error.message.includes('lowercase')) {
          errorMessage = 'Password must contain at least one lowercase letter.';
        } else if (error.message.includes('length')) {
          errorMessage = 'Password must be at least 8 characters long.';
        } else {
          errorMessage = 'Password does not meet requirements: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character.';
        }
      } else if (error.name === 'InvalidParameterException') {
        errorMessage = 'Invalid input. Please check your details.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Handle verification code submission
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setVerificationError('');
    setVerifying(true);

    try {
      console.log('🔐 Confirming sign up with code for:', userEmail);

      const { isSignUpComplete } = await confirmSignUp({
        username: userEmail,
        confirmationCode: verificationCode.trim(),
      });

      console.log('✅ Email verification successful!', { isSignUpComplete });

      setShowVerificationModal(false);
      
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Email verified successfully! You can now sign in.' 
          } 
        });
      }, 1000);

    } catch (error) {
      console.error('❌ Verification error:', error);
      
      let errorMessage = 'Verification failed. Please check the code and try again.';
      
      if (error.name === 'CodeMismatchException') {
        errorMessage = 'Invalid verification code. Please check and try again.';
      } else if (error.name === 'ExpiredCodeException') {
        errorMessage = 'Verification code has expired. Please request a new one.';
      } else if (error.name === 'NotAuthorizedException') {
        errorMessage = 'Invalid verification code.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setVerificationError(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  // Handle resend verification code
  const handleResendCode = async () => {
    setResending(true);
    setVerificationError('');
    setResendSuccess(false);

    try {
      console.log('📧 Resending verification code to:', userEmail);

      await resendSignUpCode({
        username: userEmail,
      });

      console.log('✅ Verification code resent successfully');

      setResendSuccess(true);
      
      setTimeout(() => {
        setResendSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('❌ Resend code error:', error);
      
      let errorMessage = 'Failed to resend code. Please try again.';
      
      if (error.name === 'LimitExceededException') {
        errorMessage = 'Too many attempts. Please wait before trying again.';
      } else if (error.name === 'InvalidParameterException') {
        errorMessage = 'User not found or already verified.';
      } else if (error.name === 'CodeDeliveryFailureException') {
        errorMessage = 'Failed to send code. Please check your email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setVerificationError(errorMessage);
    } finally {
      setResending(false);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setShowVerificationModal(false);
    setVerificationCode('');
    setVerificationError('');
    setResendSuccess(false);
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
        background: 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)',
        px: { xs: 2, sm: 3 },
        position: 'relative',
        overflow: 'hidden',
      }}
    >
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
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)',
            }}
          >
            <FolderIcon sx={{ fontSize: '1.8rem' }} />
          </Box>
        </Box>

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

        {success && !showVerificationModal && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Registration successful! Check your email for the verification code.
          </Alert>
        )}

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
                  background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                  color: 'white',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2980b9 0%, #1f618d 100%)',
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

        <Box component="form" onSubmit={handleRegister} noValidate>
          <Stack spacing={2.5}>
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
                    '& fieldset': { borderColor: '#3498db', borderWidth: '2px' },
                  },
                },
              }}
            />

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
                    '& fieldset': { borderColor: '#3498db', borderWidth: '2px' },
                  },
                },
              }}
            />

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
              helperText={errors.password || 'Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char'}
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
                    '& fieldset': { borderColor: '#3498db', borderWidth: '2px' },
                  },
                },
              }}
            />

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
                    '& fieldset': { borderColor: '#3498db', borderWidth: '2px' },
                  },
                },
              }}
            />

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

            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={loading || success}
              sx={{
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                color: 'white',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                py: 1.5,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)',
                mt: 1,
                '&:hover:not(:disabled)': {
                  background: 'linear-gradient(135deg, #2980b9 0%, #1f618d 100%)',
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

        <Box sx={{ mt: 4, textAlign: 'center', pt: 3, borderTop: '1px solid #e5e7eb' }}>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Already have an account?{' '}
            <Link
              component={RouterLink}
              to="/login"
              sx={{
                color: '#3498db',
                textDecoration: 'none',
                fontWeight: 600,
                '&:hover': { textDecoration: 'underline', color: '#2980b9' },
              }}
            >
              Sign in
            </Link>
          </Typography>
        </Box>
      </Card>

      <Dialog
        open={showVerificationModal}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            p: 2,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <VerifiedUserIcon />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a202c' }}>
                  Verify Your Email
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b7280' }}>
                  Check your inbox for the code
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleCloseModal} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ color: '#6b7280', mb: 1, textAlign: 'center' }}>
              We've sent a 6-digit verification code to:
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: '#3498db',
                fontWeight: 600,
                textAlign: 'center',
                mb: 3,
              }}
            >
              {userEmail}
            </Typography>

            {verificationError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {verificationError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleVerifyCode}>
              <TextField
                fullWidth
                label="Verification Code"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value);
                  setVerificationError('');
                }}
                inputProps={{
                  maxLength: 6,
                  pattern: '[0-9]{6}',
                  inputMode: 'numeric',
                }}
                autoFocus
                disabled={verifying}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    fontSize: '1.5rem',
                    textAlign: 'center',
                    letterSpacing: '0.5rem',
                    '&.Mui-focused': {
                      '& fieldset': { borderColor: '#3498db', borderWidth: '2px' },
                    },
                  },
                  '& input': {
                    textAlign: 'center',
                  },
                }}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Stack spacing={2} sx={{ width: '100%' }}>
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleVerifyCode}
              disabled={verifying || verificationCode.length !== 6}
              sx={{
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                color: 'white',
                textTransform: 'none',
                fontWeight: 700,
                py: 1.5,
                borderRadius: '8px',
                '&:hover:not(:disabled)': {
                  background: 'linear-gradient(135deg, #2980b9 0%, #1f618d 100%)',
                },
                '&:disabled': {
                  opacity: 0.6,
                },
              }}
            >
              {verifying ? 'Verifying...' : 'Verify Email'}
            </Button>

            {resendSuccess && (
              <Alert severity="success" sx={{ py: 0.5 }}>
                Code sent! Check your email inbox.
              </Alert>
            )}

            <Typography variant="caption" sx={{ textAlign: 'center', color: '#6b7280' }}>
              Didn't receive the code?{' '}
              <Link
                component="button"
                type="button"
                onClick={handleResendCode}
                disabled={resending}
                sx={{
                  color: '#3498db',
                  textDecoration: 'none',
                  fontWeight: 600,
                  cursor: resending ? 'not-allowed' : 'pointer',
                  opacity: resending ? 0.6 : 1,
                  '&:hover': { 
                    textDecoration: resending ? 'none' : 'underline' 
                  },
                }}
              >
                {resending ? 'Resending...' : 'Resend Code'}
              </Link>
            </Typography>
          </Stack>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default Register;