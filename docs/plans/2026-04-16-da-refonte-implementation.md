# Refonte DA Muno — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remplacer la palette violette par la charte Muno (bleu institutionnel + vert citoyen), restructurer les layouts admin (sidebar) et citoyen (bottom nav + FAB), et mettre en avant le bouton "Appuyer 👍" partout.

**Architecture:** Refonte par couches — tokens → composants → layouts → pages. Chaque couche s'appuie sur la précédente. L'admin passe d'une top-nav à une sidebar + header dédiés. Le citoyen passe à un layout mobile-first avec bottom nav et FAB vert.

**Tech Stack:** React 19, Vite, Tailwind CSS 3.4, Lucide React, React Router DOM v7, Headless UI

---

## Task 1 : Design tokens — Tailwind config

**Files:**
- Modify: `frontend/tailwind.config.js`

**Step 1: Remplacer la palette complète**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2F6FED',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A5F',
        },
        deep: '#1E3A5F',
        support: {
          DEFAULT: '#2BB673',
          light:   '#6ED3A3',
          dark:    '#1D8A56',
        },
        surface: '#F5F7FA',
        muted:   '#6B7280',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        card: '0 1px 4px rgba(0,0,0,0.08)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}
```

**Step 2: Vérifier visuellement**

Run: `cd frontend && npm run dev`  
Ouvrir http://localhost:3000 — les éléments avec `primary-600` doivent passer du violet au bleu.

**Step 3: Commit**

```bash
git add frontend/tailwind.config.js
git commit -m "feat: replace purple palette with Muno blue design tokens"
```

---

## Task 2 : Design tokens — CSS global

**Files:**
- Modify: `frontend/src/index.css`

**Step 1: Réécrire index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: 'Inter', system-ui, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  background-color: #F5F7FA;
  color: #111827;
}

body {
  margin: 0;
  min-height: 100vh;
  background-color: #F5F7FA;
}

@layer components {
  /* Boutons */
  .btn-primary {
    @apply bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2;
  }

  .btn-secondary {
    @apply border-2 border-primary-600 text-primary-600 bg-white px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors font-medium;
  }

  .btn-support {
    @apply bg-support text-white px-4 py-2 rounded-lg hover:bg-support-dark transition-colors font-medium flex items-center gap-2;
  }

  /* Inputs */
  .input-field {
    @apply w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-shadow;
  }

  /* Cards */
  .card {
    @apply bg-white rounded-[12px] shadow-card p-6;
  }

  .card-hover {
    @apply bg-white rounded-[12px] shadow-card p-6 hover:shadow-card-hover transition-shadow cursor-pointer;
  }

  /* Badges */
  .badge {
    @apply inline-flex items-center font-medium rounded-full border text-sm px-2.5 py-1;
  }

  .badge-new {
    @apply badge bg-blue-50 text-primary-700 border-primary-200;
  }

  .badge-inprogress {
    @apply badge bg-amber-50 text-amber-700 border-amber-200;
  }

  .badge-resolved {
    @apply badge bg-emerald-50 text-support-dark border-emerald-200;
  }

  .badge-rejected {
    @apply badge bg-red-50 text-red-700 border-red-200;
  }

  .badge-confirmed {
    @apply badge bg-primary-50 text-primary-800 border-primary-300;
  }
}
```

**Step 2: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: update global CSS with Muno design tokens and utility classes"
```

---

## Task 3 : Composant Button

**Files:**
- Modify: `frontend/src/components/common/Button.jsx`

**Step 1: Ajouter la variante `support` et mettre à jour les couleurs**

```jsx
import React from 'react';
import { ThumbsUp } from 'lucide-react';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary:   'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'border-2 border-primary-600 text-primary-600 bg-white hover:bg-primary-50 focus:ring-primary-500',
    support:   'bg-support text-white hover:bg-support-dark focus:ring-support',
    danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    outline:   'border-2 border-primary-600 text-primary-600 hover:bg-primary-50 focus:ring-primary-500',
    ghost:     'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2 text-base gap-2',
    lg: 'px-6 py-3 text-lg gap-2',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  const classes = `${baseClasses} ${variants[variant] || variants.primary} ${sizes[size]} ${widthClass} ${className}`;

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {variant === 'support' && !loading && <ThumbsUp className="h-4 w-4" />}
      {children}
    </button>
  );
};

export default Button;
```

**Step 2: Commit**

```bash
git add frontend/src/components/common/Button.jsx
git commit -m "feat: add support variant (green + thumbs-up) to Button component"
```

---

## Task 4 : Composant StatusBadge

**Files:**
- Modify: `frontend/src/components/common/StatusBadge.jsx`

**Step 1: Mettre à jour les couleurs selon la charte Muno**

```jsx
import React from 'react';

const StatusBadge = ({ status, size = 'md' }) => {
  const statusConfig = {
    pending: {
      label: 'Nouveau',
      color: 'bg-blue-50 text-primary-700 border-primary-200',
    },
    confirmed: {
      label: 'Confirmé',
      color: 'bg-primary-50 text-primary-800 border-primary-300',
    },
    in_progress: {
      label: 'En cours',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    resolved: {
      label: 'Résolu',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    rejected: {
      label: 'Rejeté',
      color: 'bg-red-50 text-red-700 border-red-200',
    },
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${config.color} ${sizes[size]}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
```

**Step 2: Commit**

```bash
git add frontend/src/components/common/StatusBadge.jsx
git commit -m "feat: update StatusBadge colors to Muno design system"
```

---

## Task 5 : Composant Card

**Files:**
- Modify: `frontend/src/components/common/Card.jsx`

**Step 1: Lire le fichier actuel**

```bash
cat frontend/src/components/common/Card.jsx
```

**Step 2: Mettre à jour le radius et la shadow**

Remplacer `rounded-lg shadow-md` par `rounded-[12px] shadow-card` dans le className de base de la Card. Si `hoverable` est true, utiliser `hover:shadow-card-hover transition-shadow`.

**Step 3: Commit**

```bash
git add frontend/src/components/common/Card.jsx
git commit -m "feat: update Card radius to 12px and shadow to Muno design tokens"
```

---

## Task 6 : Composant Input

**Files:**
- Modify: `frontend/src/components/common/Input.jsx`

**Step 1: Lire le fichier actuel**

```bash
cat frontend/src/components/common/Input.jsx
```

**Step 2: Remplacer le focus ring violet par bleu**

Changer `focus:ring-primary-500` → déjà correct si la palette a été mise à jour. Vérifier que le border actif est `border-primary-600` et non violet.

**Step 3: Commit**

```bash
git add frontend/src/components/common/Input.jsx
git commit -m "feat: update Input focus ring to Muno blue"
```

---

## Task 7 : Nouveau composant Sidebar admin

**Files:**
- Create: `frontend/src/components/admin/Sidebar.jsx`

**Step 1: Créer le composant**

```jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, AlertCircle, Wrench, ShoppingBag,
  Map, FileText, Settings, X, Menu, Building2, Users, Tag,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { label: 'Dashboard',      icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Signalements',   icon: AlertCircle,     to: '/admin/reports' },
  { label: 'Catégories',     icon: Tag,             to: '/admin/categories' },
  { label: 'Utilisateurs',   icon: Users,           to: '/admin/users' },
];

const Sidebar = ({ mobileOpen, onClose }) => {
  const location = useLocation();
  const { isSuperAdmin } = useAuth();

  const items = isSuperAdmin()
    ? [...navItems, { label: 'Municipalités', icon: Building2, to: '/admin/municipalities' }]
    : navItems;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Map className="h-7 w-7 text-white" />
          <span className="text-white font-bold text-xl tracking-tight">Muno</span>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(({ label, icon: Icon, to }) => {
          const active = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-600 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Settings en bas */}
      <div className="px-3 py-4 border-t border-white/10">
        <Link
          to="/admin/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Settings className="h-5 w-5" />
          Paramètres
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-[#1E3A5F]">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <aside className="relative flex flex-col w-60 h-full bg-[#1E3A5F] z-50">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
```

**Step 2: Commit**

```bash
git add frontend/src/components/admin/Sidebar.jsx
git commit -m "feat: create admin Sidebar component with deep blue Muno branding"
```

---

## Task 8 : Nouveau composant AdminHeader

**Files:**
- Create: `frontend/src/components/admin/AdminHeader.jsx`

**Step 1: Créer le composant**

```jsx
import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { LogOut, User, Menu as MenuIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminHeader = ({ title, onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 lg:px-6 gap-4">
      {/* Bouton menu mobile */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-500 hover:text-gray-700"
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      {/* Titre */}
      <h1 className="text-lg font-semibold text-gray-900 flex-1">{title}</h1>

      {/* Profil */}
      <Menu as="div" className="relative">
        <Menu.Button className="flex items-center gap-2 text-gray-700 hover:text-primary-600 focus:outline-none">
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="h-4 w-4 text-primary-600" />
          </div>
          <span className="hidden sm:block text-sm font-medium">
            {user?.full_name || user?.email}
          </span>
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-10">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.full_name || user?.email}
              </p>
              {user?.email && (
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              )}
            </div>
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleLogout}
                    className={`flex items-center w-full px-4 py-2 text-sm text-red-600 ${active ? 'bg-gray-50' : ''}`}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Déconnexion
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </header>
  );
};

export default AdminHeader;
```

**Step 2: Commit**

```bash
git add frontend/src/components/admin/AdminHeader.jsx
git commit -m "feat: create AdminHeader component with profile dropdown"
```

---

## Task 9 : Refactorer App.jsx — layouts séparés

**Files:**
- Modify: `frontend/src/App.jsx`

**Step 1: Créer deux layouts distincts**

Remplacer le `Layout` unique par deux composants :

1. **`CitizenLayout`** — Navbar en haut (desktop) + bottom nav (mobile), fond `surface`
2. **`AdminLayout`** — Sidebar fixe gauche + AdminHeader, sans Navbar existante

```jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
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

// Layout citoyen : top navbar desktop + bottom nav mobile
const CitizenLayout = ({ children }) => (
  <div className="min-h-screen bg-surface">
    <Navbar />
    <main className="pb-20 lg:pb-0">{children}</main>
  </div>
);

// Mapping titre page admin
const adminTitles = {
  '/admin/dashboard':     'Tableau de bord',
  '/admin/reports':       'Signalements',
  '/admin/categories':    'Catégories',
  '/admin/users':         'Utilisateurs',
  '/admin/municipalities':'Municipalités',
};

// Layout admin : sidebar fixe + header
const AdminLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const title = Object.entries(adminTitles).find(([path]) => location.pathname.startsWith(path))?.[1] || 'Admin';

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

          {/* Citoyen */}
          <Route path="/home"           element={<ProtectedRoute><CitizenLayout><Home /></CitizenLayout></ProtectedRoute>} />
          <Route path="/reports"        element={<ProtectedRoute><CitizenLayout><ReportsList /></CitizenLayout></ProtectedRoute>} />
          <Route path="/my-reports"     element={<ProtectedRoute><CitizenLayout><MyReports /></CitizenLayout></ProtectedRoute>} />
          <Route path="/reports/create" element={<ProtectedRoute><CitizenLayout><CreateReport /></CitizenLayout></ProtectedRoute>} />
          <Route path="/reports/:id"    element={<ProtectedRoute><CitizenLayout><ReportDetail /></CitizenLayout></ProtectedRoute>} />

          {/* Admin */}
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
```

**Step 2: Exporter les nouveaux composants admin**

Vérifier si `frontend/src/components/admin/index.js` existe. Si oui, l'ajouter. Sinon, les imports directs dans App.jsx suffisent.

**Step 3: Commit**

```bash
git add frontend/src/App.jsx frontend/src/components/admin/
git commit -m "feat: split admin and citizen layouts, add sidebar-based admin layout"
```

---

## Task 10 : Navbar citoyen — bottom nav mobile

**Files:**
- Modify: `frontend/src/components/common/Navbar.jsx`

**Step 1: Ajouter la bottom navigation mobile**

Après la `<nav>` existante (garder la top nav desktop), ajouter avant `</>`  :

```jsx
{/* Bottom navigation — mobile uniquement */}
{isAuthenticated && !isAdmin() && (
  <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
    <div className="flex">
      {[
        { to: '/home',       label: 'Accueil',       Icon: Home },
        { to: '/reports',    label: 'Signalements',  Icon: List },
        { to: '/my-reports', label: 'Mes rapports',  Icon: User },
      ].map(({ to, label, Icon }) => {
        const active = location.pathname === to;
        return (
          <Link
            key={to}
            to={to}
            className={`flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors ${
              active ? 'text-primary-600' : 'text-gray-500 hover:text-primary-600'
            }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </div>
  </nav>
)}
```

Importer `useLocation` depuis react-router-dom et les icônes `Home`, `List` depuis lucide-react.

**Step 2: Commit**

```bash
git add frontend/src/components/common/Navbar.jsx
git commit -m "feat: add mobile bottom navigation to citizen Navbar"
```

---

## Task 11 : Page Login citoyen

**Files:**
- Modify: `frontend/src/pages/citizen/Login.jsx`

**Step 1: Lire le fichier actuel**

```bash
cat frontend/src/pages/citizen/Login.jsx
```

**Step 2: Mettre à jour le style**

- Fond : `bg-surface` (`#F5F7FA`)
- Card centrée : `card` className, max-w-md, shadow-card
- Logo : icône `Map` bleue + texte "Muno" bold
- Bouton submit : `btn-primary` ou `<Button variant="primary" fullWidth>`
- Supprimer tout violet résiduel

**Step 3: Commit**

```bash
git add frontend/src/pages/citizen/Login.jsx
git commit -m "feat: restyle citizen Login page with Muno branding"
```

---

## Task 12 : Page Login admin

**Files:**
- Modify: `frontend/src/pages/admin/AdminLogin.jsx`

**Step 1: Lire et mettre à jour**

Même logique que Task 11. Ajouter un badge "Administration" au-dessus du formulaire avec fond `deep` (`#1E3A5F`).

**Step 2: Commit**

```bash
git add frontend/src/pages/admin/AdminLogin.jsx
git commit -m "feat: restyle AdminLogin with Muno deep blue branding"
```

---

## Task 13 : Page Dashboard admin

**Files:**
- Modify: `frontend/src/pages/admin/Dashboard.jsx`

**Step 1: Lire le fichier actuel**

```bash
cat frontend/src/pages/admin/Dashboard.jsx
```

**Step 2: Mettre à jour les KPI widgets**

Chaque widget doit utiliser :
```jsx
<div className="card flex items-center gap-4">
  <div className="h-12 w-12 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
    <Icon className="h-6 w-6 text-primary-600" />
  </div>
  <div>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-muted">{label}</p>
  </div>
</div>
```

Icônes suggérées : `AlertCircle` (total), `Clock` (en cours), `CheckCircle2` (résolus), `TrendingUp` (nouveaux)  
Couleurs icônes :
- Total → `text-primary-600` / bg `bg-primary-50`
- En cours → `text-amber-600` / bg `bg-amber-50`
- Résolus → `text-support` / bg `bg-emerald-50`
- Nouveaux → `text-blue-600` / bg `bg-blue-50`

**Step 3: Mettre à jour le graphique**

Remplacer les couleurs violet par `#2F6FED` (primary) et `#2BB673` (support).

**Step 4: Section signalements récents**

Afficher dans une table avec colonnes : Titre | Appuis 👍 | Statut | Date  
La colonne Appuis doit utiliser un badge vert : `<span className="badge badge-resolved">👍 {n}</span>`

**Step 5: Commit**

```bash
git add frontend/src/pages/admin/Dashboard.jsx
git commit -m "feat: update admin Dashboard with Muno KPI widgets and color scheme"
```

---

## Task 14 : Page ManageReports admin

**Files:**
- Modify: `frontend/src/pages/admin/ManageReports.jsx`

**Step 1: Lire le fichier**

```bash
cat frontend/src/pages/admin/ManageReports.jsx
```

**Step 2: Mettre en avant la colonne Appuis**

- Colonne "Appuis 👍" en 2ème position (après Titre)
- Affichée avec : `<span className="inline-flex items-center gap-1 font-semibold text-support"><ThumbsUp className="h-4 w-4" />{n}</span>`
- Tri par défaut : `supports_count DESC`
- Badge statut : utiliser `<StatusBadge />`

**Step 3: Filtres en haut**

Chips de filtre sur une ligne : Tous | Nouveau | En cours | Résolu  
Style chip actif : `bg-primary-600 text-white`, inactif : `bg-white border border-gray-300 text-gray-700`

**Step 4: Commit**

```bash
git add frontend/src/pages/admin/ManageReports.jsx
git commit -m "feat: highlight support count column in ManageReports, add filter chips"
```

---

## Task 15 : Page Home citoyen — split view + FAB

**Files:**
- Modify: `frontend/src/pages/citizen/Home.jsx`

**Step 1: Lire le fichier**

```bash
cat frontend/src/pages/citizen/Home.jsx
```

**Step 2: Split view desktop**

```jsx
<div className="flex h-[calc(100vh-64px)]">
  {/* Liste — 40% */}
  <div className="w-full lg:w-2/5 overflow-y-auto border-r border-gray-200 bg-white">
    {/* header filtres + liste cards */}
  </div>

  {/* Carte — 60%, desktop only */}
  <div className="hidden lg:block lg:w-3/5">
    {/* Leaflet map */}
  </div>
</div>
```

**Step 3: Tabs mobile Liste / Carte**

```jsx
{/* Mobile tabs */}
<div className="lg:hidden flex border-b border-gray-200 bg-white">
  <button
    className={`flex-1 py-3 text-sm font-medium ${activeTab === 'list' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
    onClick={() => setActiveTab('list')}
  >
    Liste
  </button>
  <button
    className={`flex-1 py-3 text-sm font-medium ${activeTab === 'map' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
    onClick={() => setActiveTab('map')}
  >
    Carte
  </button>
</div>
```

**Step 4: FAB (Floating Action Button)**

```jsx
<Link
  to="/reports/create"
  className="fixed bottom-24 right-4 lg:bottom-6 z-20 h-14 w-14 rounded-full bg-support text-white shadow-lg flex items-center justify-center hover:bg-support-dark transition-colors"
  aria-label="Nouveau signalement"
>
  <Plus className="h-7 w-7" />
</Link>
```

Note : `bottom-24` sur mobile pour laisser de la place au bottom nav (80px).

**Step 5: Cards signalements**

Chaque card de signalement :
```jsx
<div className="card-hover border-l-4 border-primary-600 p-4">
  <div className="flex items-start justify-between gap-2">
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
      <p className="text-sm text-muted mt-1">{location}</p>
    </div>
    <StatusBadge status={status} size="sm" />
  </div>
  <div className="flex items-center justify-between mt-3">
    <span className="text-xs text-muted">{category}</span>
    <span className="inline-flex items-center gap-1 text-support font-semibold text-sm">
      <ThumbsUp className="h-4 w-4" />
      {supports_count}
    </span>
  </div>
</div>
```

**Step 6: Commit**

```bash
git add frontend/src/pages/citizen/Home.jsx
git commit -m "feat: redesign Home with split view, mobile tabs, FAB, and support count cards"
```

---

## Task 16 : Page CreateReport citoyen — stepper

**Files:**
- Modify: `frontend/src/pages/citizen/CreateReport.jsx`

**Step 1: Lire le fichier**

```bash
cat frontend/src/pages/citizen/CreateReport.jsx
```

**Step 2: Ajouter le stepper visuel en haut**

```jsx
const steps = ['Localisation', 'Photo', 'Catégorie', 'Description', 'Similaires'];

// Composant stepper
<div className="flex items-center mb-8">
  {steps.map((label, idx) => (
    <React.Fragment key={idx}>
      <div className="flex flex-col items-center">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
          idx < currentStep ? 'bg-support text-white' :
          idx === currentStep ? 'bg-primary-600 text-white' :
          'bg-gray-200 text-gray-500'
        }`}>
          {idx < currentStep ? '✓' : idx + 1}
        </div>
        <span className="text-xs mt-1 text-muted hidden sm:block">{label}</span>
      </div>
      {idx < steps.length - 1 && (
        <div className={`flex-1 h-0.5 mx-1 ${idx < currentStep ? 'bg-support' : 'bg-gray-200'}`} />
      )}
    </React.Fragment>
  ))}
</div>
```

**Step 3: Catégories en chips**

```jsx
const categories = ['Voirie', 'Éclairage', 'Eau', 'Déchets', 'Autre'];

<div className="flex flex-wrap gap-2">
  {categories.map(cat => (
    <button
      key={cat}
      type="button"
      onClick={() => setCategory(cat)}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
        category === cat
          ? 'bg-primary-600 text-white border-primary-600'
          : 'bg-white text-gray-700 border-gray-300 hover:border-primary-400'
      }`}
    >
      {cat}
    </button>
  ))}
</div>
```

**Step 4: Étape Similaires avec bouton Appuyer**

```jsx
{similarReports.map(report => (
  <div key={report.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-xl">
    <div>
      <p className="text-sm font-medium text-gray-900">{report.title}</p>
      <p className="text-xs text-muted">{report.distance}m • {report.supports_count} appuis</p>
    </div>
    <Button variant="support" size="sm" onClick={() => handleSupport(report.id)}>
      Appuyer
    </Button>
  </div>
))}
```

**Step 5: Commit**

```bash
git add frontend/src/pages/citizen/CreateReport.jsx
git commit -m "feat: add visual stepper, category chips, and similar reports with support button"
```

---

## Task 17 : Page ReportsList citoyen

**Files:**
- Modify: `frontend/src/pages/citizen/ReportsList.jsx`

**Step 1: Lire et mettre à jour**

```bash
cat frontend/src/pages/citizen/ReportsList.jsx
```

- Chips de filtres catégories en haut (même style que Task 16 Step 3)
- Cards avec statut badge + appuis visibles + bouton `<Button variant="support" size="sm">Appuyer</Button>`
- Fond page `bg-surface`

**Step 2: Commit**

```bash
git add frontend/src/pages/citizen/ReportsList.jsx
git commit -m "feat: update ReportsList with filter chips, support counts, and Appuyer button"
```

---

## Task 18 : Page ReportDetail citoyen

**Files:**
- Modify: `frontend/src/pages/citizen/ReportDetail.jsx`

**Step 1: Lire et mettre à jour**

```bash
cat frontend/src/pages/citizen/ReportDetail.jsx
```

**Step 2: Bouton Appuyer fixe en bas sur mobile**

```jsx
{/* Fixed bottom bar — mobile */}
<div className="fixed bottom-20 left-0 right-0 px-4 pb-safe lg:hidden bg-white border-t border-gray-200 py-3">
  <Button variant="support" fullWidth size="lg" onClick={handleSupport} disabled={hasSupported}>
    {hasSupported ? `Vous avez appuyé (${supports_count})` : `Appuyer 👍 (${supports_count})`}
  </Button>
</div>

{/* Desktop: bouton inline dans la page */}
<div className="hidden lg:block mt-6">
  <Button variant="support" size="lg" onClick={handleSupport} disabled={hasSupported}>
    {hasSupported ? `Vous avez appuyé (${supports_count})` : `Appuyer 👍 (${supports_count})`}
  </Button>
</div>
```

**Step 3: Commit**

```bash
git add frontend/src/pages/citizen/ReportDetail.jsx
git commit -m "feat: add fixed support button on mobile in ReportDetail"
```

---

## Task 19 : Vérification visuelle finale

**Step 1: Lancer le serveur**

```bash
cd frontend && npm run dev
```

**Checklist visuelle :**

| Page | Ce qu'on vérifie |
|------|-----------------|
| `/login` | Fond gris clair, card blanche, bouton bleu, logo Muno |
| `/home` | Split view (desktop), tabs (mobile), FAB vert, cards avec 👍 bleu |
| `/reports/create` | Stepper en haut, chips catégories, étape Similaires avec bouton Appuyer |
| `/reports` | Cards avec badge statut Muno, bouton Appuyer vert |
| `/reports/:id` | Bouton Appuyer fixe en bas (mobile) |
| `/admin/dashboard` | Sidebar bleu profond (#1E3A5F), 4 KPI widgets, pas de Navbar visible |
| `/admin/reports` | Colonne Appuis 👍 en 2ème position, tri décroissant |
| Partout | Aucun violet résiduel |

**Step 2: Si violet résiduel détecté**

```bash
grep -r "purple\|violet\|#7c3aed\|primary-500\|primary-400" frontend/src --include="*.jsx" --include="*.css"
```

Remplacer chaque occurrence par l'équivalent bleu/vert Muno.

**Step 3: Commit final**

```bash
git add -A
git commit -m "feat: complete Muno DA refonte — blue/green design system, sidebar admin, mobile-first citizen UX"
```
