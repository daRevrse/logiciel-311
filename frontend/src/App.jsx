import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar, LoadingScreen } from './components/common';

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

/**
 * Composant de route protégée
 */
const ProtectedRoute = ({ children, adminOnly = false, superAdminOnly = false }) => {
  const { isAuthenticated, isAdmin, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (superAdminOnly && !isSuperAdmin()) {
    return <Navigate to="/" replace />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * Redirection basée sur le rôle
 */
const RoleBasedRedirect = () => {
  const { isAdmin } = useAuth();

  if (isAdmin()) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Navigate to="/home" replace />;
};

/**
 * Layout avec Navbar
 */
const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {children}
    </div>
  );
};

/**
 * Composant principal de l'application
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />

        <Routes>
          {/* Route publique de connexion citoyenne */}
          <Route path="/login" element={<Login />} />

          {/* Route publique de connexion admin */}
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Route racine - redirige selon le rôle */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <RoleBasedRedirect />
              </ProtectedRoute>
            }
          />

          {/* Routes citoyennes protégées */}
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Layout>
                  <Home />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Layout>
                  <ReportsList />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-reports"
            element={
              <ProtectedRoute>
                <Layout>
                  <MyReports />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports/create"
            element={
              <ProtectedRoute>
                <Layout>
                  <CreateReport />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <ReportDetail />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Routes admin protégées */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <ManageReports />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/reports/:id"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <ReportDetailAdmin />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/categories"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <ManageCategories />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute adminOnly>
                <Layout>
                  <ManageUsers />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/municipalities"
            element={
              <ProtectedRoute superAdminOnly>
                <Layout>
                  <ManageMunicipalities />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Route par défaut - redirection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
