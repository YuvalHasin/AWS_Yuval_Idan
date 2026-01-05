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
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const CPADashboard = () => {
  // Mock data for clients
  const [mockClients] = useState([
    {
      id: 1,
      name: 'דוד כהן',
      businessName: 'כהן בניין בע"מ',
      email: 'david.cohen@example.com',
      status: 'Active',
      lastUpload: '2024-01-15',
      docsCount: 12,
    },
    {
      id: 2,
      name: 'שרה לוי',
      businessName: 'לוי הנדסה בע"מ',
      email: 'sarah.levi@example.com',
      status: 'Pending',
      lastUpload: '2024-01-10',
      docsCount: 5,
    },
    {
      id: 3,
      name: 'יוסף גרין',
      businessName: 'גרין סחר בע"מ',
      email: 'yosef.green@example.com',
      status: 'Attention',
      lastUpload: '2023-12-20',
      docsCount: 0,
    },
    {
      id: 4,
      name: 'רחל מזור',
      businessName: 'מזור עיצובים בע"מ',
      email: 'rachel.mazor@example.com',
      status: 'Active',
      lastUpload: '2024-01-18',
      docsCount: 8,
    },
    {
      id: 5,
      name: 'אברהם רוביצ׳',
      businessName: 'רוביצ׳ פיתוח תוכנה',
      email: 'abraham.rubic@example.com',
      status: 'Active',
      lastUpload: '2024-01-16',
      docsCount: 15,
    },
    {
      id: 6,
      name: 'מרים אלמוג',
      businessName: 'אלמוג ייעוץ בע"מ',
      email: 'miriam.almog@example.com',
      status: 'Pending',
      lastUpload: '2024-01-12',
      docsCount: 3,
    },
  ]);

  // Stats cards data
  const statsCards = [
    {
      title: 'Total Clients',
      value: mockClients.length,
      icon: PeopleIcon,
      color: '#3498db',
      bgColor: '#e3f2fd',
    },
    {
      title: 'Reports Pending',
      value: mockClients.filter(c => c.status === 'Pending').length,
      icon: WarningIcon,
      color: '#f59e0b',
      bgColor: '#fffbeb',
    },
    {
      title: 'Docs to Review',
      value: mockClients.filter(c => c.status === 'Attention').length,
      icon: AssessmentIcon,
      color: '#ef4444',
      bgColor: '#fef2f2',
    },
    {
      title: 'Monthly Revenue',
      value: '₪12,500',
      icon: TrendingUpIcon,
      color: '#22c55e',
      bgColor: '#f0fdf4',
    },
  ];

  // DataGrid columns with proper RTL alignment (Right to Left order)
  const columns = [
    {
      field: 'name',
      headerName: 'שם הלקוח',
      width: 200,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Stack spacing={0.3} sx={{ width: '100%', direction: 'rtl' }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: '#1a202c',
              direction: 'rtl',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {params.row.name}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: '#6b7280',
              direction: 'ltr',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'block',
            }}
          >
            {params.row.email}
          </Typography>
        </Stack>
      ),
    },
    {
      field: 'businessName',
      headerName: 'שם העסק',
      width: 200,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            color: '#4b5563',
            direction: 'rtl',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%',
          }}
        >
          {params.row.businessName}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'סטטוס',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const statusConfig = {
          Active: { color: 'success', label: 'פעיל ✓' },
          Pending: { color: 'warning', label: 'בהמתנה ⏳' },
          Attention: { color: 'error', label: 'דורש תשומת לב ⚠' },
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
              color={config.color}
              variant="outlined"
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: '0.75rem',
                height: 28,
                direction: 'rtl',
              }}
            />
          </Box>
        );
      },
    },
    {
      field: 'lastUpload',
      headerName: 'העלאה אחרונה',
      width: 150,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            color: '#6b7280',
            direction: 'rtl',
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          {new Date(params.row.lastUpload).toLocaleDateString('he-IL')}
        </Typography>
      ),
    },
    {
      field: 'docsCount',
      headerName: 'מסמכים',
      width: 100,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: params.row.docsCount === 0 ? '#ef4444' : '#3498db',
            }}
          >
            {params.row.docsCount}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'פעולות',
      width: 120,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 0.5,
            width: '100%',
            height: '100%',
          }}
        >
          <Tooltip title="View Files">
            <IconButton
              size="small"
              onClick={() => handleViewFiles(params.row.id)}
              sx={{
                color: '#3498db',
                '&:hover': { bgcolor: 'rgba(52, 152, 219, 0.1)' },
              }}
            >
              <VisibilityIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Generate Report">
            <IconButton
              size="small"
              onClick={() => handleGenerateReport(params.row.id)}
              sx={{
                color: '#22c55e',
                '&:hover': { bgcolor: 'rgba(34, 197, 94, 0.1)' },
              }}
            >
              <DescriptionIcon sx={{ fontSize: '1.1rem' }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const handleViewFiles = (clientId) => {
    console.log(`View files for client ${clientId}`);
    // TODO: Navigate to client files or open modal
  };

  const handleGenerateReport = (clientId) => {
    console.log(`Generate report for client ${clientId}`);
    // TODO: Trigger report generation
  };

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
      }}
    >
      {/* Header Section */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pt: { xs: 2, sm: 3, md: 4 }, mb: 4 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            color: '#1a202c',
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
            mb: 1,
          }}
        >
          Accountant Portal 👨‍💼
        </Typography>
        <Typography variant="body1" sx={{ color: '#6b7280' }}>
          Manage and review your clients' financial documents
        </Typography>
      </Box>

      {/* Stats Cards Grid */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, mb: 4, width: '100%' }}>
        <Grid container spacing={3}>
          {statsCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <StatCard
                title={card.title}
                value={card.value}
                icon={card.icon}
                color={card.color}
                bgColor={card.bgColor}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Clients Table Section */}
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 2, sm: 3, md: 4 }, width: '100%', flexGrow: 1 }}>
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
              סקירת לקוחות
            </Typography>
          </Box>

          {/* DataGrid */}
          <Box sx={{ flex: 1, bgcolor: '#ffffff', direction: 'rtl' }}>
            <DataGrid
              rows={mockClients}
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
    </Box>
  );
};
export default CPADashboard;