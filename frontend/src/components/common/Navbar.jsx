import React, { Fragment } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { LogOut, User, Bell, Settings, Map, List, Tag, Users as UsersIcon, Building2, Home, FileText, ThumbsUp, Menu as MenuIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from './Button';

/**
 * Composant Navbar
 */
const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-navy-deep border-b border-white/10 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo et titre - Style Institutionnel */}
          <div className="flex items-center">
            <Link
              to={isAdmin() ? "/admin/dashboard" : "/home"}
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 shadow-lg shadow-turquoise/20 group-hover:scale-110 transition-transform">
                <img src="/logo_muno.png" alt="Muno" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-white tracking-tight leading-none">Muno</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-turquoise font-bold mt-1">Signalement citoyen</span>
              </div>
            </Link>
          </div>

          {/* Navigation Desktop */}
          <div className="hidden lg:flex items-center gap-2">
            {isAuthenticated && !isAdmin() && (
              <>
                {[
                  { to: '/home', label: 'Accueil', icon: Home },
                  { to: '/my-reports', label: 'Mes signalements', icon: FileText },
                  { to: '/my-supports', label: 'Mes appuis', icon: ThumbsUp },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      isActive(item.to)
                        ? 'bg-turquoise/10 text-turquoise border border-turquoise/20'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </>
            )}

            {isAuthenticated && isAdmin() && (
              <>
                <Link
                  to="/admin/dashboard"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive('/admin/dashboard')
                      ? 'bg-turquoise/10 text-turquoise'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Tableau de bord
                </Link>
              </>
            )}

            <div className="h-8 w-px bg-white/10 mx-2" />

            {/* Menu utilisateur ou Connexion */}
            {isAuthenticated ? (
              <Menu as="div" className="relative ml-2">
                <Menu.Button className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-white/10 transition-all border border-transparent hover:border-white/10">
                  <div className="w-9 h-9 rounded-lg bg-turquoise/20 border border-turquoise/30 flex items-center justify-center">
                    <User className="h-5 w-5 text-turquoise" />
                  </div>
                  <div className="hidden xl:block text-left">
                    <p className="text-xs font-bold text-white leading-none mb-1">Mon Compte</p>
                    <p className="text-[10px] text-turquoise/70 font-medium truncate max-w-[100px]">
                      {user?.full_name?.split(' ')[0] || 'Utilisateur'}
                    </p>
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
                  <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl bg-navy-deep/95 backdrop-blur-xl shadow-2xl ring-1 ring-white/10 focus:outline-none overflow-hidden border border-white/10">
                    <div className="px-5 py-4 bg-white/5 border-b border-white/5">
                      <p className="text-sm font-bold text-white truncate">
                        {user?.full_name || user?.email}
                      </p>
                      <p className="text-[10px] text-turquoise/70 font-bold uppercase tracking-wider mt-1">
                        {isAdmin() ? 'Administrateur' : 'Citoyen'}
                      </p>
                    </div>

                    <div className="p-2">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/profile"
                            className={`${
                              active ? 'bg-white/10 text-turquoise' : 'text-white/70'
                            } flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-colors`}
                          >
                            <Settings className="h-4 w-4 mr-3" />
                            Paramètres du profil
                          </Link>
                        )}
                      </Menu.Item>

                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`${
                              active ? 'bg-red-500/10 text-red-500' : 'text-red-400'
                            } flex items-center w-full px-4 py-3 text-sm font-semibold rounded-xl transition-colors`}
                          >
                            <LogOut className="h-4 w-4 mr-3" />
                            Déconnexion
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              <div className="flex items-center gap-4">
                <Link 
                  to="/login"
                  className="text-white/70 hover:text-white font-semibold text-sm transition-colors"
                >
                  S'identifier
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2.5 rounded-xl bg-turquoise text-navy-deep font-bold text-sm shadow-lg shadow-turquoise/20 hover:scale-105 transition-all"
                >
                  Rejoindre
                </Link>
              </div>
            )}
          </div>

          {/* Menu Mobile Button */}
          <div className="lg:hidden flex items-center gap-4">
            {isAuthenticated && (
              <Link to="/notifications" className="relative p-2 text-white/70 hover:text-turquoise">
                <Bell className="h-6 w-6" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-turquoise rounded-full"></span>
              </Link>
            )}
            <Menu as="div" className="relative">
              <Menu.Button className="p-2 text-white/70">
                <MenuIcon className="h-7 w-7" />
              </Menu.Button>
              {/* Mobile items in Menu.Items could be added here if needed, 
                  but we'll keep it simple for now or rely on bottom nav */}
            </Menu>
          </div>
        </div>
      </div>

      {/* Navigation Mobile Bottom - Uniquement Citoyens Authentifiés */}
      {isAuthenticated && !isAdmin() && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-navy-deep/90 backdrop-blur-lg border-t border-white/10 z-[100] safe-area-pb">
          <div className="flex h-16">
            {[
              { to: '/home', label: 'Accueil', icon: Home },
              { to: '/my-reports', label: 'Mes Suivis', icon: FileText },
              { to: '/my-supports', label: 'Mes appuis', icon: ThumbsUp },
              { to: '/profile', label: 'Profil', icon: User },
            ].map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-all ${
                  isActive(to) ? 'text-turquoise' : 'text-white/40'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isActive(to) ? 'bg-turquoise/10' : ''}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
