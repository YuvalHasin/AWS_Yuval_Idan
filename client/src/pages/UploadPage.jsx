import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Radio, 
  RadioGroup, 
  FormControlLabel, 
  Typography 
} from '@mui/material';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const [invoiceType, setInvoiceType] = useState('EXPENSE'); // הגדרת ברירת מחדל כהוצאה
  const [category, setCategory] = useState('משרדי');

  const categories = ['משרדי', 'דלק', 'חשמל', 'מזון', 'שיווק', 'אחר'];

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
    if (!file) return alert("אנא בחר קובץ");
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

      alert("הקובץ הועלה בהצלחה! 🚀");
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
    <div className="page-content" style={{ textAlign: 'center', marginTop: '50px' }}>
      <h2>העלאת חשבונית חדשה 🧾</h2>
      <input type="file" onChange={handleFileChange} style={{ margin: '20px' }} />
      <br />
      {/* הוספת בחירת סוג מעל כפתור ההעלאה */}
      <div style={{ marginBottom: '20px', textAlign: 'right', direction: 'rtl' }}>
        <Typography variant="h6">סוג המסמך:</Typography>
        <RadioGroup 
          row 
          value={invoiceType} 
          onChange={(e) => setInvoiceType(e.target.value)}
        >
          <FormControlLabel value="EXPENSE" control={<Radio />} label="הוצאה" />
          <FormControlLabel value="INCOME" control={<Radio />} label="הכנסה" />
        </RadioGroup>
      </div>
      <FormControl fullWidth style={{ marginTop: '20px', textAlign: 'right' }}>
        <InputLabel>קטגוריה</InputLabel>
        <Select
          value={category}
          label="קטגוריה"
          onChange={(e) => setCategory(e.target.value)}
        >
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <button 
        onClick={handleUpload} 
        disabled={uploading}
        style={{ padding: '10px 20px', background: '#2ecc71', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
      >
        {uploading ? "מעלה..." : "העלה קובץ"}
      </button>
    </div>
  );
};
export default UploadPage;