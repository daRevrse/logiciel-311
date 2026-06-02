import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { resolveImageUrl } from '../utils/url';

/**
 * Layout agent : header minimal (logo, nom, logout) + contenu.
 * Mobile-first. Pas de navigation pour l'instant (C2/C3).
 */
const AgentLayout = ({ children }) => {
  const { user, logout, municipality } = useAuth();
  const navigate = useNavigate();

  const logoUrl = municipality?.logo_url || user?.municipality?.logo_url || null;
  const fullName = user?.full_name || user?.fullName || 'Agent';

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const license = municipality?.license || user?.municipality?.license || null;
  const isLicenseExpired = license?.expires_at ? new Date(license.expires_at) < new Date() : false;
  const isLicenseInactive = license?.is_active === false || isLicenseExpired;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {isLicenseInactive && (
        <div className="w-full bg-red-600 text-white px-4 py-2 text-xs font-bold text-center animate-pulse z-50">
          ⚠️ Licence inactive ou expirée. Contactez votre administrateur.
        </div>
      )}
      <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {logoUrl ? (
              <img
                src={resolveImageUrl(logoUrl)}
                alt="Logo"
                className="h-9 w-9 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-1 flex-shrink-0">
                <img src="/logo_muno.png" alt="Muno" className="w-full h-full object-contain" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-navy-deep truncate">
                {fullName}
              </p>
              <p className="text-xs text-turquoise-dark font-medium truncate">
                Espace agent{municipality?.name ? ` · ${municipality.name}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Se déconnecter"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="max-w-3xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AgentLayout;
