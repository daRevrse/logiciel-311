import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, AlertCircle, Wrench, Settings, X, Building2, Key, Shield,
  Users, Tag, Globe, ExternalLink, HardHat, UsersRound
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

// Espace mairie : regroupé en Opérations / Gestion
const opsNav = [
  { label: 'Tableau de bord', icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Signalements',    icon: AlertCircle,     to: '/admin/reports' },
  { label: 'Interventions',   icon: Wrench,          to: '/admin/interventions' },
];

const mgmtNav = [
  { label: 'Agents',          icon: HardHat,     to: '/admin/agents' },
  { label: 'Administrateurs', icon: Users,       to: '/admin/users' },
  { label: 'Citoyens',        icon: UsersRound,  to: '/admin/citizens' },
  { label: 'Catégories',      icon: Tag,         to: '/admin/categories' },
  { label: 'Paramètres',      icon: Settings,    to: '/admin/municipality/settings' },
];

const superAdminNavItems = [
  { label: 'Vue globale',           icon: LayoutDashboard, to: '/admin/system' },
  { label: 'Municipalités',         icon: Building2,       to: '/admin/municipalities' },
  { label: 'Licences',              icon: Key,             to: '/admin/licenses' },
  { label: 'Super administrateurs', icon: Shield,          to: '/admin/super-admins' },
];

const SectionHeader = ({ children }) => (
  <div className="px-4 pt-5 pb-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
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
        to={to}
        onClick={onClose}
        className={`flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl transition-all duration-200 ${
          active
            ? 'bg-navy-deep text-white font-bold shadow-sm'
            : 'text-slate-500 hover:text-navy-deep hover:bg-slate-100'
        }`}
      >
        <Icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-turquoise' : ''}`} />
        <span>{label}</span>
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 text-sm tracking-tight">
      {/* Logo */}
      <div className="p-5 flex items-center gap-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-xl bg-navy-deep flex items-center justify-center flex-shrink-0 p-1.5">
          <img src="/logo_muno.png" alt="Muno" className="h-full w-full object-contain" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-navy-deep leading-tight">Muno</h1>
          <p className="text-[10px] uppercase tracking-widest text-turquoise-dark leading-tight font-bold">
            {superAdmin ? 'Administration système' : 'Gestion municipale'}
          </p>
        </div>
        <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600 lg:hidden p-1 rounded-md hover:bg-slate-100 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 space-y-0.5 overflow-y-auto">
        {superAdmin ? (
          /* Super admin = opérateur système : uniquement la vue plateforme */
          <>
            <SectionHeader>Système</SectionHeader>
            {superAdminNavItems.map(({ label, icon, to }) => (
              <NavLink key={to} label={label} Icon={icon} to={to} />
            ))}
          </>
        ) : (
          <>
            <SectionHeader>Opérations</SectionHeader>
            {opsNav.map(({ label, icon, to }) => (
              <NavLink key={to} label={label} Icon={icon} to={to} />
            ))}
            <SectionHeader>Gestion</SectionHeader>
            {mgmtNav.map(({ label, icon, to }) => (
              <NavLink key={to} label={label} Icon={icon} to={to} />
            ))}
          </>
        )}
      </nav>

      {/* Lien page publique (admin de mairie) */}
      {!superAdmin && (municipality?.slug || user?.municipality?.slug) && (
        <div className="px-2 pb-2">
          <a
            href={`/m/${municipality?.slug || user?.municipality?.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="group flex items-center gap-3 px-4 py-2.5 mx-2 rounded-xl text-slate-500 hover:text-turquoise-dark hover:bg-turquoise/5 transition-all duration-200"
            title="Ouvrir la page publique de la mairie"
          >
            <Globe className="h-5 w-5 flex-shrink-0" />
            <span className="flex-1 text-sm">Voir page publique</span>
            <ExternalLink className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      )}

      {/* Indicateur mairie / mode */}
      <div className="p-4 mt-auto border-t border-slate-100">
        <div className="flex items-center gap-2 px-2">
          <div className={`w-2 h-2 rounded-full ${superAdmin ? 'bg-amber-400' : 'bg-turquoise'}`} />
          <span className="text-xs font-semibold text-slate-600 truncate">
            {superAdmin ? 'Super administrateur' : (municipality?.name || user?.municipality?.name || '—')}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
          <aside className="relative flex flex-col w-64 h-full shadow-2xl transition-transform duration-300">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
};

export default Sidebar;
