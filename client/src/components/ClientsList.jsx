import { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Card, Typography, Stack, Chip, IconButton, Tooltip, CircularProgress } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';
import { useAuth } from '../context/AuthContext';

const CPA_CLIENTS_API = "https://0wvwt8s2u8.execute-api.us-east-1.amazonaws.com/dev/CPA-clients";

const ClientList = () => {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
  if (!user?.userId) return;
  try {
    setLoading(true);
    const url = `${CPA_CLIENTS_API}?cpaId=${user.userId}`;
    const response = await axios.get(url);
    
    // שליפת הנתונים מתוך Items אם הם שם, או ישירות מה-data
    const clientsData = response.data.Items || (Array.isArray(response.data) ? response.data : []);
    
    setClients(clientsData.map(client => ({
      id: client.userId,
      name: client.name || 'Anonymous',
      email: client.email || 'N/A',
      status: client.status || 'ACTIVE',
      lastUpload: client.createdAt || client.lastUpload || client.updatedAt || null,
      docsCount: client.docsCount || 0,
    })));
  } catch (error) {
    console.error("Error fetching CPA clients:", error);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { fetchClients(); }, [user]);

  const columns = [
    { 
      field: 'name', 
      headerName: 'Client Name', 
      width: 200, 
      renderCell: (params) => (
        <Stack spacing={0.3} sx={{ direction: 'ltr' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{params.row?.name || 'Anonymous'}</Typography>
          <Typography variant="caption" color="textSecondary">{params.row?.email || 'N/A'}</Typography>
        </Stack>
      )
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 150, 
      renderCell: (params) => (
        <Chip 
          label={(params.row?.status || 'ACTIVE').toUpperCase()} 
          color={(params.row?.status || '').toUpperCase() === 'ACTIVE' ? 'success' : 'warning'} 
          variant="outlined" 
          size="small" 
        />
      )
    },
   {
  field: 'lastUpload',
  headerName: 'Last Activity',
  width: 150,
  align: 'center',
  headerAlign: 'center',
  renderCell: (params) => {
    const dateVal = params.value;
    if (!dateVal) return <Typography variant="body2" color="textSecondary">No Activity</Typography>;

    const date = new Date(dateVal);
    return (
      <Typography variant="body2" sx={{ color: '#6b7280' }}>
        {isNaN(date.getTime()) ? "No Activity" : date.toLocaleDateString('en-US')}
      </Typography>
    );
  }
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
      )
    },
  ];

  return (
    <Box sx={{ p: 4, width: '100%', direction: 'ltr' }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>My Clients Overview</Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Full data view for clients assigned via Load Balancing algorithm.
      </Typography>
      <Card sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
           <Typography variant="caption">Total: {clients.length} clients</Typography>
          {loading && <CircularProgress size={20} />}
        </Box>
        <Box sx={{ height: 650 }}>
          <DataGrid 
            rows={clients} 
            columns={columns} 
            loading={loading} 
            sx={{ 
                border: 'none',
                '& .MuiDataGrid-columnHeader': { bgcolor: '#f8f9fa', fontWeight: 'bold' }
            }} 
          />
        </Box>
      </Card>
    </Box>
  );
};

export default ClientList;