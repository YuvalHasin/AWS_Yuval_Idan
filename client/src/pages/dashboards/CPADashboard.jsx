import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box, Grid, Card, CardContent, Typography, Stack, Chip, IconButton, Tooltip, CircularProgress,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { useAuth } from '../../context/AuthContext';

const CPA_CLIENTS_API = `https://0wvwt8s2u8.execute-api.us-east-1.amazonaws.com/dev/CPA-clients`;

const CPADashboard = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    if (!user?.userId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${CPA_CLIENTS_API}?cpaId=${user.userId}`);
      
      // שליפת הנתונים בצורה בטוחה מה-Proxy Integration
      const rawData = response.data.Items || (Array.isArray(response.data) ? response.data : []);
      
      const formattedClients = rawData.map((client) => ({
        // מזהה ייחודי חובה לכל שורה למניעת שגיאת GridCell
        id: client.userId || `temp-${Math.random()}`, 
        name: client.name || 'Anonymous',
        businessName: client.businessName || 'N/A',
        email: client.email || 'N/A',
        status: client.status || 'ACTIVE',
        // הגנה על שדה התאריך למניעת קריסה ב-format
        lastUpload: client.lastUpload || client.createdAt || null, 
        docsCount: client.docsCount || 0,
      }));

      setClients(formattedClients);
    } catch (error) {
      console.error("Error fetching CPA clients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [user]);

  const columns = [
    {
      field: 'name',
      headerName: 'Client Name',
      width: 200,
      renderCell: (params) => (
        <Stack spacing={0.3} sx={{ direction: 'ltr' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{params.row.name}</Typography>
          <Typography variant="caption" color="textSecondary">{params.row.email}</Typography>
        </Stack>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => {
        const status = (params.value || 'ACTIVE').toUpperCase();
        const color = status === 'ACTIVE' || status === 'SUCCESS' ? 'success' : 'warning';
        return <Chip label={status} color={color} variant="outlined" size="small" />;
      },
    },
    {
      field: 'lastUpload',
      headerName: 'Last Activity',
      width: 150,
      // תיקון שגיאת valueFormatter: בדיקת תקינות הערך לפני הרצה
      valueFormatter: (value) => {
        if (!value) return 'N/A';
        try {
          return new Date(value).toLocaleDateString('en-US');
        } catch (e) {
          return 'Invalid Date';
        }
      },
    },
    {
      field: 'docsCount',
      headerName: 'Docs',
      width: 100,
      align: 'center',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: params.value === 0 ? 'error.main' : 'primary.main' }}>
          {params.value || 0}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="View Files">
            <IconButton size="small" color="primary"><VisibilityIcon sx={{ fontSize: '1.1rem' }} /></IconButton>
          </Tooltip>
          <Tooltip title="Generate Report">
            <IconButton size="small" sx={{ color: '#22c55e' }}>
              <DescriptionIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  let totalDocs = 0;
  clients.forEach(client => {
    totalDocs += (client.docsCount || 0);
  });

  // כרטיסי סטטיסטיקה
  const statsCards = [
    { title: 'Total Clients', value: clients.length, icon: PeopleIcon, color: '#3498db', bgColor: '#e3f2fd' },
    { title: 'Reports Pending', value: clients.filter(c => c.status === 'Pending').length, icon: WarningIcon, color: '#f59e0b', bgColor: '#fffbeb' },
    { title: 'Docs to Review', value: totalDocs, icon: AssessmentIcon, color: '#ef4444', bgColor: '#fef2f2' },
    { title: '?', value: ``, icon: TrendingUpIcon, color: '#22c55e', bgColor: '#f0fdf4' },
  ];

  const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
    <Card sx={{ bgcolor: bgColor, transition: '0.3s', '&:hover': { transform: 'translateY(-4px)' } }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" color="textSecondary" fontWeight={600}>{title}</Typography>
            <Typography variant="h4" fontWeight={800} color={color}>{value}</Typography>
          </Box>
          <Icon sx={{ fontSize: 40, color: color, opacity: 0.7 }} />
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 4, width: '100%', direction: 'ltr' }}>
      <Typography variant="h3" fontWeight={800} sx={{ mb: 1 }}>Accountant Portal 👨‍💼</Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>Managing assigned clients via DynamoDB Filter</Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}><StatCard {...card} /></Grid>
        ))}
      </Grid>

      <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={700}>My Clients</Typography>
          {loading && <CircularProgress size={24} />}
        </Box>
        <Box sx={{ height: 500 }}>
          <DataGrid rows={clients} columns={columns} loading={loading} sx={{ border: 'none' }} />
        </Box>
      </Card>
    </Box>
  );
};

export default CPADashboard;