import React, { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { LogOut, User, Menu as MenuIcon, Search, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminHeader = ({ title, onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <header className="sticky top-0 z-30 flex justify-between items-center px-4 lg:px-8 w-full h-16 bg-white/80 backdrop-blur-md shadow-sm">
      {/* Gauche : menu mobile + titre + search */}
      <div className="flex items-center gap-4 lg:gap-8 flex-1 min-w-0">
        <button onClick={onMenuClick} className="lg:hidden text-slate-500 hover:text-slate-700 flex-shrink-0">
          <MenuIcon className="h-6 w-6" />
        </button>

        <h2 className="text-xl font-bold text-slate-900 font-['Manrope'] whitespace-nowrap flex-shrink-0">
          {title}
        </h2>

        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            placeholder="Rechercher des signalements..."
            className="w-full bg-gray-100 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary-600/30 outline-none transition-all"
          />
        </div>
      </div>

      {/* Droite : filtre + séparateur + profil */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button className="p-2 hover:bg-slate-50 rounded-full transition-all active:scale-95">
          <SlidersHorizontal className="h-5 w-5 text-slate-600" />
        </button>

        <div className="h-8 w-px bg-gray-200" />

        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-3 pl-2 focus:outline-none">
            <span className="text-sm font-semibold text-slate-700 hidden sm:block">
              {user?.full_name || user?.email || 'Administrateur'}
            </span>
            <div className="w-8 h-8 rounded-full bg-primary-100 border-2 border-white shadow-sm flex items-center justify-center">
              <User className="h-4 w-4 text-primary-600" />
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
            <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none z-10">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.full_name || user?.email}
                </p>
                {user?.email && user?.full_name && (
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
      </div>
    </header>
  );
};

export default AdminHeader;
