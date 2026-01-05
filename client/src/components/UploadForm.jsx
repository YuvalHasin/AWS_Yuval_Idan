import { useState } from 'react';
import axios from 'axios';
import '../App.css'; // כדי שנקבל את העיצוב שניצור עוד רגע

const UploadForm = () => {
  // 👇 כאן תדביק את הכתובת שלך מ-API Gateway
  const API_URL = "https://0wvwt8s2u8.execute-api.us-east-1.amazonaws.com/dev/upload"; 

  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // 1. פונקציה שקורית כשבוחרים קובץ
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setStatus("");
  };

  // 2. פונקציה ששולחת את הקובץ
  const handleUpload = async () => {
    if (!file) {
      setStatus("נא לבחור קובץ קודם");
      return;
    }

    setIsUploading(true);
    setStatus("מעלה קובץ, אנא המתן... ");

    // המרת הקובץ ל-Base64
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = async () => {
      try {
        // ניקוי ה-Prefix של ה-Base64
        const base64Content = reader.result.split(',')[1];

        const payload = {
          userId: "react-user", // כרגע קבוע, נשנה בהמשך
          fileName: file.name,
          fileContent: base64Content
        };

        // שליחה לשרת
        await axios.post(API_URL, payload);

        setStatus("הקובץ עלה בהצלחה! ");
        setFile(null); // איפוס הבחירה בזיכרון
        document.getElementById('fileInput').value = ""; // איפוס השדה ויזואלית
        
      } catch (error) {
        console.error("Upload error:", error);
        setStatus("שגיאה בהעלאה ");
      } finally {
        setIsUploading(false);
      }
    };
  };

  return (
    <div className="upload-card">
      <h2>העלאת חשבונית 🧾</h2>
      <p>בחר קובץ PDF או תמונה להעלאה למערכת</p>
      
      <div className="form-group">
        <input 
          id="fileInput"
          type="file" 
          onChange={handleFileChange} 
          accept="image/*,application/pdf"
        />
      </div>

      <button 
        onClick={handleUpload} 
        disabled={isUploading || !file}
        className="upload-btn"
      >
        {isUploading ? "מעלה..." : "שלח חשבונית לענן"}
      </button>

      {status && <div className="status-msg">{status}</div>}
    </div>
  );
};
export default UploadForm;