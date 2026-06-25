import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Contacts from './pages/Contacts';
import Deals from './pages/Deals';
import Users from './pages/Users';
import Billing from './pages/Billing';
import Integrations from './pages/Integrations';
import Reports from './pages/Reports';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/users" element={<Users />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/integrations" element={<Integrations />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}