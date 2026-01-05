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
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DescriptionIcon from '@mui/icons-material/Description';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

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

  // Calculate stats
  const expenses = invoices.filter(inv => inv.type !== 'INCOME').reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const incomes = invoices.filter(inv => inv.type === 'INCOME').reduce((sum, inv) => sum + (inv.amount || 0), 0);
  const netProfit = incomes - expenses;
  const lastUploadDate = invoices.length > 0 
    ? new Date(invoices[0].uploadTime).toLocaleDateString('he-IL') 
    : "-";

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
    <Card
      sx={{
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        border: `1px solid rgba(145, 158, 171, 0.2)`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.12)',
          transform: 'translateY(-4px)',
        },
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Stack spacing={0.5}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                {title}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: color }}>
                ₪{value.toLocaleString('he-IL')}
              </Typography>
            </Stack>
            <Box
              sx={{
                width: 56,
                height: 56,
                background: `linear-gradient(135deg, ${color}22 0%, ${color}11 100%)`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon sx={{ fontSize: 32, color: color }} />
            </Box>
          </Stack>

          {trend && (
            <Stack direction="row" alignItems="center" spacing={0.5}>
              {trend === 'up' ? (
                <ArrowUpwardIcon sx={{ fontSize: 16, color: '#22c55e' }} />
              ) : (
                <ArrowDownwardIcon sx={{ fontSize: 16, color: '#ef4444' }} />
              )}
              <Typography variant="caption" sx={{ color: trend === 'up' ? '#22c55e' : '#ef4444' }}>
                {trendValue}
              </Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box
      sx={{
        direction: 'rtl',
        width: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header Section */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 2, sm: 3, md: 4 }, mb: 4 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          spacing={2}
        >
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 1,
                color: '#1a202c',
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
              }}
            >
              ברוכים הבאים בחזרה 👋
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
              הנה סיכום של הוצאותיך והכנסותיך
            </Typography>
          </Box>
          <Link to="/upload" style={{ textDecoration: 'none' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                px: 3,
                py: 1.2,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2980b9 0%, #1f618d 100%)',
                  boxShadow: '0 6px 16px rgba(52, 152, 219, 0.4)',
                },
                whiteSpace: 'nowrap',
              }}
            >
              העלה חשבונית חדשה
            </Button>
          </Link>
        </Stack>
      </Box>

      {/* Stats Grid */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, mb: 4, width: '100%' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4} lg={3}>
            <StatCard
              title="סה״כ הוצאות"
              value={expenses}
              icon={TrendingDownIcon}
              color="#ef4444"
              trend="down"
              trendValue="+2.5% מהחודש הקודם"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <StatCard
              title="סה״כ הכנסות"
              value={incomes}
              icon={TrendingUpIcon}
              color="#22c55e"
              trend="up"
              trendValue="+4.2% מהחודש הקודם"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <StatCard
              title="רווח נקי"
              value={netProfit}
              icon={DescriptionIcon}
              color={netProfit >= 0 ? '#3498db' : '#f59e0b'}
              trend={netProfit >= 0 ? 'up' : 'down'}
              trendValue={netProfit >= 0 ? 'חיובי ✓' : 'שלילי ⚠'}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={4} lg={3}>
            <StatCard
              title="ההעלאה האחרונה"
              value={invoices.length}
              icon={AccessTimeIcon}
              color="#9333ea"
              trendValue={lastUploadDate}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Charts Section */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, mb: 4, width: '100%' }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card
              sx={{
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                border: `1px solid rgba(145, 158, 171, 0.2)`,
                height: '100%',
              }}
            >
              <Box sx={{ p: 3, borderBottom: '1px solid #e5e7eb' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a202c' }}>
                  הוצאות vs הכנסות
                </Typography>
              </Box>
              <CardContent>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ color: 'text.secondary' }}>
                    📊 תרשים יוצג כאן (בהכנה)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card
              sx={{
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                border: `1px solid rgba(145, 158, 171, 0.2)`,
                height: '100%',
              }}
            >
              <Box sx={{ p: 3, borderBottom: '1px solid #e5e7eb' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a202c' }}>
                  סיכום לפי קטגוריה
                </Typography>
              </Box>
              <CardContent>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography sx={{ color: 'text.secondary' }}>
                    🥧 תרשים עוגה יוצג כאן (בהכנה)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Table Section */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 2, sm: 3, md: 4 }, width: '100%', flexGrow: 1 }}>
        <Card
          sx={{
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `1px solid rgba(145, 158, 171, 0.2)`,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <Box sx={{ p: 3, borderBottom: '1px solid #e5e7eb' }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
              spacing={2}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a202c' }}>
                היסטוריית העלאות
              </Typography>
              <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    sx={{ direction: 'rtl' }}
                  >
                    {[...Array(12)].map((_, i) => (
                      <MenuItem key={i} value={i}>
                        {new Date(2024, i).toLocaleString('he-IL', { month: 'long' })}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    sx={{ direction: 'rtl' }}
                  >
                    {[2024, 2025, 2026].map((year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : invoices.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <DescriptionIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
                עדיין אין חשבוניות במערכת
              </Typography>
              <Link to="/upload" style={{ textDecoration: 'none' }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  sx={{
                    background: '#3498db',
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { background: '#2980b9' },
                  }}
                >
                  העלה חשבונית ראשונה
                </Button>
              </Link>
            </Box>
          ) : (
            <TableContainer sx={{ overflowX: 'auto', flex: 1 }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <TableCell
                      align="center"
                      sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#374151', py: 2.5 }}
                    >
                      שם הקובץ
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#374151', py: 2.5 }}
                    >
                      סוג
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#374151', py: 2.5 }}
                    >
                      סכום
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#374151', py: 2.5 }}
                    >
                      תאריך
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 700, fontSize: '0.875rem', color: '#374151', py: 2.5 }}
                    >
                      סטטוס
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((inv, index) => (
                    <TableRow
                      key={inv.invoiceId}
                      sx={{
                        '&:hover': { backgroundColor: '#f9fafb' },
                        borderBottom: '1px solid #e5e7eb',
                        '&:last-child': { borderBottom: 'none' },
                      }}
                    >
                      <TableCell align="right" sx={{ py: 2.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#1f2937' }}>
                          {inv.originalName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 2.5 }}>
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 2,
                            py: 0.75,
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: inv.type === 'INCOME' ? '#dcfce7' : '#fee2e2',
                            color: inv.type === 'INCOME' ? '#166534' : '#991b1b',
                          }}
                        >
                          {inv.type === 'INCOME' ? '📈 הכנסה' : '📉 הוצאה'}
                        </Box>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 2.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1f2937' }}>
                          ₪{(inv.amount || 0).toLocaleString('he-IL')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 2.5 }}>
                        <Typography variant="body2" sx={{ color: '#6b7280' }}>
                          {new Date(inv.uploadTime).toLocaleDateString('he-IL')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 2.5 }}>
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 2,
                            py: 0.5,
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: '#dcfce7',
                            color: '#166534',
                          }}
                        >
                          ✓ הושלם
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      </Box>
    </Box>
  );
};
export default ClientDashboard;