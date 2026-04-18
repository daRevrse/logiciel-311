import React, { useEffect, useMemo, useState } from 'react';
import { Palette, Phone, Globe, Upload, Loader2, Save } from 'lucide-react';
import adminService from '../../services/adminService';
import { resolveImageUrl } from '../../utils/url';

const DAYS = [
  { key: 'monday',    label: 'Lundi' },
  { key: 'tuesday',   label: 'Mardi' },
  { key: 'wednesday', label: 'Mercredi' },
  { key: 'thursday',  label: 'Jeudi' },
  { key: 'friday',    label: 'Vendredi' },
  { key: 'saturday',  label: 'Samedi' },
  { key: 'sunday',    label: 'Dimanche' },
];

const DEFAULT_HOURS = DAYS.reduce((acc, d) => {
  acc[d.key] = { open: '09:00', close: '17:00' };
  return acc;
}, {});

const TABS = [
  { id: 'branding',    label: 'Branding',     icon: Palette },
  { id: 'coordonnees', label: 'Coordonnées',  icon: Phone },
  { id: 'public',      label: 'Page publique', icon: Globe },
];

const MAX_LOGO_BYTES   = 2 * 1024 * 1024;
const MAX_BANNER_BYTES = 5 * 1024 * 1024;

const MunicipalitySettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [activeTab, setActiveTab] = useState('branding');
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

  const [initial, setInitial] = useState(null);
  const [form, setForm] = useState({
    primary_color: '#1e40af',
    secondary_color: '#2bb673',
    display_name: '',
    public_description: '',
    address: '',
    contact_phone: '',
    contact_email: '',
    public_hours: DEFAULT_HOURS,
    priority_support_threshold: 1,
    logo_url: '',
    banner_url: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await adminService.getMunicipalitySettings();
      const s = data?.data || data || {};
      const hours = (s.public_hours && typeof s.public_hours === 'object') ? s.public_hours : DEFAULT_HOURS;
      const next = {
        primary_color: s.primary_color || '#1e40af',
        secondary_color: s.secondary_color || '#2bb673',
        display_name: s.display_name || '',
        public_description: s.public_description || '',
        address: s.address || '',
        contact_phone: s.contact_phone || '',
        contact_email: s.contact_email || '',
        public_hours: { ...DEFAULT_HOURS, ...hours },
        priority_support_threshold: s.priority_support_threshold ?? 1,
        logo_url: s.logo_url || '',
        banner_url: s.banner_url || '',
      };
      setForm(next);
      setInitial(next);
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Impossible de charger les paramètres.' });
    } finally {
      setLoading(false);
    }
  };

  const setField = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const setDayHours = (dayKey, patch) => {
    setForm((f) => ({
      ...f,
      public_hours: {
        ...f.public_hours,
        [dayKey]: { ...(f.public_hours?.[dayKey] || {}), ...patch },
      },
    }));
  };

  const toggleDayClosed = (dayKey, closed) => {
    setForm((f) => ({
      ...f,
      public_hours: {
        ...f.public_hours,
        [dayKey]: closed ? { closed: true } : { open: '09:00', close: '17:00' },
      },
    }));
  };

  const changedPayload = useMemo(() => {
    if (!initial) return {};
    const keys = [
      'primary_color', 'secondary_color', 'display_name', 'public_description',
      'address', 'contact_phone', 'contact_email', 'public_hours', 'priority_support_threshold',
    ];
    const payload = {};
    for (const k of keys) {
      const a = form[k];
      const b = initial[k];
      if (JSON.stringify(a) !== JSON.stringify(b)) payload[k] = a;
    }
    return payload;
  }, [form, initial]);

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Logo : PNG ou JPEG uniquement.' });
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setMessage({ type: 'error', text: 'Logo : taille maximale 2 Mo.' });
      return;
    }
    setUploadingLogo(true);
    setMessage(null);
    try {
      const res = await adminService.uploadMunicipalityLogo(file);
      const url = res?.url || res?.data?.url;
      if (url) {
        setForm((f) => ({ ...f, logo_url: url }));
        setInitial((i) => i ? { ...i, logo_url: url } : i);
      }
      setMessage({ type: 'success', text: 'Logo mis à jour.' });
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Échec de l\'upload du logo.' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleBannerChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Bannière : PNG ou JPEG uniquement.' });
      return;
    }
    if (file.size > MAX_BANNER_BYTES) {
      setMessage({ type: 'error', text: 'Bannière : taille maximale 5 Mo.' });
      return;
    }
    setUploadingBanner(true);
    setMessage(null);
    try {
      const res = await adminService.uploadMunicipalityBanner(file);
      const url = res?.url || res?.data?.url;
      if (url) {
        setForm((f) => ({ ...f, banner_url: url }));
        setInitial((i) => i ? { ...i, banner_url: url } : i);
      }
      setMessage({ type: 'success', text: 'Bannière mise à jour.' });
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Échec de l\'upload de la bannière.' });
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    if (Object.keys(changedPayload).length === 0) {
      setMessage({ type: 'success', text: 'Aucune modification à enregistrer.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await adminService.updateMunicipalitySettings(changedPayload);
      const s = res?.data || res || {};
      const hours = (s.public_hours && typeof s.public_hours === 'object') ? s.public_hours : form.public_hours;
      const next = {
        ...form,
        primary_color: s.primary_color ?? form.primary_color,
        secondary_color: s.secondary_color ?? form.secondary_color,
        display_name: s.display_name ?? form.display_name,
        public_description: s.public_description ?? form.public_description,
        address: s.address ?? form.address,
        contact_phone: s.contact_phone ?? form.contact_phone,
        contact_email: s.contact_email ?? form.contact_email,
        public_hours: { ...DEFAULT_HOURS, ...hours },
        priority_support_threshold: s.priority_support_threshold ?? form.priority_support_threshold,
        logo_url: s.logo_url ?? form.logo_url,
        banner_url: s.banner_url ?? form.banner_url,
      };
      setForm(next);
      setInitial(next);
      setMessage({ type: 'success', text: 'Paramètres enregistrés.' });
    } catch (err) {
      setMessage({ type: 'error', text: err?.response?.data?.message || 'Échec de l\'enregistrement.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Chargement…
      </div>
    );
  }

  return (
    <div className="pb-28 lg:pb-0">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Paramètres de la municipalité</h1>
        <p className="text-sm text-slate-500 mt-1">Personnalisez l'identité visuelle et les informations publiques.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto border-b border-slate-200 dark:border-slate-800">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {message && (
        <div className={`mb-4 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800 p-5 lg:p-8">
        {activeTab === 'branding' && (
          <div className="space-y-8">
            {/* Logo */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Logo</label>
              <div className="flex items-center gap-4 flex-wrap">
                <div className="w-24 h-24 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                  {form.logo_url ? (
                    <img src={resolveImageUrl(form.logo_url)} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-xs text-slate-400">Aucun logo</span>
                  )}
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Remplacer le logo
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoChange} disabled={uploadingLogo} />
                </label>
                <span className="text-xs text-slate-500">PNG/JPEG, 2 Mo max.</span>
              </div>
            </div>

            {/* Banner */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Bannière</label>
              <div className="space-y-3">
                <div className="w-full aspect-[4/1] rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  {form.banner_url ? (
                    <img src={resolveImageUrl(form.banner_url)} alt="Bannière" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-slate-400">Aucune bannière</span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                    {uploadingBanner ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    Remplacer la bannière
                    <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleBannerChange} disabled={uploadingBanner} />
                  </label>
                  <span className="text-xs text-slate-500">PNG/JPEG, 5 Mo max.</span>
                </div>
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Couleur primaire</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => setField('primary_color', e.target.value)}
                    className="h-12 w-16 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-sm text-slate-700 dark:text-slate-200">{form.primary_color}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Couleur secondaire</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.secondary_color}
                    onChange={(e) => setField('secondary_color', e.target.value)}
                    className="h-12 w-16 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-sm text-slate-700 dark:text-slate-200">{form.secondary_color}</span>
                </div>
              </div>
            </div>

            {/* Live preview */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Aperçu</label>
              <div
                className="rounded-xl p-5 shadow-sm"
                style={{ backgroundColor: form.primary_color, color: '#fff' }}
              >
                <div className="text-xs uppercase tracking-widest opacity-80 mb-1">{form.display_name || 'Votre municipalité'}</div>
                <div className="text-xl font-bold mb-3">Signaler un problème</div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: form.secondary_color, color: '#fff' }}
                >
                  Action principale
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'coordonnees' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Adresse</label>
              <textarea
                value={form.address}
                onChange={(e) => setField('address', e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="123 rue de la Mairie, …"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Téléphone</label>
                <input
                  type="text"
                  value={form.contact_phone}
                  onChange={(e) => setField('contact_phone', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="+1 514 555 0123"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Courriel</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setField('contact_email', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="contact@mairie.qc.ca"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Heures d'ouverture</label>
              <div className="space-y-2">
                {DAYS.map(({ key, label }) => {
                  const entry = form.public_hours?.[key] || {};
                  const closed = !!entry.closed;
                  return (
                    <div key={key} className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                      <div className="w-24 text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</div>
                      <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={closed}
                          onChange={(e) => toggleDayClosed(key, e.target.checked)}
                        />
                        Fermé
                      </label>
                      {!closed && (
                        <>
                          <input
                            type="time"
                            value={entry.open || '09:00'}
                            onChange={(e) => setDayHours(key, { open: e.target.value })}
                            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-sm"
                          />
                          <span className="text-xs text-slate-400">à</span>
                          <input
                            type="time"
                            value={entry.close || '17:00'}
                            onChange={(e) => setDayHours(key, { close: e.target.value })}
                            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-sm"
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'public' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Nom affiché</label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => setField('display_name', e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Ville de …"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Description publique</label>
              <textarea
                value={form.public_description}
                onChange={(e) => setField('public_description', e.target.value)}
                rows={5}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Présentation de la municipalité, mission, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Seuil de support prioritaire</label>
              <input
                type="number"
                min={1}
                value={form.priority_support_threshold}
                onChange={(e) => setField('priority_support_threshold', Number(e.target.value))}
                className="w-40 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-xs text-slate-500 mt-1">Nombre minimal d'appuis pour bascule en support prioritaire.</p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky save bar (mobile) */}
      <div className="fixed bottom-0 left-0 right-0 lg:static lg:mt-6 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 lg:border-0 lg:bg-transparent lg:dark:bg-transparent p-4 lg:p-0 flex items-center justify-end gap-3">
        {message && (
          <span className={`hidden lg:block text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
            {message.text}
          </span>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer
        </button>
      </div>
    </div>
  );
};

export default MunicipalitySettings;
