import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar, LoadingScreen } from './components/common';
import Sidebar from './components/admin/Sidebar';
import AdminHeader from './components/admin/AdminHeader';

// Pages citoyennes
import Login from './pages/citizen/Login';
import Home from './pages/citizen/Home';
import ReportsList from './pages/citizen/ReportsList';
import CreateReport from './pages/citizen/CreateReport';
import ReportDetail from './pages/citizen/ReportDetail';
import MyReports from './pages/citizen/MyReports';

// Pages admin
import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import ManageReports from './pages/admin/ManageReports';
import ReportDetailAdmin from './pages/admin/ReportDetailAdmin';
import ManageCategories from './pages/admin/ManageCategories';
import ManageUsers from './pages/admin/ManageUsers';
import ManageMunicipalities from './pages/admin/ManageMunicipalities';

const ProtectedRoute = ({ children, adminOnly = false, superAdminOnly = false }) => {
  const { isAuthenticated, isAdmin, isSuperAdmin, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (superAdminOnly && !isSuperAdmin()) return <Navigate to="/" replace />;
  if (adminOnly && !isAdmin()) return <Navigate to="/" replace />;
  return children;
};

const RoleBasedRedirect = () => {
  const { isAdmin } = useAuth();
  return isAdmin() ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/home" replace />;
};

// Layout citoyen : top navbar + contenu
const CitizenLayout = ({ children }) => (
  <div className="min-h-screen bg-surface">
    <Navbar />
    <main className="pb-20 lg:pb-0">{children}</main>
  </div>
);

// Mapping titre pages admin
const adminTitles = {
  '/admin/dashboard':      'Tableau de bord',
  '/admin/reports':        'Signalements Citoyens',
  '/admin/categories':     'Catégories',
  '/admin/users':          'Utilisateurs',
  '/admin/municipalities': 'Municipalités',
};

// Layout admin : sidebar fixe + header
const AdminLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title = Object.entries(adminTitles).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || 'Admin';

  return (
    <div className="min-h-screen bg-surface">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="lg:pl-60 flex flex-col min-h-screen">
        <AdminHeader title={title} onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { background: '#1E3A5F', color: '#fff' },
            success: { iconTheme: { primary: '#2BB673', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />

        <Routes>
          <Route path="/login"       element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          <Route path="/" element={<ProtectedRoute><RoleBasedRedirect /></ProtectedRoute>} />

          {/* Routes citoyennes */}
          <Route path="/home"           element={<ProtectedRoute><CitizenLayout><Home /></CitizenLayout></ProtectedRoute>} />
          <Route path="/reports"        element={<ProtectedRoute><CitizenLayout><ReportsList /></CitizenLayout></ProtectedRoute>} />
          <Route path="/my-reports"     element={<ProtectedRoute><CitizenLayout><MyReports /></CitizenLayout></ProtectedRoute>} />
          <Route path="/reports/create" element={<ProtectedRoute><CitizenLayout><CreateReport /></CitizenLayout></ProtectedRoute>} />
          <Route path="/reports/:id"    element={<ProtectedRoute><CitizenLayout><ReportDetail /></CitizenLayout></ProtectedRoute>} />

          {/* Routes admin */}
          <Route path="/admin/dashboard"      element={<ProtectedRoute adminOnly><AdminLayout><Dashboard /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/reports"        element={<ProtectedRoute adminOnly><AdminLayout><ManageReports /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/reports/:id"    element={<ProtectedRoute adminOnly><AdminLayout><ReportDetailAdmin /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/categories"     element={<ProtectedRoute adminOnly><AdminLayout><ManageCategories /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/users"          element={<ProtectedRoute adminOnly><AdminLayout><ManageUsers /></AdminLayout></ProtectedRoute>} />
          <Route path="/admin/municipalities" element={<ProtectedRoute superAdminOnly><AdminLayout><ManageMunicipalities /></AdminLayout></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
