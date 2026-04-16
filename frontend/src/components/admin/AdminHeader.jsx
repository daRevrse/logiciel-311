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
