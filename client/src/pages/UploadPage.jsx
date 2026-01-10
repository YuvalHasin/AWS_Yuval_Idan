import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  Typography,
  Stack,
  CircularProgress,
  Paper,
  Divider,
  Radio as MuiRadio
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const [invoiceType, setInvoiceType] = useState('EXPENSE'); // הגדרת ברירת מחדל כהוצאה
  const [category, setCategory] = useState('Office'); // שיניתי לאנגלית שיתאים לגרף ב-Dashboard

  const categories = ['Office', 'Fuel', 'Electricity', 'Food', 'Marketing', 'Other'];

  // הכתובת שלך ללמבדה
  const UPLOAD_LAMBDA_URL = "https://0wvwt8s2u8.execute-api.us-east-1.amazonaws.com/dev/upload";

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // פונקציית עזר להפוך קובץ לטקסט (Base64) כדי שהלמבדה תוכל לקרוא אותו
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // אנחנו צריכים רק את התוכן נטו, בלי ההתחלה של "data:image/png;base64,"
        let encoded = reader.result.toString().replace(/^data:(.*,)?/, '');
        if ((encoded.length % 4) > 0) {
          encoded += '='.repeat(4 - (encoded.length % 4));
        }
        resolve(encoded);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");
    setUploading(true);
    
    try {
      console.log("1. מכין את הקובץ לשליחה...");
      const fileContentBase64 = await convertFileToBase64(file);

      console.log("2. שולח את הקובץ ללמבדה...");
      
      // הוספת השדות החדשים כאן בתוך האובייקט
      const response = await axios.post(UPLOAD_LAMBDA_URL, {
        userId: "test_user_1", 
        fileName: file.name,
        fileContent: fileContentBase64,
        invoiceType: invoiceType, // שולח 'INCOME' או 'EXPENSE'
        category: category        // שולח 'דלק', 'חשמל' וכו'
      });

      console.log("3. תשובה מהשרת:", response.data);

      alert("Invoice uploaded successfully! 🚀");
      navigate('/'); 

    } catch (error) {
      console.error("שגיאה בהעלאה:", error);
      if (error.response && error.response.data && error.response.data.body) {
         alert("שגיאה מהשרת: " + error.response.data.body);
      } else {
         alert("שגיאה בהעלאה - בדוק קונסול");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh', py: 6, px: { xs: 2, md: 4 }, direction: 'ltr' }}>
      
      {/* כפתור חזרה */}
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/')}
        sx={{ mb: 4, color: '#64748b', fontWeight: 600, textTransform: 'none' }}
      >
        Back to Dashboard
      </Button>

      <Box sx={{ maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', mb: 1, textAlign: 'center' }}>
          Upload New Invoice
        </Typography>
        <Typography variant="body1" sx={{ color: '#64748b', mb: 4, textAlign: 'center' }}>
          Add a new document to your financial records
        </Typography>

        <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <CardContent sx={{ p: 4 }}>
            <Stack spacing={4}>
              
              {/* בחירת קובץ */}
              <Paper 
                variant="outlined" 
                sx={{ 
                  p: 3, 
                  textAlign: 'center', 
                  borderStyle: 'dashed', 
                  borderWidth: 2, 
                  borderColor: file ? '#2563eb' : '#e2e8f0',
                  backgroundColor: file ? '#eff6ff' : '#f8fafc',
                  position: 'relative'
                }}
              >
                <input
                  accept="image/*,application/pdf"
                  style={{ display: 'none' }}
                  id="raised-button-file"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="raised-button-file" style={{ cursor: 'pointer', width: '100%', display: 'block' }}>
                  <CloudUploadIcon sx={{ fontSize: 48, color: file ? '#2563eb' : '#94a3b8', mb: 1 }} />
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 1, color: '#1e293b' }}>
                    {file ? file.name : "Select your invoice file"}
                  </Typography>
                  <Button variant="outlined" component="span" size="small" sx={{ textTransform: 'none' }}>
                    Choose File
                  </Button>
                </label>
              </Paper>

              <Divider />

              {/* סוג מסמך */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#475569', textTransform: 'uppercase', fontSize: '0.75rem' }}>
                  Document Type
                </Typography>
                <RadioGroup 
                  row 
                  value={invoiceType} 
                  onChange={(e) => setInvoiceType(e.target.value)}
                >
                  <FormControlLabel 
                    value="EXPENSE" 
                    control={<MuiRadio size="small" />} 
                    label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Expense</Typography>} 
                  />
                  <FormControlLabel 
                    value="INCOME" 
                    control={<MuiRadio size="small" />} 
                    label={<Typography variant="body2" sx={{ fontWeight: 500 }}>Income</Typography>} 
                  />
                </RadioGroup>
              </Box>

              {/* קטגוריה */}
              <FormControl fullWidth>
                <InputLabel sx={{ fontSize: '0.9rem' }}>Category</InputLabel>
                <Select
                  value={category}
                  label="Category"
                  onChange={(e) => setCategory(e.target.value)}
                  sx={{ borderRadius: '10px', height: '50px' }}
                >
                  {categories.map((cat) => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* כפתור העלאה */}
              <Button 
                variant="contained" 
                fullWidth
                size="large"
                onClick={handleUpload} 
                disabled={uploading}
                sx={{ 
                  py: 1.5, 
                  borderRadius: '10px', 
                  backgroundColor: '#2563eb',
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&:hover': { backgroundColor: '#1d4ed8' }
                }}
              >
                {uploading ? (
                  <Stack direction="row" spacing={2} alignItems="center">
                    <CircularProgress size={20} color="inherit" />
                    <span>Uploading...</span>
                  </Stack>
                ) : "Upload Now"}
              </Button>

            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default UploadPage;