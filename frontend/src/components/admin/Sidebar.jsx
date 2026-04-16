import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, AlertCircle, Map, Wrench, ShoppingBag,
  Construction, FileText, Settings, X, MapPin,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
  { label: 'Tableau de bord', icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Signalements',    icon: AlertCircle,     to: '/admin/reports' },
  { label: 'Interventions',   icon: Wrench,          to: '/admin/interventions' },
  { label: 'Marchés',         icon: ShoppingBag,     to: '/admin/marches' },
  { label: 'Voirie',          icon: Construction,    to: '/admin/voirie' },
  { label: 'Documents',       icon: FileText,        to: '/admin/documents' },
];

const Sidebar = ({ mobileOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="font-bold text-gray-900 leading-tight">Muno</div>
            <div className="text-[10px] font-medium text-gray-400 tracking-widest uppercase leading-tight">Gestion Municipale</div>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ label, icon: Icon, to }) => {
          const active = location.pathname === to || location.pathname.startsWith(to + '/');
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`flex-shrink-0 ${active ? 'text-primary-600' : 'text-gray-400'}`} style={{height: '18px', width: '18px'}} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Paramètres */}
      <div className="px-3 border-t border-gray-100 pt-2">
        <Link
          to="/admin/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            location.pathname === '/admin/settings'
              ? 'bg-primary-50 text-primary-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Settings style={{height: '18px', width: '18px'}} className="text-gray-400 flex-shrink-0" />
          Paramètres
        </Link>
      </div>

      {/* Support Hero section */}
      <div className="px-5 py-4 mt-2">
        <div className="text-[10px] font-semibold text-gray-400 tracking-widest uppercase mb-2">Support Hero</div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-green-500 flex-shrink-0"></span>
          <span className="text-sm font-medium text-gray-700">
            {user?.municipality?.name || 'Secteur B4'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar desktop fixe */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 border-r border-gray-200 bg-white shadow-sm">
        <SidebarContent />
      </aside>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <aside className="relative flex flex-col w-60 h-full border-r border-gray-200 bg-white shadow-sm z-50">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
