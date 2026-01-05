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
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../context/AuthContext'; // <--- הייבוא החדש

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); // <--- שליפת פונקציית ההתחברות מהקונטקסט
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // בדיקת תקינות בסיסית
  const validateForm = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  // ביצוע ההתחברות
  const handleLogin = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // 1. קריאה לפונקציה האמיתית מול Cognito
      await login(email, password);
      
      // 2. אם הצליח - המעבר לדשבורד
      // (הניתוב לדשבורד הנכון יקרה ב-DashboardRouter בהתבסס על ה-Role)
      navigate('/dashboard');
      
    } catch (error) {
      console.error("Login Failed:", error);
      // הצגת הודעת שגיאה למשתמש
      setErrors({ 
        submit: error.message || 'Incorrect username or password.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

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
      {/* אלמנטים דקורטיביים ברקע */}
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

      {/* כפתור חזרה לדף הבית */}
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

      {/* כרטיס ההתחברות */}
      <Card
        sx={{
          width: '100%',
          maxWidth: '420px',
          p: { xs: 3, sm: 4, md: 5 },
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          backgroundColor: '#ffffff',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* לוגו */}
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

        {/* כותרת */}
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
            Sign in to ScanBook
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Enter your details below to access your account
          </Typography>
        </Box>

        {/* טופס */}
        <Box component="form" onSubmit={handleLogin} noValidate>
          <Stack spacing={2.5}>
            {/* שדה אימייל */}
            <TextField
              fullWidth
              type="email"
              label="Email address"
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

            {/* שדה סיסמה */}
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
              helperText={errors.password}
              variant="outlined"
              autoComplete="current-password"
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
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

            {/* הצגת שגיאת התחברות כללית */}
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

            {/* כפתור התחברות */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={loading}
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
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Stack>
        </Box>

        {/* קישור להרשמה */}
        <Box sx={{ mt: 4, textAlign: 'center', pt: 3, borderTop: '1px solid #e5e7eb' }}>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Don't have an account?{' '}
            <Link
              component={RouterLink}
              to="/register"
              sx={{
                color: '#3498db',
                textDecoration: 'none',
                fontWeight: 600,
                '&:hover': { textDecoration: 'underline', color: '#2980b9' },
              }}
            >
              Get started
            </Link>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};
export default Login;