import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserRound, Mail, Phone, Bell, Save, Loader2, Building2, LogOut } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const DEFAULT_PREFS = {
  email_status_change: true,
  email_new_comment: true,
  email_resolution: true,
  inapp_status_change: true,
  inapp_new_comment: true
};

const field =
  'w-full pl-9 pr-3 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-turquoise/30 focus:border-turquoise';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [municipalityName, setMunicipalityName] = useState(user?.municipality?.name || '');
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/auth/profile');
        const u = res.data?.data?.user || res.data?.data || res.data;
        setFullName(u.full_name || '');
        setEmail(u.email || '');
        setPhone(u.phone || '');
        if (u.municipality?.name) setMunicipalityName(u.municipality.name);
        const np = u.notification_preferences;
        if (np) {
          const parsed = typeof np === 'string' ? JSON.parse(np) : np;
          setPrefs({ ...DEFAULT_PREFS, ...parsed });
        }
      } catch (err) {
        toast.error('Impossible de charger le profil');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      await api.put('/auth/profile', { full_name: fullName, email, phone: phone || null });
      toast.success('Profil enregistré');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  async function savePrefs() {
    try {
      await api.put('/notifications/preferences', prefs);
      toast.success('Préférences enregistrées');
    } catch (err) {
      toast.error('Erreur préférences');
    }
  }

  function togglePref(key) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="animate-spin w-5 h-5" />
      </div>
    );
  }

  const prefRows = [
    { key: 'email_status_change', label: 'Email — Changement de statut' },
    { key: 'email_new_comment', label: 'Email — Nouveau message' },
    { key: 'email_resolution', label: 'Email — Résolution' },
    { key: 'inapp_status_change', label: 'In-app — Changement de statut' },
    { key: 'inapp_new_comment', label: 'In-app — Nouveau message' }
  ];

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      {/* En-tête profil */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-navy-deep flex items-center justify-center text-turquoise shrink-0">
          <UserRound className="w-8 h-8" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-navy-deep tracking-tight truncate">{fullName || 'Mon profil'}</h1>
          {municipalityName && (
            <span className="inline-flex items-center gap-1.5 mt-1 text-xs font-semibold text-gray-500">
              <Building2 className="w-3.5 h-3.5 text-turquoise" />
              {municipalityName}
            </span>
          )}
        </div>
      </div>

      {/* Informations */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">Informations</h2>

        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1.5">Nom complet</label>
          <div className="relative">
            <UserRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={field} />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1.5">Email</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 block mb-1.5">Téléphone</label>
          <div className="relative">
            <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={field} placeholder="Optionnel" />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-turquoise text-navy-deep text-sm font-bold disabled:opacity-50 hover:bg-turquoise/90 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>
      </section>

      {/* Préférences */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-turquoise" /> Préférences de notification
        </h2>
        <ul className="divide-y divide-gray-100">
          {prefRows.map((row) => (
            <li key={row.key} className="flex items-center justify-between py-3">
              <span className="text-sm text-gray-700">{row.label}</span>
              <button
                type="button"
                onClick={() => togglePref(row.key)}
                role="switch"
                aria-checked={!!prefs[row.key]}
                className={`relative w-11 h-6 rounded-full transition-colors ${prefs[row.key] ? 'bg-turquoise' : 'bg-gray-300'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transform transition-transform ${prefs[row.key] ? 'translate-x-5' : ''}`}
                />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex justify-end mt-4">
          <button
            onClick={savePrefs}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-deep text-white text-sm font-semibold hover:bg-navy-deep/90 transition-colors"
          >
            <Save className="w-4 h-4" /> Enregistrer les préférences
          </button>
        </div>
      </section>

      {/* Déconnexion */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white border border-rose-200 text-rose-600 font-bold hover:bg-rose-50 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Se déconnecter
      </button>
    </div>
  );
}
