import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  TextField, Box, Grid, Card, CardContent, Typography, Stack, Chip, 
  IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, Select, MenuItem, FormControl, FormLabel 
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import PeopleIcon from '@mui/icons-material/People';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

// שימוש במשתנה סביבה - וודא שהוא מוגדר ב-.env ללא / בסוף
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://0wvwt8s2u8.execute-api.us-east-1.amazonaws.com/dev";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ role: '', status: '' });
  const [newUserFormData, setNewUserFormData] = useState({ 
    name: '', email: '', password: '', userType: 'CLIENT' 
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // GET request - userId passes as param for 'Simple Request'
      const response = await axios.get(`${API_BASE_URL}/users`, {
        params: { userId: 'idan' } 
      });
      
      const rawBody = response.data.body;
      const dataArray = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;

      const formattedUsers = dataArray.map((user) => ({
        id: user.userId, 
        name: user.name || 'Anonymous',
        email: user.email || 'N/A',
        role: user.userType || 'CLIENT',
        status: user.status || 'ACTIVE',
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async () => {
    try {
      // POST request - No custom headers to avoid CORS
      await axios.post(`${API_BASE_URL}/add-user`, {
        name: newUserFormData.name,
        email: newUserFormData.email,
        password: newUserFormData.password,
        userType: newUserFormData.userType
      });

      setAddDialogOpen(false);
      setNewUserFormData({ name: '', email: '', password: '', userType: 'CLIENT' });
      await fetchUsers();
      alert("User added successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Error adding user");
    }
  };

 const handleToggleBan = async (user) => {
    const newStatus = user.status === 'BANNED' ? 'ACTIVE' : 'BANNED';
    
    // הדפסה לבדיקה: מה אנחנו שולחים ולאיזה URL?
    console.log("--- Starting Status Update ---");
    console.log("Target URL:", `${API_BASE_URL}/update-status`);
    console.log("Payload:", { userId: user.id, status: newStatus });

    try {
      const response = await axios.post(`${API_BASE_URL}/update-status`, {
        userId: user.id,
        status: newStatus
      });

      // הדפסה במקרה של הצלחה
      console.log("Update Successful! Server response:", response.data);

      setUsers(prevUsers => prevUsers.map(u => 
        u.id === user.id ? { ...u, status: newStatus } : u
      ));
      
    } catch (error) {
      // הדפסת שגיאה מפורטת - כאן נראה אם זה CORS או משהו אחר
      console.error("!!! Update Failed !!!");
      
      if (error.response) {
        // השרת ענה, אבל עם שגיאה (למשל 400 או 500)
        console.error("Server responded with status:", error.response.status);
        console.error("Error data:", error.response.data);
      } else if (error.request) {
        // הבקשה נשלחה אבל לא התקבלה תשובה (אופייני ל-CORS)
        console.error("No response received. This is likely a CORS block or Network issue.");
        console.error("Request details:", error.request);
      } else {
        console.error("Error setting up the request:", error.message);
      }

      alert("Status update failed. Open the browser Console (F12) to see the exact error.");
    }
  };

  const handleSaveUser = async () => {
    try {
      await axios.post(`${API_BASE_URL}/update-status`, {
        userId: selectedUser.id,
        role: editFormData.role,
        status: editFormData.status
      });

      setUsers(prevUsers => prevUsers.map(u => 
        u.id === selectedUser.id ? { ...u, role: editFormData.role, status: editFormData.status } : u
      ));
      setEditDialogOpen(false);
      alert("User updated successfully!");
    } catch (error) {
      console.error("Update failed");
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({ role: user.role, status: user.status });
    setEditDialogOpen(true);
  };

  // --- UI Configuration ---
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
        return <Chip label={config.label} size="small" sx={{ bgcolor: config.bgColor, color: config.textColor, fontWeight: 700 }} />;
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value === 'BANNED' ? 'Banned' : 'Active'} color={params.value === 'BANNED' ? 'error' : 'success'} variant="outlined" size="small" />
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 110,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => handleEditUser(params.row)}><EditIcon fontSize="small" color="primary" /></IconButton></Tooltip>
          <Tooltip title={params.row.status === 'BANNED' ? "Active" : "Ban"}><IconButton size="small" onClick={() => handleToggleBan(params.row)} sx={{ color: params.row.status === 'BANNED' ? '#2e7d32' : '#ef4444' }}>{params.row.status === 'BANNED' ? <CheckCircleIcon fontSize="small" /> : <BlockIcon fontSize="small" />}</IconButton></Tooltip>
        </Stack>
      ),
    },
  ];

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <Card sx={{ borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box><Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>{title}</Typography><Typography variant="h4" sx={{ fontWeight: 800 }}>{value}</Typography></Box>
          <Box sx={{ p: 1.5, bgcolor: `${color}22`, borderRadius: '12px', color: color }}><Icon /></Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3, direction: 'ltr' }}>
      <Box sx={{ mb: 4 }}><Typography variant="h4" sx={{ fontWeight: 800 }}>System Administration 🔧</Typography></Box>

      <Button variant="contained" color="primary" startIcon={<PeopleIcon />} onClick={() => setAddDialogOpen(true)} sx={{ mb: 2 }}>Add New User</Button>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}><StatCard title="Total Users" value={users.length} icon={PeopleIcon} color="#3498db" /></Grid>
        <Grid item xs={12} sm={4}><StatCard title="Active Clients" value={users.filter(u => u.role === 'CLIENT').length} icon={BadgeIcon} color="#f59e0b" /></Grid>
        <Grid item xs={12} sm={4}><StatCard title="Total CPAs" value={users.filter(u => u.role === 'CPA').length} icon={VerifiedUserIcon} color="#8b5cf6" /></Grid>
      </Grid>

      <Card sx={{ borderRadius: '16px' }}>
        <Box sx={{ p: 3, borderBottom: '1px solid #e5e7eb' }}><Typography variant="h6" fontWeight={700}>User Management</Typography></Box>
        <Box sx={{ height: 500, width: '100%' }}><DataGrid rows={users} columns={columns} loading={loading} /></Box>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700 }}>Add New System User</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Full Name" fullWidth value={newUserFormData.name} onChange={(e) => setNewUserFormData({...newUserFormData, name: e.target.value})} />
            <TextField label="Email Address" fullWidth type="email" value={newUserFormData.email} onChange={(e) => setNewUserFormData({...newUserFormData, email: e.target.value})} />
            <TextField label="Password" fullWidth type="password" value={newUserFormData.password} onChange={(e) => setNewUserFormData({...newUserFormData, password: e.target.value})} helperText="Permanent Cognito Password" />
            <FormControl fullWidth><FormLabel sx={{ mb: 1, fontSize: '0.875rem' }}>Role</FormLabel><Select value={newUserFormData.userType} onChange={(e) => setNewUserFormData({...newUserFormData, userType: e.target.value})}><MenuItem value="CLIENT">Client</MenuItem><MenuItem value="CPA">CPA</MenuItem><MenuItem value="ADMIN">Admin</MenuItem></Select></FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}><Button onClick={() => setAddDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleAddUser} disabled={!newUserFormData.name || !newUserFormData.email || !newUserFormData.password}>Create User</Button></DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Edit User Role</DialogTitle>
        <DialogContent><Stack spacing={3} sx={{ mt: 1 }}><FormControl fullWidth><FormLabel>Role</FormLabel><Select value={editFormData.role} onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}><MenuItem value="CLIENT">Client</MenuItem><MenuItem value="CPA">CPA</MenuItem><MenuItem value="ADMIN">Admin</MenuItem></Select></FormControl></Stack></DialogContent>
        <DialogActions><Button onClick={() => setEditDialogOpen(false)}>Cancel</Button><Button variant="contained" onClick={handleSaveUser}>Save</Button></DialogActions>
      </Dialog>
    </Box>
  );
};
export default AdminDashboard;