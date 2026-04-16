import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, AlertCircle, Wrench, ShoppingBag,
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
  { label: 'Paramètres',      icon: Settings,        to: '/admin/settings' },
];

const Sidebar = ({ mobileOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-100 font-['Manrope'] text-sm tracking-tight">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
          <MapPin className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tighter text-slate-900 leading-tight">Muno</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 leading-tight">Gestion Municipale</p>
        </div>
        <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600 lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-4 px-4 space-y-1">
        {navItems.map(({ label, icon: Icon, to }) => {
          const active = location.pathname === to || (to !== '/admin/dashboard' && location.pathname.startsWith(to + '/'));
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                active
                  ? 'rounded-none border-l-4 border-primary-600 bg-primary-600/5 text-primary-600 font-bold'
                  : 'rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              <Icon className="h-[18px] w-[18px] flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Support Hero */}
      <div className="p-6 mt-auto">
        <div className="bg-white p-4 rounded-xl shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-tighter mb-2">Support Hero</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#008851]"></div>
            <span className="text-xs font-medium text-slate-700">
              {user?.municipality?.name || 'Secteur B4'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — w-64 */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-slate-100 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <aside className="relative flex flex-col w-64 h-full bg-slate-100 z-50">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
