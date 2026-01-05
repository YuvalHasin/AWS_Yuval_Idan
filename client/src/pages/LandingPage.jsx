import { Box, Button, Container, Grid, Typography, AppBar, Toolbar } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import SecurityIcon from '@mui/icons-material/Security';
import InsightsIcon from '@mui/icons-material/Insights';
import FolderIcon from '@mui/icons-material/Folder';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const LandingPage = () => {
  const features = [
    {
      title: 'Automated Scanning',
      description: 'AI-powered data extraction from invoices and receipts. Upload once, extract instantly.',
      icon: DocumentScannerIcon,
      color: '#3498db',
      bgColor: '#e3f2fd',
    },
    {
      title: 'Secure Cloud',
      description: 'Bank-level security using AWS. Your financial data is encrypted and protected.',
      icon: SecurityIcon,
      color: '#22c55e',
      bgColor: '#f0fdf4',
    },
    {
      title: 'Real-time Insights',
      description: 'Live dashboard for accountants and clients. Track expenses and income instantly.',
      icon: InsightsIcon,
      color: '#f59e0b',
      bgColor: '#fffbeb',
    },
  ];

  const FeatureCard = ({ title, description, icon: Icon, color, bgColor }) => (
    <Box
      sx={{
        p: 4,
        borderRadius: '12px',
        backgroundColor: bgColor,
        border: `1px solid rgba(145, 158, 171, 0.2)`,
        transition: 'all 0.3s ease',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'center',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: '12px',
          backgroundColor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2,
        }}
      >
        <Icon sx={{ fontSize: 36, color: 'white' }} />
      </Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 700,
          color: '#1a202c',
          mb: 1,
        }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: '#6b7280',
          lineHeight: 1.6,
        }}
      >
        {description}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Navigation Bar */}
       <AppBar
        position="fixed"
        sx={{
          backgroundColor: '#ffffff',
          color: '#1a202c',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          zIndex: 100,
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
          {/* Logo */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              textDecoration: 'none',
              color: '#1a202c',
              fontWeight: 800,
              fontSize: '1.25rem',
            }}
            component={RouterLink}
            to="/"
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <FolderIcon sx={{ fontSize: '1.4rem' }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: '#1a202c',
                fontSize: '1.25rem',
                letterSpacing: '0.5px',
              }}
            >
              ScanBook
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box
        sx={{
          minHeight: '90vh',
          background: 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pt: 8,
          px: { xs: 2, sm: 3, md: 4 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative Background Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '-50px',
            right: '-100px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            filter: 'blur(40px)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '-50px',
            left: '-100px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            filter: 'blur(40px)',
          }}
        />

        {/* Content */}
        <Container maxWidth="md" sx={{ zIndex: 2 }}>
          <Box sx={{ textAlign: 'center', color: 'white' }}>
            <Typography
              variant="h2"
              sx={{
                fontWeight: 800,
                mb: 2,
                fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
                letterSpacing: '-1px',
              }}
            >
              ScanBook
            </Typography>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 400,
                mb: 4,
                fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
                opacity: 0.95,
                lineHeight: 1.6,
              }}
            >
              Smart Accounting & Document Management via the Cloud
            </Typography>

            <Typography
              variant="body1"
              sx={{
                mb: 5,
                opacity: 0.85,
                fontSize: { xs: '0.95rem', sm: '1.1rem' },
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.8,
              }}
            >
              Automate your invoicing, streamline document management, and gain real-time insights into your financial health.
            </Typography>

            {/* CTA Button */}
            <Button
              component={RouterLink}
              to="/login"
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              sx={{
                background: 'white',
                color: '#1a2980',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '1.1rem',
                px: 5,
                py: 1.5,
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
                  backgroundColor: '#f9fafb',
                },
              }}
            >
              Login / Get Started
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box
        sx={{
          py: { xs: 8, sm: 10, md: 12 },
          px: { xs: 2, sm: 3, md: 4 },
          backgroundColor: '#ffffff',
        }}
      >
        <Container maxWidth="lg">
          {/* Section Header */}
          <Box sx={{ textAlign: 'center', mb: 8 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: '#1a202c',
                mb: 2,
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
              }}
            >
              Why Choose ScanBook?
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: '#6b7280',
                fontWeight: 400,
                maxWidth: '600px',
                mx: 'auto',
                fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
              }}
            >
              Built for accountants, small businesses, and anyone who needs to manage documents smarter.
            </Typography>
          </Box>

          {/* Features Grid */}
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <FeatureCard
                  title={feature.title}
                  description={feature.description}
                  icon={feature.icon}
                  color={feature.color}
                  bgColor={feature.bgColor}
                />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box
        sx={{
          py: { xs: 8, sm: 10, md: 12 },
          px: { xs: 2, sm: 3, md: 4 },
          background: 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)',
          textAlign: 'center',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative Elements */}
        <Box
          sx={{
            position: 'absolute',
            top: '-50px',
            right: '-100px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.1)',
            filter: 'blur(40px)',
          }}
        />

        <Container maxWidth="md" sx={{ zIndex: 2 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 3,
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
            }}
          >
            Ready to Transform Your Accounting?
          </Typography>

          <Typography
            variant="h6"
            sx={{
              fontWeight: 400,
              mb: 5,
              opacity: 0.9,
              fontSize: { xs: '0.95rem', sm: '1rem', md: '1.1rem' },
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Join thousands of accountants and businesses already using ScanBook to streamline their workflow.
          </Typography>

          <Button
            component={RouterLink}
            to="/login"
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            sx={{
              background: 'white',
              color: '#1a2980',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '1.1rem',
              px: 5,
              py: 1.5,
              borderRadius: '8px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.3)',
                backgroundColor: '#f9fafb',
              },
            }}
          >
            Get Started Now
          </Button>
        </Container>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          py: 4,
          px: { xs: 2, sm: 3, md: 4 },
          backgroundColor: '#f9fafb',
          borderTop: '1px solid #e5e7eb',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" sx={{ color: '#6b7280', mb: 1 }}>
            © 2024 ScanBook. All rights reserved.
          </Typography>
          <Typography variant="caption" sx={{ color: '#9ca3af' }}>
            Secure. Smart. Simple.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};
export default LandingPage;