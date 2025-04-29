import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/landing/LandingPage';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import ProtectedRoute from './ProtectedRoute';
import AccountPage from './components/account/AccountPage';
import AdminRoleRequestsPage from './components/admin/AdminRoleRequestsPage';
import DashboardPage from './components/dashboard/DashboardPage';
import SettingsPage from './components/settings/SettingsPage';
import MonitoringPage from './components/monitoring/MonitoringPage';
import DataPage from './components/data/DataPage';
import UsersPage from './components/users/UsersPage';

const AppRouter = () => (
  <Router>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/account" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
      <Route path="/admin/role-requests" element={<ProtectedRoute><AdminRoleRequestsPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="/monitoring" element={<ProtectedRoute><MonitoringPage /></ProtectedRoute>} />
      <Route path="/data" element={<ProtectedRoute><DataPage /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
      <Route
        path="/dashboard/*"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  </Router>
);

export default AppRouter;
