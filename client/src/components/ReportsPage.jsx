import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, CircularProgress, Box 
} from '@mui/material';

// לדוגמה:
const REPORTS_API_URL = "https://0wvwt8s2u8.execute-api.us-east-1.amazonaws.com/dev/reports";

const ReportsPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await axios.get(REPORTS_API_URL);
        setData(response.data); 
      } catch (error) {
        console.error("שגיאה בטעינת הדוח:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
      <CircularProgress />
    </Box>
  );

  return (
    <Box sx={{ padding: '30px', direction: 'rtl' }}>
      <Typography variant="h4" gutterBottom align="right" sx={{ mb: 4 }}>
        דוח פיננסי חודשי ושנתי 📋
      </Typography>

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: '#1976d2' }}>
            <TableRow>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>חודש / שנה</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>הכנסות</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>הוצאות</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>רווח נטו</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>כמות מסמכים</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.period} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                <TableCell align="right" sx={{ fontWeight: 'medium' }}>{row.period}</TableCell>
                <TableCell align="right" sx={{ color: '#2e7d32' }}>₪{row.totalIncome.toFixed(2)}</TableCell>
                <TableCell align="right" sx={{ color: '#d32f2f' }}>₪{row.totalExpense.toFixed(2)}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  ₪{(row.totalIncome - row.totalExpense).toFixed(2)}
                </TableCell>
                <TableCell align="right">{row.count}</TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">לא נמצאו נתונים להצגה</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ReportsPage;