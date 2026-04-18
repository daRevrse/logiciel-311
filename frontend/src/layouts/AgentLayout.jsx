import { LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

/**
 * Layout agent : header minimal (logo, nom, logout) + contenu.
 * Mobile-first. Pas de navigation pour l'instant (C2/C3).
 */
const AgentLayout = ({ children }) => {
  const { user, logout, municipality } = useAuth();

  const logoUrl = municipality?.logo_url || user?.municipality?.logo_url || null;
  const fullName = user?.full_name || user?.fullName || 'Agent';

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <header className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="h-9 w-9 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">
                311
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                {fullName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Espace agent
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
