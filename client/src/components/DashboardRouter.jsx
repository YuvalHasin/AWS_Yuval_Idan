import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../pages/dashboards/AdminDashboard';
import CPADashboard from '../pages/dashboards/CPADashboard';
import ClientDashboard from '../pages/dashboards/ClientDashboard';
import { Box, CircularProgress, Typography } from '@mui/material';

const DashboardRouter = () => {
  // Extract user role and loading status from the AuthContext
  const { userRole, loading } = useAuth();

  // 1. Loading State - Show a spinner while checking auth status with AWS
  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '80vh' 
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // 2. Smart Routing based on the detected User Role
  switch (userRole) {
    case 'ADMIN':
      return <AdminDashboard/>;
      
    case 'CPA':
      return <CPADashboard/>;
      
    case 'CLIENT':
      return <ClientDashboard/>;
      
    default:
      // 3. Default/Error State - If the user has no assigned role
      return (
        <Box sx={{ p: 4, textAlign: 'center', mt: 8 }}>
          <Typography variant="h5" color="error" gutterBottom sx={{ fontWeight: 'bold' }}>
            Access Denied
          </Typography>
          <Typography variant="body1" color="textSecondary">
            No role assigned to this user. Please contact support.
          </Typography>
          {/* For debugging - show the detected role (if any) */}
          <Typography variant="caption" display="block" sx={{ mt: 2 }}>
            Current Role: {userRole || 'None'}
          </Typography>
        </Box>
      );
  }
};
export default DashboardRouter;