import React, { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { LogOut, User, Menu as MenuIcon, Search, SlidersHorizontal, ShieldCheck, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminHeader = ({ title, onMenuClick }) => {
  const { user, logout, isSuperAdmin, municipality } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const superAdmin = isSuperAdmin && isSuperAdmin();

  const handleLogout = () => {
    logout();
    if (!superAdmin && municipality?.slug) {
      navigate(`/${municipality.slug}/admin/login`);
    } else {
      navigate('/admin/login');
    }
  };

  return (
    <>
    {/* Bandeau contextuel : Super admin vs Admin mairie */}
    <div className={`sticky top-0 z-40 w-full px-4 lg:px-8 py-1.5 text-xs font-bold flex items-center gap-2 ${
      superAdmin
        ? 'bg-slate-900 text-amber-300 border-b border-slate-800'
        : 'bg-primary/10 text-primary border-b border-primary/20'
    }`}>
      {superAdmin ? (
        <>
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="uppercase tracking-widest">Administration système — Vue globale</span>
        </>
      ) : (
        <>
          {municipality?.logo_url ? (
            <img src={municipality.logo_url} alt="" className="h-4 w-4 rounded object-contain bg-white" />
          ) : (
            <Building2 className="h-3.5 w-3.5" />
          )}
          <span className="uppercase tracking-widest truncate">
            Mairie de {municipality?.name || '—'}
          </span>
        </>
      )}
    </div>
    <header className="sticky top-6 z-30 flex justify-between items-center px-4 lg:px-8 w-full h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md shadow-sm dark:shadow-none font-['Manrope']">
      {/* Left: mobile menu + title + search */}
      <div className="flex items-center gap-4 lg:gap-8 flex-1 min-w-0">
        <button onClick={onMenuClick} className="lg:hidden text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors flex-shrink-0">
          <MenuIcon className="h-6 w-6" />
        </button>

        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 font-headline whitespace-nowrap flex-shrink-0">
          {title}
        </h2>

        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            placeholder="Rechercher des signalements..."
            className="w-full bg-surface-container-low dark:bg-slate-900/50 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Right: filter + divider + profile */}
      <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
        <button className="p-2 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-full transition-all active:scale-95 text-slate-600 dark:text-slate-400">
          <SlidersHorizontal className="h-5 w-5" />
        </button>
        
        <div className="h-8 w-[1px] bg-outline-variant/30" />

        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-3 pl-2 focus:outline-none group">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 hidden md:block group-hover:text-primary transition-colors">
              {user?.full_name || user?.email || 'Administrateur'}
            </span>
            <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-white dark:border-slate-700 shadow-sm flex items-center justify-center overflow-hidden transition-transform group-hover:scale-110">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-slate-400" />
              )}
            </div>
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
            <Menu.Items className="absolute right-0 mt-2 w-52 origin-top-right rounded-2xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-black/5 focus:outline-none z-10 p-1">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800">
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                  {user?.full_name || 'Admin'}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold truncate">
                  {user?.role || 'Gestionnaire'}
                </p>
              </div>
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`flex items-center w-full px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors ${active ? 'bg-red-50 text-red-600 dark:bg-red-900/20' : 'text-red-500'}`}
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
      </div>
    </header>
    </>
  );
};

export default AdminHeader;

