import { useState, useEffect } from 'react';
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
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FolderIcon from '@mui/icons-material/Folder';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const navigate = useNavigate();
  const { register, getCPAs } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('CLIENT');
  const [cpaId, setCpaId] = useState('');
  const [cpas, setCpas] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Load CPA list only if role = CLIENT
  useEffect(() => {
    const fetchCPAs = async () => {
      if (role === 'CLIENT') {
        try {
          const list = await getCPAs();
          setCpas(list);
        } catch (err) {
          console.error('Failed to fetch CPAs', err);
        }
      }
    };
    fetchCPAs();
  }, [role, getCPAs]);

  const validateForm = () => {
    const newErrors = {};
    if (!fullName) newErrors.fullName = 'Full name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    if (!confirmPassword) newErrors.confirmPassword = 'Confirm your password';
    if (password && confirmPassword && password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!role) newErrors.role = 'Please select a role';
    if (role === 'CLIENT' && !cpaId) newErrors.cpaId = 'Please select a CPA';
    return newErrors;
  };

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
      await register(fullName, email, password, role, cpaId);
      navigate('/dashboard');
    } catch (error) {
      setErrors({ submit: error.message || 'Registration failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleMouseDownPassword = (event) => event.preventDefault();

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
      <Tooltip title="Back to home">
        <IconButton
          onClick={() => navigate('/')}
          sx={{
            position: 'absolute',
            top: { xs: 16, md: 24 },
            left: { xs: 16, md: 24 },
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            color: 'white',
            zIndex: 10,
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' },
          }}
        >
          <ArrowBackIcon />
        </IconButton>
      </Tooltip>

      <Card
        sx={{
          width: '100%',
          maxWidth: '420px',
          p: { xs: 3, sm: 4, md: 5 },
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          backgroundColor: '#fff',
          zIndex: 1,
        }}
      >
        {/* Logo */}
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
            }}
          >
            <FolderIcon sx={{ fontSize: '1.8rem' }} />
          </Box>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#1a202c', mb: 1 }}>
            Create your account
          </Typography>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Fill in your details to get started
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleRegister} noValidate>
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={!!errors.fullName}
              helperText={errors.fullName}
              disabled={loading}
            />
            <TextField
              fullWidth
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              disabled={loading}
            />
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              disabled={loading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleClickShowPassword} onMouseDown={handleMouseDownPassword} edge="end">
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              type={showPassword ? 'text' : 'password'}
              label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              disabled={loading}
            />

            {/* Role Selection */}
            <FormControl component="fieldset" error={!!errors.role}>
              <FormLabel component="legend">Select Role</FormLabel>
              <RadioGroup row value={role} onChange={(e) => setRole(e.target.value)}>
                <FormControlLabel value="CLIENT" control={<Radio />} label="Client" />
                <FormControlLabel value="CPA" control={<Radio />} label="CPA" />
              </RadioGroup>
              {errors.role && <Typography variant="caption" color="error">{errors.role}</Typography>}
            </FormControl>

            {/* CPA selection if CLIENT */}
            {role === 'CLIENT' && (
              <FormControl fullWidth error={!!errors.cpaId}>
                <InputLabel>Select your CPA</InputLabel>
                <Select value={cpaId} onChange={(e) => setCpaId(e.target.value)} label="Select your CPA">
                  {cpas.map((cpa) => (
                    <MenuItem key={cpa.id} value={cpa.id}>
                      {cpa.name}
                    </MenuItem>
                  ))}
                </Select>
                {errors.cpaId && <Typography variant="caption" color="error">{errors.cpaId}</Typography>}
              </FormControl>
            )}

            {errors.submit && (
              <Box sx={{ p: 2, borderRadius: '8px', backgroundColor: '#fee2e2', border: '1px solid #fecaca' }}>
                <Typography variant="body2" color="error">
                  {errors.submit}
                </Typography>
              </Box>
            )}

            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={loading}
              sx={{
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                color: 'white',
                fontWeight: 700,
                py: 1.5,
              }}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </Stack>
        </Box>

        <Box sx={{ mt: 4, textAlign: 'center', pt: 3, borderTop: '1px solid #e5e7eb' }}>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" sx={{ color: '#3498db', fontWeight: 600 }}>
              Sign in
            </Link>
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default Register;
