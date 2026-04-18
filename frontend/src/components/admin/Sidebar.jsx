import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, AlertCircle, Wrench, ShoppingBag,
  Construction, FileText, Settings, X, Building2, Key, Shield, Users, Tag,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const baseNavItems = [
  { label: 'Tableau de bord', icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Signalements',    icon: AlertCircle,     to: '/admin/reports' },
  { label: 'Catégories',      icon: Tag,             to: '/admin/categories' },
  { label: 'Utilisateurs',    icon: Users,           to: '/admin/users' },
  { label: 'Agents',          icon: Users,           to: '/admin/agents' },
  { label: 'Paramètres',      icon: Settings,        to: '/admin/municipality/settings' },
];

const superAdminNavItems = [
  { label: 'Vue globale',           icon: LayoutDashboard, to: '/admin/system' },
  { label: 'Municipalités',         icon: Building2,       to: '/admin/municipalities' },
  { label: 'Licences',              icon: Key,             to: '/admin/licenses' },
  { label: 'Super administrateurs', icon: Shield,          to: '/admin/super-admins' },
];

const SectionHeader = ({ children }) => (
  <div className="px-4 pt-6 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
    {children}
  </div>
);

const Sidebar = ({ mobileOpen, onClose }) => {
  const location = useLocation();
  const { user, isSuperAdmin, municipality } = useAuth();
  const superAdmin = isSuperAdmin && isSuperAdmin();
  const NavLink = ({ label, Icon, to }) => {
    const active = location.pathname === to || (to !== '/admin/dashboard' && location.pathname.startsWith(to + '/'));
    return (
      <Link
        key={to}
        to={to}
        onClick={onClose}
        className={`flex items-center gap-3 px-4 py-3 transition-all duration-200 ${
          active
            ? 'rounded-none border-l-4 border-primary text-primary font-bold bg-primary/5'
            : 'rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800'
        }`}
      >
        <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-primary' : ''}`} />
        <span>{label}</span>
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-900 border-r-0 font-['Manrope'] text-sm tracking-tight">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0 overflow-hidden">
          <img src="/icone.png" alt="Muno Logo" className="h-full w-full object-cover" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tighter text-slate-900 dark:text-slate-50 leading-tight">Muno</h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 leading-tight font-semibold">Gestion Municipale</p>
        </div>
        <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600 lg:hidden p-1 rounded-md hover:bg-slate-200 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-2 px-2 space-y-1 overflow-y-auto">
        <SectionHeader>
          {superAdmin ? 'Espace mairie courant' : 'Ma mairie'}
        </SectionHeader>
        {baseNavItems.map(({ label, icon, to }) => (
          <NavLink key={to} label={label} Icon={icon} to={to} />
        ))}

        {superAdmin && (
          <>
            <div className="mx-4 my-3 border-t border-slate-200 dark:border-slate-800" />
            <SectionHeader>Système</SectionHeader>
            {superAdminNavItems.map(({ label, icon, to }) => (
              <NavLink key={to} label={label} Icon={icon} to={to} />
            ))}
          </>
        )}
      </nav>

      {/* Support Hero - Bottom section */}
      <div className="p-6 mt-auto">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-2">
            {superAdmin ? 'Mode' : 'Mairie'}
          </p>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full animate-pulse ${superAdmin ? 'bg-amber-400' : 'bg-emerald-400'}`}></div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
              {superAdmin ? 'Super administrateur' : (municipality?.name || user?.municipality?.name || '—')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — w-64 */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-slate-100 dark:bg-slate-900 z-40 transform transition-transform duration-300">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
          <aside className="relative flex flex-col w-64 h-full bg-slate-100 dark:bg-slate-900 shadow-2xl transition-transform duration-300">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;

