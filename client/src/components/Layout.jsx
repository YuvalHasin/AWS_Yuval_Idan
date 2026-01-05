import { useState } from 'react';
import { Outlet, useLocation,useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  useMediaQuery,
  useTheme,
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BarChartIcon from '@mui/icons-material/BarChart';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import LogoutIcon from '@mui/icons-material/Logout';
import FolderIcon from '@mui/icons-material/Folder';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { Link as RouterLink } from 'react-router-dom';

const DRAWER_WIDTH = 280;
const DRAWER_WIDTH_COLLAPSED = 80;

// Helper function to map routes to page titles based on user role
const getPageTitle = (pathname, userRole) => {
  const titleMapCPA = {
    '/dashboard': 'Accountant Portal',
    '/': 'Accountant Portal',
    '/clients': 'Clients Overview',
    '/reports': 'Reports Generation',
    '/statistics': 'Statistics & Analytics',
  };

  const titleMapClient = {
    '/dashboard': 'Dashboard',
    '/': 'Dashboard',
    '/upload': 'Upload Invoice',
    '/statistics': 'Statistics',
  };

  const titleMapAdmin = {
    '/dashboard': 'Admin Dashboard',
    '/': 'Admin Dashboard',
    '/users': 'User Management',
    '/settings': 'System Settings',
    '/statistics': 'All Statistics',
  };

  const titleMap = userRole === 'CPA' ? titleMapCPA : userRole === 'ADMIN' ? titleMapAdmin : titleMapClient;
  return titleMap[pathname] || 'ScanBook';
};

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

 const { userRole, user, logout } = useAuth();
 const userName = user?.username || 'User';
 const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDesktopToggle = () => {
    setDesktopOpen(!desktopOpen);
  };

     
// Define menu items based on role
const getMenuItemsByRole = () => {
  const baseMenus = {
    CLIENT: [
      {
        label: 'Dashboard',
        icon: <DashboardIcon sx={{ color: '#3498db' }} />,
        path: '/dashboard',
      },
      {
        label: 'Upload Invoice',
        icon: <FileUploadIcon sx={{ color: '#22c55e' }} />,
        path: '/upload',
      },
      {
        label: 'Statistics',
        icon: <BarChartIcon sx={{ color: '#8b5cf6' }} />,
        path: '/statistics',
      },
    ],
    CPA: [
      {
        label: 'Dashboard',
        icon: <DashboardIcon sx={{ color: '#3498db' }} />,
        path: '/dashboard',
      },
      {
        label: 'Client List',
        icon: <PeopleIcon sx={{ color: '#f59e0b' }} />,
        path: '/clients',
      },
      {
        label: 'Reports',
        icon: <AssignmentIcon sx={{ color: '#ec4899' }} />,
        path: '/reports',
      },
      {
        label: 'Statistics',
        icon: <BarChartIcon sx={{ color: '#8b5cf6' }} />,
        path: '/statistics',
      },
    ],
    ADMIN: [
      {
        label: 'Dashboard',
        icon: <DashboardIcon sx={{ color: '#3498db' }} />,
        path: '/dashboard',
      },
    ],
  };
  return baseMenus[userRole] || baseMenus.CLIENT;
};

  const menuItems = getMenuItemsByRole();
  const currentDrawerWidth = (isMobile || isTablet) ? DRAWER_WIDTH : (desktopOpen ? DRAWER_WIDTH : DRAWER_WIDTH_COLLAPSED);
  const pageTitle = getPageTitle(location.pathname, userRole);

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo Section - Hide completely when collapsed on desktop */}
      {(desktopOpen || isMobile || isTablet) && (
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            minHeight: '70px',
            boxSizing: 'border-box',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            {/* Logo Icon */}
            <Box
              sx={{
                width: 44,
                height: 44,
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.4rem',
                boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)',
                flexShrink: 0,
              }}
            >
              <FolderIcon sx={{ fontSize: '1.8rem' }} />
            </Box>

            {/* Logo Text */}
            {(desktopOpen || isMobile || isTablet) && (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  color: '#1a202c',
                  fontSize: '1rem',
                  letterSpacing: '0.5px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                ScanBook
              </Typography>
            )}
          </Box>

          {/* Collapse Button (Desktop only) */}
          {!isMobile && !isTablet && (
            <Tooltip title={desktopOpen ? 'Collapse' : 'Expand'}>
              <IconButton
                size="small"
                onClick={handleDesktopToggle}
                sx={{
                  color: '#6b7280',
                  '&:hover': { color: '#3498db' },
                  flexShrink: 0,
                }}
              >
                {desktopOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      {/* Expand Button - Show only when sidebar is collapsed on desktop */}
      {!desktopOpen && !isMobile && !isTablet && (
        <Box
          sx={{
            p: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Tooltip title="Expand sidebar" placement="right">
            <IconButton
              onClick={handleDesktopToggle}
              sx={{
                color: '#3498db',
                '&:hover': { 
                  backgroundColor: 'rgba(52, 152, 219, 0.1)',
                  color: '#2980b9',
                },
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* Menu Items */}
      <List sx={{ flex: 1, px: 1, py: 2, overflow: 'auto' }}>
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Tooltip
              key={index}
              title={!desktopOpen && item.label}
              placement="right"
              disableHoverListener={desktopOpen || isMobile || isTablet}
            >
              <ListItem
                component={RouterLink}
                to={item.path}
                onClick={() => isMobile && setMobileOpen(false)}
                sx={{
                  borderRadius: '10px',
                  mb: 1,
                  px: 2,
                  py: 1.2,
                  color: isActive ? '#3498db' : '#6b7280',
                  backgroundColor: isActive ? 'rgba(52, 152, 219, 0.08)' : 'transparent',
                  transition: 'all 0.3s ease',
                  border: isActive ? '1px solid rgba(52, 152, 219, 0.2)' : '1px solid transparent',
                  justifyContent: desktopOpen ? 'flex-start' : 'center',
                  '&:hover': {
                    backgroundColor: 'rgba(52, 152, 219, 0.08)',
                    color: '#3498db',
                  },
                  textDecoration: 'none',
                  '& .MuiListItemIcon-root': {
                    color: 'inherit',
                    minWidth: 40,
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                {(desktopOpen || isMobile || isTablet) && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: '0.95rem',
                      fontWeight: isActive ? 600 : 500,
                      letterSpacing: '0.3px',
                      noWrap: true,
                    }}
                  />
                )}
              </ListItem>
            </Tooltip>
          );
        })}
      </List>

      {/* Divider */}
      <Divider sx={{ my: 1 }} />
      {/* Logout Button */}
      <Box sx={{ p: 1 }}>
        <Tooltip
          title={!desktopOpen && 'Logout'}
          placement="right"
          disableHoverListener={desktopOpen || isMobile || isTablet}
        >
          <ListItem
            onClick={async () => {
              try {
                await logout();
                navigate('/login');
              } catch (error) {
                console.error('Logout error:', error);
              }
              isMobile && setMobileOpen(false);
            }}
            sx={{
              borderRadius: '10px',
              px: 2,
              py: 1.2,
              color: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.05)',
              transition: 'all 0.3s ease',
              justifyContent: desktopOpen ? 'flex-start' : 'center',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#dc2626',
              },
              '& .MuiListItemIcon-root': {
                color: 'inherit',
                minWidth: 40,
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            {(desktopOpen || isMobile || isTablet) && (
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: 500,
                }}
              />
            )}
          </ListItem>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f9fafb' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: '#f9fafb',
          color: '#1a202c',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          zIndex: theme.zIndex.drawer + 1,
          width: { xs: '100%', sm: '100%', md: `100%` },
          ml: { xs: 0, sm: 0, md: `${currentDrawerWidth}px` },
          borderBottom: '1px solid #e5e7eb',
          transition: 'all 0.3s ease',
        }}
      >
        <Toolbar sx={{ px: { xs: 1, sm: 3 }, minHeight: '64px' }}>
          {/* Hamburger Menu Icon (Mobile only) */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              mr: 2,
              display: { md: 'none' },
              color: '#1a202c',
              '&:hover': {
                backgroundColor: '#f3f4f6',
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Dynamic Page Title */}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: '#1a202c',
              fontSize: '1.1rem',
              display: { xs: 'none', sm: 'block' },
            }}
          >
            {pageTitle}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* User Profile Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: 'white',
                fontWeight: 600,
                fontSize: '1rem',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)',
                },
              }}
            >
              👤
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a202c' }}>
                {userName}
              </Typography>
              <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                {userRole}
              </Typography>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant={isMobile || isTablet ? 'temporary' : 'permanent'}
        open={isMobile || isTablet ? mobileOpen : desktopOpen}
        onClose={handleDrawerToggle}
        sx={{
          width: currentDrawerWidth,
          flexShrink: 0,
          transition: 'width 0.3s ease',
          '& .MuiDrawer-paper': {
            width: currentDrawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e5e7eb',
            mt: { xs: 0, sm: 0, md: '64px' },
            height: { xs: '100%', md: 'calc(100% - 64px)' },
            transition: 'width 0.3s ease',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', sm: '100%', md: `calc(100% - ${currentDrawerWidth}px)` },
          mt: { xs: '64px', sm: '64px', md: '64px' },
          backgroundColor: '#f9fafb',
          height: 'calc(100vh - 64px)',
          transition: 'all 0.3s ease',
          overflow: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <Outlet />
      </Box>

      {/* Mobile Menu Backdrop */}
      {mobileOpen && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: theme.zIndex.drawer - 1,
            display: { md: 'none' },
          }}
          onClick={() => setMobileOpen(false)}
        />
      )}
    </Box>
  );
};
export default Layout;