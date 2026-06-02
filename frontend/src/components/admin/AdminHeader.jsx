import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { LogOut, User, Menu as MenuIcon, ShieldCheck, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { resolveImageUrl } from '../../utils/url';

const AdminHeader = ({ title, onMenuClick }) => {
  const { user, logout, isSuperAdmin, municipality } = useAuth();
  const navigate = useNavigate();
  const superAdmin = isSuperAdmin && isSuperAdmin();

  const license = municipality?.license;
  const isLicenseExpired = license?.expires_at ? new Date(license.expires_at) < new Date() : false;
  const isLicenseInactive = license?.is_active === false || isLicenseExpired;

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
      {/* Alerte licence */}
      {isLicenseInactive && !superAdmin && (
        <div className="w-full bg-red-600 text-white px-4 py-2 text-sm font-bold flex items-center justify-center gap-2 z-50">
          <ShieldCheck className="h-4 w-4" />
          <span>Licence {isLicenseExpired ? 'expirée' : 'inactive'}. Certaines fonctionnalités peuvent être limitées.</span>
        </div>
      )}

      <header className="sticky top-0 z-30 flex justify-between items-center px-4 lg:px-8 w-full h-16 bg-white/90 backdrop-blur-md border-b border-slate-200">
        {/* Gauche : menu mobile + titre + contexte */}
        <div className="flex items-center gap-3 lg:gap-5 min-w-0">
          <button onClick={onMenuClick} className="lg:hidden text-slate-500 hover:text-navy-deep hover:bg-slate-100 p-1.5 rounded-lg transition-colors flex-shrink-0">
            <MenuIcon className="h-6 w-6" />
          </button>

          <h2 className="text-xl font-bold text-navy-deep whitespace-nowrap flex-shrink-0">
            {title}
          </h2>

          {/* Pastille contexte */}
          <span className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold truncate ${
            superAdmin ? 'bg-amber-100 text-amber-800' : 'bg-turquoise/10 text-turquoise-dark'
          }`}>
            {superAdmin ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5" />
                Vue système
              </>
            ) : (
              <>
                {municipality?.logo_url ? (
                  <img src={resolveImageUrl(municipality.logo_url)} alt="" className="h-4 w-4 rounded object-contain bg-white" />
                ) : (
                  <Building2 className="h-3.5 w-3.5" />
                )}
                <span className="truncate max-w-[160px]">{municipality?.name || 'Ma mairie'}</span>
              </>
            )}
          </span>
        </div>

        {/* Droite : profil */}
        <Menu as="div" className="relative flex-shrink-0">
          <Menu.Button className="flex items-center gap-3 pl-2 focus:outline-none group">
            <span className="text-sm font-semibold text-slate-700 hidden md:block group-hover:text-turquoise-dark transition-colors">
              {user?.full_name || user?.email || 'Administrateur'}
            </span>
            <div className="w-9 h-9 rounded-full bg-navy-deep flex items-center justify-center text-turquoise transition-transform group-hover:scale-105">
              <User className="h-4 w-4" />
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
            <Menu.Items className="absolute right-0 mt-2 w-52 origin-top-right rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 focus:outline-none z-10 p-1">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-sm font-bold text-navy-deep truncate">{user?.full_name || 'Admin'}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold truncate">
                  {user?.role === 'super_admin' ? 'Super administrateur' : user?.role === 'admin' ? 'Administrateur' : (user?.role || 'Gestionnaire')}
                </p>
              </div>
              <div className="py-1">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`flex items-center w-full px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors ${active ? 'bg-red-50 text-red-600' : 'text-red-500'}`}
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
    </>
  );
};

export default AdminHeader;
