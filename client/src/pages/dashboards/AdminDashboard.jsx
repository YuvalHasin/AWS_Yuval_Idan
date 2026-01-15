import { useEffect, useState } from 'react';
import axios from 'axios';

import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Select,
  MenuItem,
  FormControl,
  FormLabel,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import PeopleIcon from '@mui/icons-material/People';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BadgeIcon from '@mui/icons-material/Badge';

const BASE_URL = "https://0wvwt8s2u8.execute-api.us-east-1.amazonaws.com/dev";
const USERS_API_URL = `${BASE_URL}/users`;
const UPDATE_STATUS_URL = `${BASE_URL}/update-status`;

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ role: '', status: '' });

  // 1. משיכת נתונים ראשונית
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(USERS_API_URL);
      
      const rawBody = response.data.body;
      const dataArray = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;

      const formattedUsers = dataArray.map((user) => ({
        id: user.userId, 
        name: user.name || 'Anonymous',
        email: user.email || 'N/A',
        role: user.assignedCPA ? 'CLIENT' : (user.clientCount ? 'CPA' : 'ADMIN'),
        status: user.status || 'ACTIVE',
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error("שגיאה במשיכת משתמשים:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. פונקציית עדכון סטטוס (Toggle)
  const handleToggleBan = async (user) => {
    const newStatus = user.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
    
    try {
      await axios.post(UPDATE_STATUS_URL, {
        userId: user.id,
        status: newStatus
      });

      setUsers(prevUsers => prevUsers.map(u => 
        u.id === user.id ? { ...u, status: newStatus } : u
      ));
    } catch (error) {
      console.error("שגיאה בעדכון סטטוס המשתמש:", error);
      alert("הפעולה נכשלה. ודאי שיצרת את הנתיב update-status ב-API Gateway ועשית Deploy.");
    }
  };

  // 3. עריכת פרטי משתמש (כרגע מקומי בלבד)
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({ role: user.role, status: user.status });
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
  try {
    // שליחת העדכון ל-AWS
    await axios.post(UPDATE_STATUS_URL, {
      userId: selectedUser.id,
      role: editFormData.role,
      status: editFormData.status
    });

    // רק אם הצליח בשרת - נעדכן את הטבלה שעל המסך
    setUsers(prevUsers => prevUsers.map(u => 
      u.id === selectedUser.id 
        ? { ...u, role: editFormData.role, status: editFormData.status } 
        : u
    ));
    
    setEditDialogOpen(false); // סגירת החלון
    alert("המשתמש עודכן בהצלחה!");
  } catch (error) {
    console.error("Failed to update user:", error);
    alert("שגיאה בעדכון המשתמש. ודאי שה-API Gateway מוגדר נכון.");
  }
};

  const columns = [
    { field: 'name', headerName: 'User Name', flex: 1, minWidth: 150 },
    { field: 'email', headerName: 'Email', flex: 1.2, minWidth: 200 },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: (params) => {
        const roleConfig = {
          CLIENT: { label: 'Client', bgColor: '#e3f2fd', textColor: '#1976d2' },
          CPA: { label: 'CPA', bgColor: '#f3e8ff', textColor: '#7c3aed' },
          ADMIN: { label: 'Admin', bgColor: '#fee2e2', textColor: '#dc2626' },
        };
        const config = roleConfig[params.value] || roleConfig.CLIENT;
        return (
          <Chip label={config.label} size="small" sx={{ bgcolor: config.bgColor, color: config.textColor, fontWeight: 700 }} />
        );
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value === 'BANNED' ? 'Banned' : 'Active'} 
          color={params.value === 'BANNED' ? 'error' : 'success'} 
          variant="outlined" 
          size="small" 
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 110,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleEditUser(params.row)}>
              <EditIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title={params.row.status === 'BANNED' ? "בטל חסימה" : "חסום משתמש"}>
            <IconButton 
              size="small" 
              onClick={() => handleToggleBan(params.row)}
              sx={{ color: params.row.status === 'BANNED' ? '#2e7d32' : '#ef4444' }}
            >
              {params.row.status === 'BANNED' ? <CheckCircleIcon fontSize="small" /> : <BlockIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card sx={{ borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>{title}</Typography>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>{value}</Typography>
          </Box>
          <Box sx={{ p: 1.5, bgcolor: `${color}22`, borderRadius: '12px', color: color }}>
            <Icon />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3, direction: 'ltr' }}> {/* שיניתי ל-ltr כי DataGrid עובד טוב יותר ככה, את הכותרות נהפוך ב-CSS אם צריך */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>System Administration 🔧</Typography>
        <Typography variant="body1" color="textSecondary">Manage system users and security settings</Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <StatCard title="Total Users" value={users.length} icon={PeopleIcon} color="#3498db" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Active Clients" value={users.filter(u => u.role === 'CLIENT').length} icon={BadgeIcon} color="#f59e0b" />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard title="Total CPAs" value={users.filter(u => u.role === 'CPA').length} icon={VerifiedUserIcon} color="#8b5cf6" />
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: '16px' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e5e7eb' }}>
          <Typography variant="h6" fontWeight={700}>User Management</Typography>
        </Box>
        <Box sx={{ height: 500, width: '100%' }}>
          <DataGrid rows={users} columns={columns} loading={loading} pageSizeOptions={[5, 10]} initialState={{ pagination: { paginationModel: { pageSize: 10 } } }} />
        </Box>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <FormLabel>Role</FormLabel>
              <Select value={editFormData.role} onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}>
                <MenuItem value="CLIENT">Client</MenuItem>
                <MenuItem value="CPA">CPA</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveUser}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminDashboard;