import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, AlertCircle, Map, Users, Tag, Building2, Settings, X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { label: 'Dashboard',    icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Signalements', icon: AlertCircle,     to: '/admin/reports' },
  { label: 'Catégories',   icon: Tag,             to: '/admin/categories' },
  { label: 'Utilisateurs', icon: Users,           to: '/admin/users' },
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

      {/* Navigation */}
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

      {/* Paramètres en bas */}
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
      {/* Sidebar desktop fixe */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 bg-[#1E3A5F]">
        <SidebarContent />
      </aside>

      {/* Overlay mobile */}
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
