import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import UploadPage from './pages/UploadPage';
import DashboardRouter from './components/DashboardRouter';
import LandingPage from './pages/LandingPage';
import ReportsPage from './components/ReportsPage'; 

function App() {
  return (
    <Routes>
      {/* Public Routes (No Layout) */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />  

      {/* Protected Routes (With Layout) */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardRouter />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}
export default App;