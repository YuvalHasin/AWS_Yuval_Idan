import { useState } from 'react';
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
import PeopleIcon from '@mui/icons-material/People';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import GradeIcon from '@mui/icons-material/Grade';

const AdminDashboard = () => {
  // Mock data for users - Initialize with state
  const [mockUsers, setMockUsers] = useState([
    {
      id: 1,
      name: 'דוד כהן',
      email: 'david.cohen@example.com',
      role: 'CLIENT',
      status: 'Active',
      joinDate: '2024-01-01',
    },
    {
      id: 2,
      name: 'שרה לוי',
      email: 'sarah.levi@example.com',
      role: 'CPA',
      status: 'Active',
      joinDate: '2023-11-15',
    },
    {
      id: 3,
      name: 'יוסף גרין',
      email: 'yosef.green@example.com',
      role: 'CLIENT',
      status: 'Active',
      joinDate: '2024-01-10',
    },
    {
      id: 4,
      name: 'רחל מזור',
      email: 'rachel.mazor@example.com',
      role: 'ADMIN',
      status: 'Active',
      joinDate: '2023-09-20',
    },
    {
      id: 5,
      name: 'אברהם רוביצ׳',
      email: 'abraham.rubic@example.com',
      role: 'CPA',
      status: 'Active',
      joinDate: '2023-12-05',
    },
    {
      id: 6,
      name: 'מרים אלמוג',
      email: 'miriam.almog@example.com',
      role: 'CLIENT',
      status: 'Active',
      joinDate: '2024-01-18',
    },
  ]);

  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    role: '',
    status: '',
  });

  // Calculate dynamic statistics
  const totalUsers = mockUsers.length;
  const totalClients = mockUsers.filter(u => u.role === 'CLIENT').length;
  const totalCPAs = mockUsers.filter(u => u.role === 'CPA').length;
  const systemHealth = 'Good';

  // System stats
  const systemStats = [
     {
      title: 'Total Users',
      value: totalUsers,
      icon: PeopleIcon,
      color: '#3498db',
      bgColor: '#e3f2fd',
    },
    {
      title: 'Total Clients',
      value: totalClients,
      icon: PeopleIcon,
      color: '#f59e0b',
      bgColor: '#fffbeb',
    },
    {
      title: 'Total CPAs',
      value: totalCPAs,
      icon: VerifiedUserIcon,
      color: '#8b5cf6',
      bgColor: '#f3e8ff',
    },
  ];

  // Handle Edit User
  const handleEditUser = (userId) => {
    const user = mockUsers.find(u => u.id === userId);
    setSelectedUser(user);
    setEditFormData({
      role: user.role,
      status: user.status,
    });
    setEditDialogOpen(true);
  };

  // Handle Save User Changes
  const handleSaveUser = () => {
    setMockUsers(
      mockUsers.map(u =>
        u.id === selectedUser.id
          ? { ...u, role: editFormData.role, status: editFormData.status }
          : u
      )
    );
    setEditDialogOpen(false);
    setSelectedUser(null);
  };

  // Handle Ban User (Show Confirmation)
  const handleBanUser = (userId) => {
    const user = mockUsers.find(u => u.id === userId);
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  // Handle Confirm Ban
  const handleConfirmBan = () => {
    setMockUsers(
      mockUsers.map(u =>
        u.id === selectedUser.id
          ? { ...u, status: 'Banned' }
          : u
      )
    );
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  // DataGrid columns with proper RTL alignment
  const columns = [
    {
      field: 'name',
      headerName: 'שם משתמש',
      width: 180,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: '#1a202c',
            direction: 'rtl',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
          }}
        >
          {params.row.name}
        </Typography>
      ),
    },
    {
      field: 'email',
      headerName: 'דוא״ל',
      width: 220,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            color: '#4b5563',
            direction: 'ltr',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
          }}
        >
          {params.row.email}
        </Typography>
      ),
    },
    {
      field: 'role',
      headerName: 'תפקיד',
      width: 130,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const roleConfig = {
          CLIENT: { label: 'Client', bgColor: '#e3f2fd', textColor: '#1976d2' },
          CPA: { label: 'CPA', bgColor: '#f3e8ff', textColor: '#7c3aed' },
          ADMIN: { label: 'Admin', bgColor: '#fee2e2', textColor: '#dc2626' },
        };
        const config = roleConfig[params.row.role];
        return (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            <Chip
              label={config.label}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 28,
                backgroundColor: config.bgColor,
                color: config.textColor,
                border: `1.5px solid ${config.textColor}`,
              }}
            />
          </Box>
        );
      },
    },
    {
      field: 'status',
      headerName: 'סטטוס',
      width: 120,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const statusConfig = {
          Active: { label: 'פעיל ✓', bgColor: '#dcfce7', textColor: '#166534' },
          Banned: { label: 'חסום ✕', bgColor: '#fee2e2', textColor: '#991b1b' },
        };
        const config = statusConfig[params.row.status];
        return (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            <Chip
              label={config.label}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 28,
                backgroundColor: config.bgColor,
                color: config.textColor,
                border: `1.5px solid ${config.textColor}`,
              }}
            />
          </Box>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'פעולות',
      width: 150,
      sortable: false,
      align: 'left',
      headerAlign: 'left',
      renderCell: (params) => (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: 0.5,
            width: '100%',
            height: '100%',
          }}
        >
          <Tooltip title="Edit User">
            <IconButton
              size="small"
              onClick={() => handleEditUser(params.row.id)}
              sx={{
                color: '#3498db',
                '&:hover': { bgcolor: 'rgba(52, 152, 219, 0.1)' },
              }}
            >
              <EditIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ban User">
            <IconButton
              size="small"
              onClick={() => handleBanUser(params.row.id)}
              sx={{
                color: '#ef4444',
                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' },
              }}
            >
              <BlockIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  // StatCard component
  const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
    <Card
      sx={{
        bgcolor: bgColor,
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
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: '#6b7280',
                  fontWeight: 600,
                  mb: 0.5,
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: color,
                }}
              >
                {value}
              </Typography>
            </Box>
            <Box
              sx={{
                width: 56,
                height: 56,
                bgcolor: `${color}22`,
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon sx={{ fontSize: 32, color: color }} />
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box
      sx={{
        width: '100%',
        direction: 'rtl',
        display: 'flex',
        flexDirection: 'column',
        p: 3,
      }}
    >
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            color: '#1a202c',
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            mb: 1,
          }}
        >
          System Administration 🔧
        </Typography>
        <Typography variant="body1" sx={{ color: '#6b7280' }}>
          Monitor and manage system users, roles, and security settings
        </Typography>
      </Box>

      {/* System Stats Grid */}
      <Box sx={{ mb: 4, width: '100%' }}>
        <Grid container spacing={3}>
          {systemStats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <StatCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                bgColor={stat.bgColor}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* User Management Table Section */}
      <Box sx={{ width: '100%', flexGrow: 1 }}>
        <Card
          sx={{
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(145, 158, 171, 0.2)',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          {/* Table Header */}
          <Box sx={{ p: 3, borderBottom: '1px solid #e5e7eb' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#1a202c' }}>
              ניהול משתמשים
            </Typography>
          </Box>

          {/* DataGrid */}
          <Box sx={{ flex: 1, bgcolor: '#ffffff', direction: 'rtl' }}>
            <DataGrid
              rows={mockUsers}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[5, 10, 20]}
              checkboxSelection={false}
              disableSelectionOnClick
              pageSizeOptions={[5, 10, 20]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10, page: 0 },
                },
              }}
              sx={{
                border: 'none',
                direction: 'rtl',
                '& .MuiDataGrid-root': {
                  fontSize: '0.875rem',
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #e5e7eb',
                  paddingY: '12px',
                  direction: 'inherit',
                },
                '& .MuiDataGrid-columnHeader': {
                  bgcolor: '#f9fafb',
                  color: '#374151',
                  fontWeight: 700,
                  borderBottom: '2px solid #e5e7eb',
                  direction: 'rtl',
                },
                '& .MuiDataGrid-columnHeaderTitleContainer': {
                  justifyContent: 'flex-end',
                  direction: 'rtl',
                  '& .MuiDataGrid-columnHeaderTitle': {
                    textAlign: 'right',
                    direction: 'rtl',
                  },
                },
                '& .MuiDataGrid-row': {
                  '&:hover': {
                    bgcolor: '#f3f4f6',
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(52, 152, 219, 0.08) !important',
                    '&:hover': {
                      backgroundColor: 'rgba(52, 152, 219, 0.12) !important',
                    },
                  },
                },
                '& .MuiTablePagination-root': {
                  direction: 'ltr',
                  '& .MuiTablePagination-toolbar': {
                    flexDirection: 'row-reverse',
                  },
                  '& .MuiIconButton-root': {
                    direction: 'ltr',
                  },
                },
                '& .MuiDataGrid-footerContainer': {
                  direction: 'ltr',
                  borderTop: '1px solid #e5e7eb',
                },
              }}
            />
          </Box>
        </Card>
      </Box>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#1a202c' }}>
          עריכת משתמש
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedUser && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: '#374151' }}>
                  שם משתמש
                </Typography>
                <Typography variant="body2" sx={{ color: '#6b7280' }}>
                  {selectedUser.name}
                </Typography>
              </Box>

              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>תפקיד</FormLabel>
                <Select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  sx={{ direction: 'rtl' }}
                >
                  <MenuItem value="CLIENT">Client</MenuItem>
                  <MenuItem value="CPA">CPA</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>סטטוס</FormLabel>
                <Select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  sx={{ direction: 'rtl' }}
                >
                  <MenuItem value="Active">פעיל</MenuItem>
                  <MenuItem value="Banned">חסום</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setEditDialogOpen(false)}
            sx={{ color: '#6b7280', textTransform: 'none', fontWeight: 600 }}
          >
            ביטול
          </Button>
          <Button
            onClick={handleSaveUser}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            שמור שינויים
          </Button>
        </DialogActions>
      </Dialog>

      {/* Ban Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: '#1a202c' }}>
          אישור חסימת משתמש
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography variant="body2" sx={{ color: '#6b7280' }}>
            האם אתה בטוח שברצונך לחסום את המשתמש <strong>{selectedUser?.name}</strong>?
            <br />
            המשתמש לא יוכל להתחבר לחשבון שלו.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ color: '#6b7280', textTransform: 'none', fontWeight: 600 }}
          >
            ביטול
          </Button>
          <Button
            onClick={handleConfirmBan}
            variant="contained"
            sx={{
              background: '#ef4444',
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { background: '#dc2626' },
            }}
          >
            חסום משתמש
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
export default AdminDashboard;