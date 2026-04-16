import React, { Fragment } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { LogOut, User, Bell, Settings, Map, List, Tag, Users as UsersIcon, Building2, Home } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from './Button';

/**
 * Composant Navbar
 */
const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isSuperAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo et titre */}
          <div className="flex items-center">
            <Link
              to={isAdmin() ? "/admin/dashboard" : "/home"}
              className="flex items-center"
            >
              <Map className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Signalement 311
              </span>
            </Link>
          </div>

          {/* Navigation */}
          {isAuthenticated && (
            <div className="flex items-center gap-4">
              {!isAdmin() && (
                <>
                  <Link
                    to="/home"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Carte
                  </Link>
                  <Link
                    to="/reports"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Signalements
                  </Link>
                  <Link
                    to="/my-reports"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Mes signalements
                  </Link>
                </>
              )}

              {isAdmin() && (
                <>
                  <Link
                    to="/admin/dashboard"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Tableau de bord
                  </Link>
                  <Link
                    to="/admin/reports"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Signalements
                  </Link>

                  {/* Menu déroulant Gestion */}
                  <Menu as="div" className="relative">
                    <Menu.Button className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium flex items-center gap-1">
                      Gestion
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
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
                      <Menu.Items className="absolute left-0 mt-2 w-56 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                        <div className="py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/admin/categories"
                                className={`${
                                  active ? 'bg-gray-100' : ''
                                } flex items-center px-4 py-2 text-sm text-gray-700`}
                              >
                                <Tag className="h-4 w-4 mr-2" />
                                Catégories
                              </Link>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <Link
                                to="/admin/users"
                                className={`${
                                  active ? 'bg-gray-100' : ''
                                } flex items-center px-4 py-2 text-sm text-gray-700`}
                              >
                                <UsersIcon className="h-4 w-4 mr-2" />
                                Utilisateurs
                              </Link>
                            )}
                          </Menu.Item>
                          {isSuperAdmin() && (
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  to="/admin/municipalities"
                                  className={`${
                                    active ? 'bg-gray-100' : ''
                                  } flex items-center px-4 py-2 text-sm text-gray-700`}
                                >
                                  <Building2 className="h-4 w-4 mr-2" />
                                  Municipalités
                                </Link>
                              )}
                            </Menu.Item>
                          )}
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </>
              )}

              {/* Menu utilisateur */}
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center text-gray-700 hover:text-primary-600 focus:outline-none">
                  <User className="h-8 w-8 rounded-full bg-gray-200 p-1" />
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
                  <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.full_name || user?.email}
                      </p>
                      {user?.email && (
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      )}
                    </div>

                    <div className="py-1">
                      {!isAdmin() && (
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              to="/notifications"
                              className={`${
                                active ? 'bg-gray-100' : ''
                              } flex items-center px-4 py-2 text-sm text-gray-700`}
                            >
                              <Bell className="h-4 w-4 mr-2" />
                              Notifications
                            </Link>
                          )}
                        </Menu.Item>
                      )}

                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/settings"
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex items-center px-4 py-2 text-sm text-gray-700`}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Paramètres
                          </Link>
                        )}
                      </Menu.Item>

                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={handleLogout}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex items-center w-full px-4 py-2 text-sm text-red-600`}
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
          )}

          {/* Bouton de connexion si non authentifié */}
          {!isAuthenticated && (
            <div className="flex items-center">
              <Button variant="primary" onClick={() => navigate('/login')}>
                Se connecter
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>

      {/* Bottom navigation — mobile uniquement, citoyen seulement */}
      {isAuthenticated && !isAdmin() && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 safe-area-pb">
          <div className="flex">
            {[
              { to: '/home',       label: 'Accueil',      Icon: Home },
              { to: '/reports',    label: 'Signalements', Icon: List },
              { to: '/my-reports', label: 'Mes rapports', Icon: User },
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
    </>
  );

};

export default Navbar;
