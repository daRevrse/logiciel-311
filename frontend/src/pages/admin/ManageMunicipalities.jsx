import React, { useState, useEffect } from 'react';
import {
  Plus, Edit, Trash2, Check, X, Building2, RefreshCw, Key, Copy, Eye, EyeOff
} from 'lucide-react';
import { Card, Button, Spinner } from '../../components/common';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const emptyForm = () => ({
  name: '',
  region: '',
  country: 'Togo',
  contact_email: '',
  contact_phone: '+228',
  address: '',
  is_active: true,
  license_duration_years: 1,
  admin_full_name: '',
  admin_email: '',
  admin_phone: '+228',
  modules: {}
});

const ManageMunicipalities = () => {
  const [municipalities, setMunicipalities] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMunicipality, setEditingMunicipality] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [createdResult, setCreatedResult] = useState(null);
  const [revealPassword, setRevealPassword] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [munisRes, catRes] = await Promise.all([
        adminService.getMunicipalities(),
        adminService.getModulesCatalog().catch(() => ({ data: [] }))
      ]);
      setMunicipalities(munisRes.data || []);
      const cat = catRes.data || [];
      setCatalog(cat);
      // initialize default modules for form
      const defaults = {};
      cat.forEach((m) => { defaults[m.key] = m.defaultEnabled; });
      setFormData((prev) => ({ ...prev, modules: defaults }));
    } catch (e) {
      console.error(e);
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (municipality = null) => {
    const defaults = {};
    catalog.forEach((m) => { defaults[m.key] = m.defaultEnabled; });

    if (municipality) {
      setEditingMunicipality(municipality);
      setFormData({
        ...emptyForm(),
        modules: defaults,
        name: municipality.name,
        region: municipality.region || '',
        country: municipality.country || 'Togo',
        contact_email: municipality.contact_email || '',
        contact_phone: municipality.contact_phone || '+228',
        address: municipality.address || '',
        is_active: municipality.is_active !== false
      });
    } else {
      setEditingMunicipality(null);
      setFormData({ ...emptyForm(), modules: defaults });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMunicipality(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMunicipality) {
        const { admin_full_name, admin_email, admin_phone, modules, ...payload } = formData;
        await adminService.updateMunicipality(editingMunicipality.id, payload);
        toast.success('Municipalité modifiée');
        handleCloseModal();
        loadAll();
      } else {
        const payload = {
          name: formData.name,
          region: formData.region,
          country: formData.country,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          address: formData.address,
          is_active: formData.is_active,
          license_duration_years: formData.license_duration_years,
          modules: formData.modules,
          admin_user: {
            full_name: formData.admin_full_name,
            email: formData.admin_email,
            phone: formData.admin_phone
          }
        };
        const res = await adminService.createMunicipality(payload);
        toast.success('Municipalité + licence + admin créés');
        setCreatedResult(res.data);
        handleCloseModal();
        loadAll();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Désactiver cette municipalité ?')) return;
    try {
      await adminService.deleteMunicipality(id);
      toast.success('Municipalité désactivée');
      loadAll();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const copyToClipboard = (value, label) => {
    navigator.clipboard.writeText(value);
    toast.success(`${label} copié`);
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const getLicenseStatus = (m) => {
    if (!m.license) return { label: 'Aucune licence', color: 'gray' };
    const l = m.license;
    const now = new Date();
    const expiresAt = new Date(l.expires_at);
    if (!l.is_active) return { label: 'Inactive', color: 'gray' };
    if (expiresAt < now) return { label: 'Expirée', color: 'red' };
    const d = Math.ceil((expiresAt - now) / 86400000);
    if (d <= 30) return { label: `Expire dans ${d}j`, color: 'yellow' };
    return { label: 'Active', color: 'green' };
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des municipalités</h1>
          <p className="text-gray-600 mt-2">Créez une mairie, émettez sa licence, choisissez ses modules.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadAll}><RefreshCw className="h-4 w-4" /></Button>
          <Button variant="primary" onClick={() => handleOpenModal()}>
            <Plus className="h-4 w-4 mr-2" />Nouvelle municipalité
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Municipalité</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Licence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {municipalities.map((m) => {
                const s = getLicenseStatus(m);
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{m.name}</div>
                          <div className="text-sm text-gray-500">{m.region}{m.country ? `, ${m.country}` : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{m.contact_phone}</div>
                      <div className="text-sm text-gray-500">{m.contact_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-${s.color}-100 text-${s.color}-800`}>
                        {s.label}
                      </span>
                      {m.license && <div className="text-xs text-gray-500 mt-1">Jusqu'au {formatDate(m.license.expires_at)}</div>}
                    </td>
                    <td className="px-6 py-4">
                      {m.is_active ? (
                        <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                      ) : (
                        <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-red-100 text-red-800">Désactivée</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenModal(m)} className="text-blue-600 hover:text-blue-900">
                          <Edit className="h-4 w-4" />
                        </button>
                        {m.is_active && (
                          <button onClick={() => handleDelete(m.id)} className="text-red-600 hover:text-red-900">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {municipalities.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune municipalité</h3>
              <Button variant="primary" onClick={() => handleOpenModal()}>
                <Plus className="h-4 w-4 mr-2" />Créer une municipalité
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Modal création / édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingMunicipality ? 'Modifier la municipalité' : 'Nouvelle municipalité'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                  <input type="text" required minLength={3} maxLength={100}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Région *</label>
                  <input type="text" required minLength={2} maxLength={100}
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pays *</label>
                <input type="text" required value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email contact *</label>
                  <input type="email" required value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone * (+228…)</label>
                  <input type="tel" required pattern="^\+?228[0-9]{8}$"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
                <textarea rows={2} maxLength={255} value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input-field" />
              </div>

              {!editingMunicipality && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durée licence initiale (années)</label>
                    <input type="number" min={1} max={10}
                      value={formData.license_duration_years}
                      onChange={(e) => setFormData({ ...formData, license_duration_years: parseInt(e.target.value) })}
                      className="input-field" />
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Modules activés</h3>
                    <div className="space-y-2">
                      {catalog.map((mod) => {
                        const isCore = mod.category === 'core';
                        const disabled = !mod.implemented || isCore;
                        return (
                          <label key={mod.key} className={`flex items-start gap-2 ${disabled && !isCore ? 'opacity-50' : ''}`}>
                            <input type="checkbox" className="rounded border-gray-300 mt-1"
                              checked={Boolean(formData.modules[mod.key])}
                              disabled={disabled}
                              onChange={(e) => setFormData({
                                ...formData,
                                modules: { ...formData.modules, [mod.key]: e.target.checked }
                              })} />
                            <div>
                              <div className="text-sm font-medium text-gray-800">
                                {mod.name}
                                {isCore && <span className="ml-2 text-xs text-primary-600">(core)</span>}
                                {!mod.implemented && <span className="ml-2 text-xs text-gray-400">(bientôt disponible)</span>}
                              </div>
                              <div className="text-xs text-gray-500">{mod.description}</div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Premier administrateur</h3>
                    <div className="space-y-3">
                      <input type="text" required placeholder="Nom complet" className="input-field"
                        value={formData.admin_full_name}
                        onChange={(e) => setFormData({ ...formData, admin_full_name: e.target.value })} />
                      <input type="email" required placeholder="Email" className="input-field"
                        value={formData.admin_email}
                        onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })} />
                      <input type="tel" required pattern="^\+?228[0-9]{8}$" placeholder="+228XXXXXXXX" className="input-field"
                        value={formData.admin_phone}
                        onChange={(e) => setFormData({ ...formData, admin_phone: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <input type="checkbox" id="is_active" className="rounded border-gray-300"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                <label htmlFor="is_active" className="text-sm text-gray-700">Municipalité active</label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="secondary" onClick={handleCloseModal} fullWidth>Annuler</Button>
                <Button type="submit" variant="primary" fullWidth>
                  {editingMunicipality ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal récap après création */}
      {createdResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Création réussie</h2>
            <p className="text-sm text-gray-600 mb-4">
              Communiquez ces informations à l'administrateur de la mairie. Le mot de passe temporaire ne sera
              plus affiché après la fermeture de cette fenêtre.
            </p>

            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-500 uppercase text-xs mb-1">Mairie</div>
                <div className="font-semibold">{createdResult.municipality?.name}</div>
              </div>
              <div>
                <div className="text-gray-500 uppercase text-xs mb-1">Clé de licence</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 px-3 py-2 rounded">{createdResult.license?.license_key}</code>
                  <button type="button" onClick={() => copyToClipboard(createdResult.license.license_key, 'Clé')}
                    className="text-primary-600"><Copy className="h-4 w-4" /></button>
                </div>
              </div>
              <div>
                <div className="text-gray-500 uppercase text-xs mb-1">Admin</div>
                <div>{createdResult.admin?.full_name} — {createdResult.admin?.email}</div>
              </div>
              <div>
                <div className="text-gray-500 uppercase text-xs mb-1">Mot de passe temporaire</div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 px-3 py-2 rounded">
                    {revealPassword ? createdResult.admin?.temp_password : '••••••••'}
                  </code>
                  <button type="button" onClick={() => setRevealPassword(!revealPassword)} className="text-gray-600">
                    {revealPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button type="button" onClick={() => copyToClipboard(createdResult.admin.temp_password, 'Mot de passe')}
                    className="text-primary-600"><Copy className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Email d'activation {createdResult.email_sent ? 'envoyé' : 'non envoyé (SMTP non configuré)'}.
              </div>
            </div>

            <div className="mt-6">
              <Button variant="primary" fullWidth onClick={() => { setCreatedResult(null); setRevealPassword(false); }}>
                J'ai bien noté
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageMunicipalities;
