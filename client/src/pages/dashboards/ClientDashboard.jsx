import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Stack,
  MenuItem,
  Select,
  FormControl,
  Paper,
  Divider,
  Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { BarChart as MuiBarChart } from '@mui/x-charts/BarChart';
import { PieChart as MuiPieChart } from '@mui/x-charts/PieChart';

const ClientDashboard = () => {
  const GET_API_URL = "https://0wvwt8s2u8.execute-api.us-east-1.amazonaws.com/dev/invoices";
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(GET_API_URL);
      const sortedData = response.data.sort((a, b) => 
        new Date(b.uploadTime) - new Date(a.uploadTime)
      );
      setInvoices(sortedData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats with safe numbers
  const expenses = invoices.filter(inv => inv.type !== 'INCOME').reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const incomes = invoices.filter(inv => inv.type === 'INCOME').reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
  const netProfit = incomes - expenses;
  const lastUploadDate = invoices.length > 0 
    ? new Date(invoices[0].uploadTime).toLocaleDateString('he-IL') 
    : "-";

  const StatCard = ({ title, value, icon: Icon, color, isProfit }) => (
    <Card
      elevation={0}
      sx={{
        borderRadius: '16px',
        border: '1px solid #f0f0f0',
        backgroundColor: '#ffffff',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px rgba(0,0,0,0.05)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              display: 'flex',
              p: 1.5,
              borderRadius: '12px',
              backgroundColor: `${color}15`,
              color: color,
            }}
          >
            <Icon fontSize="medium" />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a202c' }}>
              ₪{value.toLocaleString('he-IL')}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  // עיבוד נתונים לגרפים
  const chartData = invoices.reduce((acc, inv) => {
    const date = new Date(inv.uploadTime);
    const month = isNaN(date.getTime()) ? 'N/A' : date.toLocaleString('en-US', { month: 'short' });
    let existingMonth = acc.find(item => item.name === month);
    if (!existingMonth) {
      existingMonth = { name: month, incomes: 0, expenses: 0 };
      acc.push(existingMonth);
    }
    const amt = Number(inv.amount) || 0;
    if (inv.type === 'INCOME') existingMonth.incomes += amt;
    else existingMonth.expenses += amt;
    return acc;
  }, []).slice(0, 6).reverse();

  const categoryData = invoices
    .filter(inv => inv.type !== 'INCOME')
    .reduce((acc, inv) => {
      const cat = inv.category || 'General';
      const amt = Number(inv.amount) || 0;
      const existing = acc.find(item => item.name === cat);
      if (existing) existing.value += amt;
      else acc.push({ name: cat, value: amt });
      return acc;
    }, []);

  return (
    <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh', py: 4, px: { xs: 2, md: 6 } }}>
      
      {/* Top Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={3} sx={{ mb: 5 }}>
        <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, width: '100%' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Financial Overview
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', mt: 0.5 }}>
            Manage your invoices and track your business growth
          </Typography>
        </Box>
        <Link to="/upload" style={{ textDecoration: 'none' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              backgroundColor: '#2563eb',
              borderRadius: '10px',
              px: 4,
              py: 1.5,
              fontWeight: 600,
              boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)',
              '&:hover': { backgroundColor: '#1d4ed8', boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)' },
              whiteSpace: 'nowrap'
            }}
          >
            New Invoice
          </Button>
        </Link>
      </Stack>

      {/* Stats Section */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Income" value={incomes} icon={TrendingUpIcon} color="#10b981" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Expenses" value={expenses} icon={TrendingDownIcon} color="#ef4444" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Net Profit" value={netProfit} icon={AccountBalanceWalletIcon} color="#3b82f6" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Invoices" value={invoices.length} icon={DescriptionIcon} color="#8b5cf6" />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #f0f0f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Revenue vs Expenses</Typography>
            <Box sx={{ height: 350 }}>
              {chartData.length > 0 ? (
                <MuiBarChart
                  dataset={chartData}
                  xAxis={[{ scaleType: 'band', dataKey: 'name' }]}
                  series={[
                    { dataKey: 'incomes', label: 'Income', color: '#10b981' },
                    { dataKey: 'expenses', label: 'Expense', color: '#ef4444' },
                  ]}
                  borderRadius={8}
                  margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
                />
              ) : <CircularProgress />}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #f0f0f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Expenses by Category</Typography>
            <Box sx={{ height: 350, display: 'flex', justifyContent: 'center' }}>
              {categoryData.length > 0 ? (
                <MuiPieChart
                  series={[{
                    data: categoryData.map((d, i) => ({ id: i, value: d.value, label: d.name })),
                    innerRadius: 70,
                    paddingAngle: 5,
                    cornerRadius: 5,
                  }]}
                  slotProps={{ legend: { hidden: true } }}
                />
              ) : <Typography sx={{ mt: 10 }} color="text.secondary">No data yet</Typography>}
            </Box>
          </Paper>
        </Grid>
      </Grid>

     {/* Table Section */}
      <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Recent Transactions</Typography>
          {/* כאן אפשר להוסיף את הסלקטורים של חודש/שנה אם תרצי */}
        </Box>
        <Divider />
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Invoice Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Type</TableCell> {/* עמודה חדשה */}
                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b' }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b' }} align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.invoiceId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{inv.originalName}</Typography>
                  </TableCell>
                  
                  {/* עמודת סוג עם צבעים */}
                  <TableCell>
                    <Chip 
                      label={inv.type === 'INCOME' ? 'Income' : 'Expense'} 
                      size="small" 
                      sx={{ 
                        fontWeight: 600, 
                        fontSize: '0.75rem',
                        backgroundColor: inv.type === 'INCOME' ? '#dcfce7' : '#fee2e2', 
                        color: inv.type === 'INCOME' ? '#166534' : '#991b1b',
                        borderRadius: '6px',
                        width: '80px'
                      }} 
                    />
                  </TableCell>

                  <TableCell>
                    <Chip label={inv.category || 'General'} size="small" variant="outlined" sx={{ fontWeight: 500, color: '#475569' }} />
                  </TableCell>
                  
                  <TableCell sx={{ color: '#64748b' }}>{new Date(inv.uploadTime).toLocaleDateString('he-IL')}</TableCell>
                  
                  <TableCell align="right" sx={{ fontWeight: 700, color: inv.type === 'INCOME' ? '#10b981' : '#ef4444' }}>
                    {inv.type === 'INCOME' ? '+' : '-'} ₪{Number(inv.amount).toLocaleString()}
                  </TableCell>

                  <TableCell align="center">
                    <Chip 
                      label="Completed" 
                      size="small" 
                      sx={{ backgroundColor: '#f1f5f9', color: '#475569', fontWeight: 600, borderRadius: '6px' }} 
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default ClientDashboard;