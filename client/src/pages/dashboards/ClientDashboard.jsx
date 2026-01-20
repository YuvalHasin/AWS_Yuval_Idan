import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
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
  Chip,
  InputLabel
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { BarChart as MuiBarChart } from '@mui/x-charts/BarChart';
import { PieChart as MuiPieChart } from '@mui/x-charts/PieChart';

const ClientDashboard = () => {
  // ✅ Environment variables
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  
  // ✅ Validate environment variable
  if (!API_BASE_URL) {
    console.error('❌ VITE_API_URL is not defined in .env file');
  }
  
  // ✅ Construct endpoints
  const GET_INVOICES_URL = `${API_BASE_URL}/invoices`;
  const GET_REPORTS_URL = `${API_BASE_URL}/financial-reports`;
  
  const { user } = useAuth(); // We don't need getAuthToken anymore for this bypass
  
  const [invoices, setInvoices] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [invoiceFilter, setInvoiceFilter] = useState({
    month: 'all',
    year: 'all'
  });
  
  const [currentMonthReport, setCurrentMonthReport] = useState(null);
  
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalInvoices: 0,
  });

  const parseInvoiceDate = (dateString) => {
    if (!dateString || dateString === 'Not found') {
      return new Date(0);
    }
    try {
      const parts = dateString.split(/[\/.-]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
      }
      return new Date(dateString);
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return new Date(0);
    }
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString || dateString === 'Not found') {
      return 'No date';
    }
    try {
      const parsedDate = parseInvoiceDate(dateString);
      return parsedDate.toLocaleDateString('he-IL');
    } catch (error) {
      return dateString;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyInvoiceFilters();
  }, [invoiceFilter, allInvoices]);

  // ✅ FIX: The updated fetchData function (Bypassing Headers/CORS)
  const fetchData = async () => {
    try {
      setLoading(true);
      
      console.log('🚀 Fetching data via URL params (Simple Mode - Bypassing CORS)...');
      console.log('🌐 API Base URL:', API_BASE_URL);

      // 👇 KEY CHANGE: No headers, no Bearer token. 
      // Just passing userId in params to bypass the browser Preflight check.
      const config = {
          params: { userId: user?.username } 
      };

      // 1. Fetch Invoices
      const invoicesResponse = await axios.get(GET_INVOICES_URL, config);
      
      const sortedData = invoicesResponse.data.sort((a, b) => {
        const dateA = a.date && a.date !== 'Not found' ? parseInvoiceDate(a.date) : new Date(a.uploadTime);
        const dateB = b.date && b.date !== 'Not found' ? parseInvoiceDate(b.date) : new Date(b.uploadTime);
        return dateB - dateA;
      });
      
      setAllInvoices(sortedData);
      setInvoices(sortedData.slice(0, 10));

      // 2. Fetch Reports (Also without headers)
      const reportsResponse = await axios.get(GET_REPORTS_URL, {
          params: { 
              period: 'current',
              userId: user?.username 
          }
      });
      
      const reports = reportsResponse.data;
      console.log('📊 Current Month Financial Report:', reports);
      setCurrentMonthReport(reports);
      
      // Calculate Stats
      if (reports && reports.monthly) {
           const monthKey = `${reports.period.month}/${reports.period.year}`;
           const monthData = reports.monthly[monthKey]; // Removed || {} to check properly below
           
           if (!monthData || (monthData.income === 0 && monthData.expense === 0)) {
               // Fallback logic from your original code
               const availableMonths = Object.keys(reports.monthly);
               if (availableMonths.length > 0) {
                   const latestMonth = availableMonths[0];
                   const latestData = reports.monthly[latestMonth];
                   setStats({
                      totalIncome: latestData.income || 0,
                      totalExpenses: latestData.expense || 0,
                      netProfit: (latestData.income || 0) - (latestData.expense || 0),
                      totalInvoices: latestData.count || 0,
                   });
               } else {
                   setStats({ totalIncome: 0, totalExpenses: 0, netProfit: 0, totalInvoices: 0 });
               }
           } else {
               setStats({
                  totalIncome: monthData.income || 0,
                  totalExpenses: monthData.expense || 0,
                  netProfit: (monthData.income || 0) - (monthData.expense || 0),
                  totalInvoices: reports.totalInvoices || 0,
               });
           }
      }

    } catch (error) {
      console.error("❌ Error fetching data:", error);
      console.error("❌ Error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Fallback calculation if lambda fails
      if (allInvoices.length > 0) {
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          
          const currentMonthInvoices = allInvoices.filter(inv => {
            const date = new Date(inv.uploadTime);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
          });
          
          const expenses = currentMonthInvoices
            .filter(inv => inv.type !== 'INCOME')
            .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
          const incomes = currentMonthInvoices
            .filter(inv => inv.type === 'INCOME')
            .reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
          
          setStats({
            totalIncome: incomes,
            totalExpenses: expenses,
            netProfit: incomes - expenses,
            totalInvoices: currentMonthInvoices.length,
          });
      }
    } finally {
      setLoading(false);
    }
  };

  const applyInvoiceFilters = () => {
    let filtered = [...allInvoices];
    
    if (invoiceFilter.month !== 'all' || invoiceFilter.year !== 'all') {
      filtered = filtered.filter(inv => {
        let dateToUse;
        
        if (inv.date && inv.date !== 'Not found') {
          dateToUse = parseInvoiceDate(inv.date);
        } else {
          dateToUse = new Date(inv.uploadTime);
        }
        
        const invMonth = dateToUse.getMonth() + 1;
        const invYear = dateToUse.getFullYear();
        
        const monthMatch = invoiceFilter.month === 'all' || invMonth === parseInt(invoiceFilter.month);
        const yearMatch = invoiceFilter.year === 'all' || invYear === parseInt(invoiceFilter.year);
        
        return monthMatch && yearMatch;
      });
    }
    
    setInvoices(filtered);
  };

  const getAvailableYears = () => {
    const years = new Set(allInvoices.map(inv => new Date(inv.uploadTime).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  };

  const expenses = stats.totalExpenses;
  const incomes = stats.totalIncome;
  const netProfit = stats.netProfit;

  const StatCard = ({ title, value, icon: Icon, color }) => (
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
              {typeof value === 'number' ? `₪${value.toLocaleString('he-IL')}` : value}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  const getChartData = () => {
    if (!currentMonthReport) return [];
    
    const monthKey = `${currentMonthReport.period.month}/${currentMonthReport.period.year}`;
    const data = currentMonthReport.monthly[monthKey];
    
    if (!data) return [];
    
    return [{
      name: new Date(`${currentMonthReport.period.year}-${currentMonthReport.period.month}-01`).toLocaleString('en-US', { month: 'short' }),
      incomes: data.income,
      expenses: data.expense
    }];
  };

  const getCategoryData = () => {
    if (!currentMonthReport || !currentMonthReport.byCategory) return [];
    
    return Object.entries(currentMonthReport.byCategory).map(([name, value]) => ({
      name,
      value
    }));
  };

  // Auto-refresh for real-time status updates
  useEffect(() => {
    const hasProcessingInvoices = allInvoices.some(inv => 
      inv.status === 'PENDING_UPLOAD' || inv.status === 'PROCESSING'
    );

    if (hasProcessingInvoices) {
      console.log('🔄 Found processing invoices, setting up auto-refresh...');
      
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing data to check for status updates...');
        fetchData();
      }, 3000); 

      const timeout = setTimeout(() => {
        clearInterval(interval);
        console.log('⏰ Auto-refresh stopped after 60 seconds');
      }, 60000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [allInvoices]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: '#f8fafc', minHeight: '100vh', py: 4, px: { xs: 2, md: 6 } }}>
      
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={3} sx={{ mb: 5 }}>
        <Box sx={{ textAlign: { xs: 'center', sm: 'left' }, width: '100%' }}>
          <Typography variant="h4" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>
            Financial Overview - {currentMonthReport ? `${currentMonthReport.period.month}/${currentMonthReport.period.year}` : 'Current Month'}
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
          <StatCard title="Monthly Income" value={incomes} icon={TrendingUpIcon} color="#10b981" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Monthly Expenses" value={expenses} icon={TrendingDownIcon} color="#ef4444" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Net Profit" value={netProfit} icon={AccountBalanceWalletIcon} color="#3b82f6" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Invoices" value={stats.totalInvoices} icon={DescriptionIcon} color="#8b5cf6" />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #f0f0f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Current Month Overview</Typography>
            <Box sx={{ height: 350 }}>
              {getChartData().length > 0 ? (
                <MuiBarChart
                  dataset={getChartData()}
                  xAxis={[{ scaleType: 'band', dataKey: 'name' }]}
                  series={[
                    { dataKey: 'incomes', label: 'Income', color: '#10b981' },
                    { dataKey: 'expenses', label: 'Expense', color: '#ef4444' },
                  ]}
                  borderRadius={8}
                  margin={{ top: 20, bottom: 30, left: 40, right: 10 }}
                />
              ) : (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Typography color="text.secondary">No data for current month</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '16px', border: '1px solid #f0f0f0' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Expenses by Category</Typography>
            <Box sx={{ height: 350, display: 'flex', justifyContent: 'center' }}>
              {getCategoryData().length > 0 ? (
                <MuiPieChart
                  series={[{
                    data: getCategoryData().map((d, i) => ({ id: i, value: d.value, label: d.name })),
                    innerRadius: 70,
                    paddingAngle: 5,
                    cornerRadius: 5,
                  }]}
                  slotProps={{ legend: { hidden: true } }}
                />
              ) : (
                <Typography sx={{ mt: 10 }} color="text.secondary">No expenses this month</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Invoice Table with Filters */}
      <Paper elevation={0} sx={{ borderRadius: '16px', border: '1px solid #f0f0f0', overflow: 'hidden' }}>
        <Box sx={{ p: 3, backgroundColor: '#ffffff' }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Invoice History ({invoices.length} invoices)
            </Typography>
            
            <Stack direction="row" spacing={2}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Month</InputLabel>
                <Select
                  value={invoiceFilter.month}
                  label="Month"
                  onChange={(e) => setInvoiceFilter({ ...invoiceFilter, month: e.target.value })}
                >
                  <MenuItem value="all">All Months</MenuItem>
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
              
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Year</InputLabel>
                <Select
                  value={invoiceFilter.year}
                  label="Year"
                  onChange={(e) => setInvoiceFilter({ ...invoiceFilter, year: e.target.value })}
                >
                  <MenuItem value="all">All Years</MenuItem>
                  {getAvailableYears().map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {(invoiceFilter.month !== 'all' || invoiceFilter.year !== 'all') && (
                <Button
                  size="small"
                  onClick={() => setInvoiceFilter({ month: 'all', year: 'all' })}
                  sx={{ textTransform: 'none' }}
                >
                  Reset
                </Button>
              )}
            </Stack>
          </Stack>
        </Box>
        <Divider />
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Invoice Name</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Type</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b' }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 600, color: '#64748b' }} align="center">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoices.length > 0 ? (
                invoices.map((inv) => (
                  <TableRow key={inv.invoiceId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>{inv.originalName}</Typography>
                    </TableCell>
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
                    <TableCell sx={{ color: '#64748b' }}>
                      {inv.date && inv.date !== 'Not found' 
                        ? formatDisplayDate(inv.date) 
                        : new Date(inv.uploadTime).toLocaleDateString('he-IL')
                      }
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: inv.type === 'INCOME' ? '#10b981' : '#ef4444' }}>
                      {inv.type === 'INCOME' ? '+' : '-'} ₪{Number(inv.amount).toLocaleString()}
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={
                          inv.status === 'PENDING_UPLOAD' ? 'Uploading...' :
                          inv.status === 'PROCESSING' ? 'Processing...' :
                          inv.status === 'COMPLETED' ? 'Completed' :
                          inv.status === 'FAILED' ? 'Failed' :
                          'Unknown'
                        }
                        size="small" 
                        sx={{ 
                          backgroundColor: 
                            inv.status === 'COMPLETED' ? '#f1f5f9' :
                            inv.status === 'PENDING_UPLOAD' ? '#fef3c7' :
                            inv.status === 'PROCESSING' ? '#dbeafe' :
                            inv.status === 'FAILED' ? '#fee2e2' :
                            '#f3f4f6',
                          color: 
                            inv.status === 'COMPLETED' ? '#475569' :
                            inv.status === 'PENDING_UPLOAD' ? '#92400e' :
                            inv.status === 'PROCESSING' ? '#1e40af' :
                            inv.status === 'FAILED' ? '#991b1b' :
                            '#6b7280',
                          fontWeight: 600, 
                          borderRadius: '6px' 
                        }} 
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No invoices found for selected filters</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};
export default ClientDashboard;