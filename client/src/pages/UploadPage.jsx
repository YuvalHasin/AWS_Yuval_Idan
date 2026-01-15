import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Button,
  Typography,
  Paper,
  Stack,
  Alert,
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Collapse,
  IconButton,
  Chip,
  Grid
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DescriptionIcon from '@mui/icons-material/Description';
import RequestPageIcon from '@mui/icons-material/RequestPage';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import CategoryIcon from '@mui/icons-material/Category';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { useAuth } from '../context/AuthContext'; // ✅ ADD THIS IMPORT AT TOP

const UploadPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ ADD THIS LINE (get authenticated user)
  
  // Invoice upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [invoiceType, setInvoiceType] = useState('EXPENSE');
  const [category, setCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  // Document request state
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [documentType, setDocumentType] = useState('');
  const [requestYear, setRequestYear] = useState('');
  const [requestMonth, setRequestMonth] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState('');

  // 🔹 CHANGE #1: Updated category options (13 → 5)
  const categoryOptions = [
    'Transport & Vehicle',
    'Equipment & Tech',
    'Marketing & Ads',
    'Office & General',
    'Meals & Entertainment'
  ];

  // Get available years (current year and 5 years back)
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 6; i++) {
      years.push(currentYear - i);
    }
    return years;
  };

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setUploadError('');
      setUploadSuccess(false);
    } else {
      setUploadError('Please select a valid PDF file');
      setSelectedFile(null);
    }
  };

  // Handle invoice upload
  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file first');
      return;
    }

    if (!category) {
      setUploadError('Please select a category');
      return;
    }

    // ✅ FIX #1: Get real userId from Cognito
    if (!user?.username) {
      setUploadError('User not authenticated. Please log in again.');
      return;
    }

    try {
      setUploading(true);
      setUploadError('');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('userId', user.signInDetails?.loginId || user.username);
      formData.append('type', invoiceType);
      formData.append('category', category);

      console.log('📤 Uploading with userId:', user.username); // ✅ Debug log

      const response = await axios.post(
        'https://0wvwt8s2u8.execute-api.us-east-1.amazonaws.com/dev/upload',
        formData
      );

      console.log('✅ Upload successful:', response.data);
      setUploadSuccess(true);
      
      //  Reset form
      setSelectedFile(null);
      setCategory('');
      setInvoiceType('EXPENSE');

      //  Navigate AFTER showing success (improved UX)
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000); 

    } catch (error) {
      console.error('❌ Upload error:', error);
      setUploadError(error.response?.data?.message || 'Failed to upload invoice. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Handle document request submission
  const handleSubmitRequest = async () => {
    if (!documentType) {
      setRequestError('Please select a document type');
      return;
    }

    if (documentType === 'yearly' && !requestYear) {
      setRequestError('Please select a year');
      return;
    }

    if (documentType === 'monthly' && (!requestYear || !requestMonth)) {
      setRequestError('Please select both year and month');
      return;
    }

    try {
      setSubmittingRequest(true);
      setRequestError('');

      const requestData = {
        userId: localStorage.getItem('userId') || 'test-user',
        documentType,
        year: requestYear,
        month: documentType === 'monthly' ? requestMonth : null,
        period: documentType === 'yearly' 
          ? `Year ${requestYear}`
          : `${getMonthName(requestMonth)} ${requestYear}`,
        additionalNotes: additionalNotes.trim() || 'No additional notes',
        requestDate: new Date().toISOString(),
        status: 'pending'
      };

      console.log('📤 Submitting document request:', requestData);

      // TODO: Replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log('✅ Document request submitted successfully');
      setRequestSuccess(true);

      setTimeout(() => {
        setShowRequestForm(false);
        setDocumentType('');
        setRequestYear('');
        setRequestMonth('');
        setAdditionalNotes('');
        setRequestSuccess(false);
      }, 3000);

    } catch (error) {
      console.error('❌ Request submission error:', error);
      setRequestError('Failed to submit request. Please try again.');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const getMonthName = (monthNumber) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[parseInt(monthNumber) - 1] || '';
  };

  return (
    <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh', py: 6, px: { xs: 2, md: 6 } }}>
      
      {/* Header */}
      <Box sx={{ mb: 5, textAlign: 'center' }}>
        <Typography variant="h3" sx={{ fontWeight: 800, color: '#0f172a', mb: 1 }}>
          Upload Invoice
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b' }}>
          Upload your invoices and request financial documents from your CPA
        </Typography>
      </Box>

      <Stack spacing={4} sx={{ maxWidth: '800px', mx: 'auto' }}>
        
        {/* Invoice Upload Section */}
        <Paper elevation={0} sx={{ p: 4, borderRadius: '16px', border: '1px solid #f0f0f0' }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <DescriptionIcon sx={{ color: '#2563eb', fontSize: 32 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
              Upload Invoice Document
            </Typography>
          </Stack>

          <Divider sx={{ mb: 3 }} />

          {/* 🔹 CHANGE #2: Grid layout changed from 50/50 to 33/67 */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}> {/* ✅ CHANGED: was sm={6}, now md={4} (33% width) */}
              <FormControl fullWidth required>
                <InputLabel>Invoice Type</InputLabel>
                <Select
                  value={invoiceType}
                  label="Invoice Type"
                  onChange={(e) => setInvoiceType(e.target.value)}
                  startAdornment={<AttachMoneyIcon sx={{ mr: 1, color: '#64748b' }} />}
                >
                  <MenuItem value="INCOME">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#10b981' }} />
                      <Typography>Income</Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="EXPENSE">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ef4444' }} />
                      <Typography>Expense</Typography>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={8}> {/* ✅ CHANGED: was sm={6}, now md={8} (67% width - BIGGER!) */}
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  label="Category"
                  onChange={(e) => setCategory(e.target.value)}
                  startAdornment={<CategoryIcon sx={{ mr: 1, color: '#64748b' }} />}
                >
                  {categoryOptions.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* File Upload Area */}
          <Box
            sx={{
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              p: 4,
              textAlign: 'center',
              backgroundColor: '#f8fafc',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: '#2563eb',
                backgroundColor: '#eff6ff',
              },
            }}
          >
            <input
              accept="application/pdf"
              style={{ display: 'none' }}
              id="file-upload"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                sx={{
                  borderColor: '#2563eb',
                  color: '#2563eb',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  borderRadius: '10px',
                  '&:hover': {
                    borderColor: '#1d4ed8',
                    backgroundColor: '#eff6ff',
                  },
                }}
              >
                Choose PDF File
              </Button>
            </label>

            {selectedFile && (
              <Box sx={{ mt: 3 }}>
                <Chip
                  label={selectedFile.name}
                  onDelete={() => setSelectedFile(null)}
                  color="primary"
                  sx={{ fontWeight: 600 }}
                />
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#64748b' }}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </Typography>
              </Box>
            )}

            <Typography variant="body2" sx={{ mt: 2, color: '#64748b' }}>
              Supported format: PDF only
            </Typography>
          </Box>

          {/* Upload Progress */}
          {uploading && (
            <Box sx={{ mt: 3 }}>
              <LinearProgress sx={{ borderRadius: '4px', height: 8 }} />
              <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: '#64748b' }}>
                Uploading invoice...
              </Typography>
            </Box>
          )}

          {/* Success Message */}
          {uploadSuccess && (
            <Alert
              icon={<CheckCircleIcon />}
              severity="success"
              sx={{ mt: 3, borderRadius: '10px' }}
            >
              Invoice uploaded successfully! Redirecting to dashboard...
            </Alert>
          )}

          {/* Error Message */}
          {uploadError && (
            <Alert
              icon={<ErrorIcon />}
              severity="error"
              sx={{ mt: 3, borderRadius: '10px' }}
            >
              {uploadError}
            </Alert>
          )}

          {/* Upload Button */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!selectedFile || !category || uploading || uploadSuccess}
              startIcon={<CloudUploadIcon />}
              sx={{
                backgroundColor: '#2563eb', // ✅ Blue (consistent with design)
                color: '#ffffff',
                fontWeight: 600,
                px: 5,
                py: 1.5,
                borderRadius: '10px',
                boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
                '&:hover': {
                  backgroundColor: '#1d4ed8',
                  boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
                },
                '&:disabled': {
                  backgroundColor: '#cbd5e1',
                  color: '#94a3b8',
                },
              }}
            >
              {uploading ? 'Uploading...' : 'Upload Invoice'}
            </Button>
          </Box>
        </Paper>

        {/* Request Document Section */}
        <Paper elevation={0} sx={{ p: 4, borderRadius: '16px', border: '1px solid #f0f0f0' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <RequestPageIcon sx={{ color: '#2563eb', fontSize: 32 }} /> {/* ✅ Blue instead of purple */}
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
                Request Financial Document
              </Typography>
            </Stack>
            
            {showRequestForm && (
              <IconButton
                onClick={() => {
                  setShowRequestForm(false);
                  setDocumentType('');
                  setRequestYear('');
                  setRequestMonth('');
                  setAdditionalNotes('');
                  setRequestError('');
                }}
                sx={{ color: '#64748b' }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </Stack>

          <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
            Request yearly or monthly financial reports from your CPA
          </Typography>

          {!showRequestForm ? (
            <Button
              variant="outlined"
              onClick={() => setShowRequestForm(true)}
              startIcon={<RequestPageIcon />}
              sx={{
                borderColor: '#2563eb',  // ✅ Blue instead of purple
                color: '#2563eb',         // ✅ Blue instead of purple
                fontWeight: 600,
                px: 4,
                py: 1.5,
                borderRadius: '10px',
                '&:hover': {
                  borderColor: '#1d4ed8',
                  backgroundColor: '#eff6ff',
                },
              }}
            >
              Request Document
            </Button>
          ) : (
            <Collapse in={showRequestForm}>
              <Divider sx={{ mb: 3 }} />
              
              <Stack spacing={3}>
                {/* Document Type Selection */}
                <FormControl fullWidth>
                  <InputLabel>Document Type *</InputLabel>
                  <Select
                    value={documentType}
                    label="Document Type *"
                    onChange={(e) => {
                      setDocumentType(e.target.value);
                      setRequestMonth('');
                      setRequestError('');
                    }}
                  >
                    <MenuItem value="yearly">Yearly Document</MenuItem>
                    <MenuItem value="monthly">Monthly Document</MenuItem>
                  </Select>
                </FormControl>

                {/* Year Selection */}
                {documentType && (
                  <FormControl fullWidth>
                    <InputLabel>Year *</InputLabel>
                    <Select
                      value={requestYear}
                      label="Year *"
                      onChange={(e) => {
                        setRequestYear(e.target.value);
                        setRequestError('');
                      }}
                    >
                      {getAvailableYears().map(year => (
                        <MenuItem key={year} value={year}>{year}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {/* Month Selection (only for monthly documents) */}
                {documentType === 'monthly' && (
                  <FormControl fullWidth>
                    <InputLabel>Month *</InputLabel>
                    <Select
                      value={requestMonth}
                      label="Month *"
                      onChange={(e) => {
                        setRequestMonth(e.target.value);
                        setRequestError('');
                      }}
                    >
                      <MenuItem value="1">January</MenuItem>
                      <MenuItem value="2">February</MenuItem>
                      <MenuItem value="3">March</MenuItem>
                      <MenuItem value="4">April</MenuItem>
                      <MenuItem value="5">May</MenuItem>
                      <MenuItem value="6">June</MenuItem>
                      <MenuItem value="7">July</MenuItem>
                      <MenuItem value="8">August</MenuItem>
                      <MenuItem value="9">September</MenuItem>
                      <MenuItem value="10">October</MenuItem>
                      <MenuItem value="11">November</MenuItem>
                      <MenuItem value="12">December</MenuItem>
                    </Select>
                  </FormControl>
                )}

                {/* Period Display (read-only) */}
                {documentType && requestYear && (documentType === 'yearly' || requestMonth) && (
                  <TextField
                    label="Period"
                    value={
                      documentType === 'yearly'
                        ? `Year ${requestYear}`
                        : `${getMonthName(requestMonth)} ${requestYear}`
                    }
                    disabled
                    fullWidth
                    sx={{
                      '& .MuiInputBase-input.Mui-disabled': {
                        WebkitTextFillColor: '#1e293b',
                        fontWeight: 600,
                      },
                    }}
                  />
                )}

                {/* Additional Notes */}
                <TextField
                  label="Additional Notes (Optional)"
                  placeholder="Add any specific requirements or notes..."
                  multiline
                  rows={4}
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  fullWidth
                />

                {/* Error Message */}
                {requestError && (
                  <Alert
                    icon={<ErrorIcon />}
                    severity="error"
                    sx={{ borderRadius: '10px' }}
                  >
                    {requestError}
                  </Alert>
                )}

                {/* Success Message */}
                {requestSuccess && (
                  <Alert
                    icon={<CheckCircleIcon />}
                    severity="success"
                    sx={{ borderRadius: '10px' }}
                  >
                    Document request submitted successfully! Your CPA will be notified.
                  </Alert>
                )}

                {/* Submit Buttons */}
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setShowRequestForm(false);
                      setDocumentType('');
                      setRequestYear('');
                      setRequestMonth('');
                      setAdditionalNotes('');
                      setRequestError('');
                    }}
                    disabled={submittingRequest || requestSuccess}
                    sx={{
                      borderColor: '#cbd5e1',
                      color: '#64748b',
                      fontWeight: 600,
                      px: 3,
                      borderRadius: '8px',
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSubmitRequest}
                    disabled={submittingRequest || requestSuccess}
                    startIcon={submittingRequest ? <LinearProgress size={20} /> : <SendIcon />}
                    sx={{
                      backgroundColor: '#2563eb', // ✅ Blue instead of purple
                      color: '#ffffff',
                      fontWeight: 600,
                      px: 4,
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
                      '&:hover': {
                        backgroundColor: '#1d4ed8',
                        boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
                      },
                      '&:disabled': {
                        backgroundColor: '#cbd5e1',
                        color: '#94a3b8',
                      },
                    }}
                  >
                    {submittingRequest ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </Stack>
              </Stack>
            </Collapse>
          )}
        </Paper>
      </Stack>
    </Box>
  );
};
export default UploadPage;