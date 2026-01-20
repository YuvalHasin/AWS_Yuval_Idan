import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, CircularProgress, Box, Button, Alert, Stack 
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../context/AuthContext';

// API Endpoints
const REPORTS_API_URL = "https://0wvwt8s2u8.execute-api.us-east-1.amazonaws.com/dev/reports";
const NOTIFICATIONS_API_URL = "https://0wvwt8s2u8.execute-api.us-east-1.amazonaws.com/dev/notifications";

const ReportsPage = ({ selectedClientId, notificationId }) => {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState(null);

  const fetchReports = useCallback(async () => {
    if (!selectedClientId) return;
    
    try {
      setLoading(true);
      setError(null);
      // משיכת נתונים ספציפיים ללקוח שבחרנו מההתראה
      const response = await axios.get(`${REPORTS_API_URL}?clientId=${selectedClientId}`);
      setData(response.data); 
    } catch (err) {
      console.error("Error loading report:", err);
      setError("Failed to load financial data for this client.");
    } finally {
      setLoading(false);
    }
  }, [selectedClientId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleSendToClient = async () => {
    try {
      setLoading(true);
      // 1. עדכון ההתראה במערכת כ-"טופלה" (Read/Resolved)
      if (notificationId) {
        await axios.patch(`${NOTIFICATIONS_API_URL}/${notificationId}`, {
          status: 'RESOLVED',
          processedBy: user.userId
        });
      }

      // 2. שליחת הודעה/דוח ללקוח (ניתן להוסיף כאן לוגיקה של העלאת קובץ ל-S3)
      console.log(`Sending report for client ${selectedClientId} to their dashboard`);
      
      setIsSent(true);
      setTimeout(() => setIsSent(false), 5000);
    } catch (err) {
      console.error("Error sending report:", err);
      setError("Failed to send report to client.");
    } finally {
      setLoading(false);
    }
  };

  if (!selectedClientId) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="info">Please select a report request from your notifications to view data.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: '30px', direction: 'ltr' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="800" color="#1a202c">
            Financial Report Generation 📋
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Generating data for Client ID: {selectedClientId}
          </Typography>
        </Box>
        
        <Button 
          variant="contained" 
          color="success" 
          startIcon={isSent ? <CheckCircleIcon /> : <SendIcon />}
          onClick={handleSendToClient}
          disabled={loading || data.length === 0 || isSent}
          sx={{ height: '50px', px: 4, borderRadius: '12px' }}
        >
          {isSent ? "Report Sent!" : "Generate & Send to Client"}
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {isSent && <Alert severity="success" sx={{ mb: 3 }}>The report has been successfully processed and sent to the client's dashboard.</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: '#f8f9fa' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Period</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Total Income</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Total Expenses</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Net Profit</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Documents</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.period} sx={{ '&:hover': { backgroundColor: '#f3f4f6' } }}>
                  <TableCell sx={{ fontWeight: 'medium' }}>{row.period}</TableCell>
                  <TableCell sx={{ color: '#2e7d32' }}>₪{row.totalIncome.toLocaleString()}</TableCell>
                  <TableCell sx={{ color: '#d32f2f' }}>₪{row.totalExpense.toLocaleString()}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    ₪{(row.totalIncome - row.totalExpense).toLocaleString()}
                  </TableCell>
                  <TableCell>{row.count} docs</TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    No financial data found for this client.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ReportsPage;