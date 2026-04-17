import React, { useEffect, useState } from 'react';
import { Key, Copy, RefreshCw, Power, PowerOff, Search, Calendar, Settings2 } from 'lucide-react';
import { Card, Button, Spinner } from '../../components/common';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

const statusColors = {
  active: 'green',
  expiring: 'yellow',
  expired: 'red',
  inactive: 'gray'
};

const statusLabels = {
  active: 'Active',
  expiring: 'Expire bientôt',
  expired: 'Expirée',
  inactive: 'Inactive'
};

const ManageLicenses = () => {
  const [licenses, setLicenses] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '', q: '' });
  const [selected, setSelected] = useState(null);
  const [renewYears, setRenewYears] = useState(1);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [lic, cat] = await Promise.all([
        adminService.listLicenses(filter),
        adminService.getModulesCatalog()
      ]);
      setLicenses(lic.data || []);
      setCatalog(cat.data || []);
    } catch (e) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => { load(); };

  const openDetail = async (license) => {
    try {
      const res = await adminService.getLicense(license.id);
      setSelected(res.data);
      setRenewYears(1);
    } catch {
      toast.error('Erreur chargement licence');
    }
  };

  const toggleModule = async (key, value) => {
    if (!selected) return;
    try {
      const res = await adminService.updateLicenseModules(selected.id, { [key]: value });
      setSelected({ ...selected, features: res.data.features });
      toast.success('Modules mis à jour');
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur mise à jour');
    }
  };

  const doRenew = async () => {
    try {
      await adminService.renewLicense(selected.id, renewYears);
      toast.success(`Licence renouvelée de ${renewYears} an(s)`);
      const res = await adminService.getLicense(selected.id);
      setSelected(res.data);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur renouvellement');
    }
  };

  const toggleActive = async () => {
    try {
      if (selected.is_active) await adminService.deactivateLicense(selected.id);
      else await adminService.activateLicense(selected.id);
      const res = await adminService.getLicense(selected.id);
      setSelected(res.data);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur');
    }
  };

  const copyKey = (k) => {
    navigator.clipboard.writeText(k);
    toast.success('Clé copiée');
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size="lg" /></div>;

  return (
    <div className="py-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des licences</h1>
          <p className="text-gray-600 mt-2">Liste, renouvellement et activation des modules par mairie.</p>
        </div>
        <Button variant="outline" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
      </div>

      <Card>
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Rechercher clé, mairie, email…"
              className="input-field pl-9"
              value={filter.q}
              onChange={(e) => setFilter({ ...filter, q: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && applyFilter()} />
          </div>
          <select className="input-field" value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
            <option value="">Tous les statuts</option>
            <option value="active">Actives</option>
            <option value="expiring">Expirent bientôt</option>
            <option value="expired">Expirées</option>
            <option value="inactive">Désactivées</option>
          </select>
          <Button variant="primary" onClick={applyFilter}>Filtrer</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clé</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mairie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expire</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modules</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {licenses.map((l) => {
                const color = statusColors[l.status] || 'gray';
                const activeModules = Object.entries(l.features || {}).filter(([, v]) => v).length;
                return (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{l.license_key}</code>
                        <button onClick={() => copyKey(l.license_key)} className="text-gray-500 hover:text-primary-600">
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{l.municipality_name}</div>
                      <div className="text-xs text-gray-500">{l.contact_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-${color}-100 text-${color}-800`}>
                        {statusLabels[l.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(l.expires_at)}
                      <div className="text-xs text-gray-500">{l.daysRemaining >= 0 ? `${l.daysRemaining}j restants` : `${-l.daysRemaining}j de retard`}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{activeModules} actif(s)</td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="outline" onClick={() => openDetail(l)}>
                        <Settings2 className="h-4 w-4 mr-1" />Gérer
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {licenses.length === 0 && (
            <div className="text-center py-12 text-gray-500">Aucune licence trouvée</div>
          )}
        </div>
      </Card>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selected.municipality_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{selected.license_key}</code>
                  <button onClick={() => copyKey(selected.license_key)} className="text-gray-500 hover:text-primary-600">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-900 text-2xl leading-none">×</button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
              <div>
                <div className="text-gray-500 uppercase text-xs">Contact</div>
                <div>{selected.contact_email}</div>
                <div className="text-gray-500">{selected.contact_phone}</div>
              </div>
              <div>
                <div className="text-gray-500 uppercase text-xs">Expiration</div>
                <div>{formatDate(selected.expires_at)}</div>
                <div className={selected.isExpired ? 'text-red-600' : 'text-gray-500'}>
                  {selected.isExpired ? 'Expirée' : `${selected.daysRemaining}j restants`}
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Settings2 className="h-4 w-4" /> Modules
              </h3>
              <div className="space-y-2">
                {catalog.map((mod) => {
                  const enabled = Boolean(selected.features?.[mod.key]);
                  const disabled = !mod.implemented || mod.category === 'core';
                  return (
                    <label key={mod.key} className={`flex items-start justify-between gap-2 p-2 rounded border border-gray-100 ${disabled && !mod.implemented ? 'opacity-60' : ''}`}>
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {mod.name}
                          {mod.category === 'core' && <span className="ml-2 text-xs text-primary-600">(core)</span>}
                          {!mod.implemented && <span className="ml-2 text-xs text-gray-400">(bientôt)</span>}
                        </div>
                        <div className="text-xs text-gray-500">{mod.description}</div>
                      </div>
                      <input type="checkbox" className="rounded border-gray-300 mt-1"
                        checked={enabled}
                        disabled={disabled}
                        onChange={(e) => toggleModule(mod.key, e.target.checked)} />
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="border-t pt-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Renouvellement
              </h3>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm text-gray-700 mb-1">Années supplémentaires</label>
                  <input type="number" min={1} max={10} className="input-field"
                    value={renewYears}
                    onChange={(e) => setRenewYears(parseInt(e.target.value) || 1)} />
                </div>
                <Button variant="primary" onClick={doRenew}>Renouveler</Button>
              </div>
            </div>

            <div className="border-t pt-4 flex justify-between">
              <Button variant={selected.is_active ? 'secondary' : 'primary'} onClick={toggleActive}>
                {selected.is_active ? <><PowerOff className="h-4 w-4 mr-1" />Désactiver</> : <><Power className="h-4 w-4 mr-1" />Réactiver</>}
              </Button>
              <Button variant="outline" onClick={() => setSelected(null)}>Fermer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLicenses;
