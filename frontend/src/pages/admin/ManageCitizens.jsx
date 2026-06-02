import React, { useState, useEffect, useMemo } from 'react';
import { UsersRound, Search, Power, Check, Phone, Mail, ShieldAlert } from 'lucide-react';
import { Card, Spinner } from '../../components/common';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ManageCitizens = () => {
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => { loadCitizens(); }, []);

  const loadCitizens = async () => {
    setLoading(true);
    try {
      const res = await adminService.getUsers({ role: 'citizen' });
      setCitizens((res.data || []).filter((u) => u.role === 'citizen'));
    } catch (error) {
      console.error('Erreur chargement citoyens:', error);
      toast.error('Impossible de charger les citoyens');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (c) => {
    const isActive = c.is_active !== false;
    if (isActive && !confirm(`Bloquer ${c.full_name || 'ce citoyen'} ? Il ne pourra plus signaler ni se connecter.`)) return;
    setBusyId(c.id);
    try {
      await adminService.setUserActive(c.id, !isActive);
      toast.success(isActive ? 'Citoyen bloqué' : 'Citoyen réactivé');
      loadCitizens();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return citizens;
    return citizens.filter((c) =>
      [c.full_name, c.email, c.phone].filter(Boolean).some((v) => v.toLowerCase().includes(q))
    );
  }, [citizens, search]);

  const stats = {
    total: citizens.length,
    active: citizens.filter((c) => c.is_active !== false).length,
    blocked: citizens.filter((c) => c.is_active === false).length,
  };

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size="lg" className="text-turquoise" /></div>;
  }

  const Contact = ({ c }) => (
    <div className="space-y-0.5">
      {c.phone && <div className="flex items-center gap-1.5 text-slate-600"><Phone className="h-3.5 w-3.5 text-slate-400" />{c.phone}</div>}
      {c.email && <div className="flex items-center gap-1.5 text-slate-500 text-xs"><Mail className="h-3.5 w-3.5 text-slate-400" />{c.email}</div>}
      {!c.phone && !c.email && <span className="text-slate-400 text-xs italic">Compte appareil</span>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-navy-deep tracking-tight">Citoyens</h1>
        <p className="text-slate-500 text-sm mt-0.5">Comptes citoyens de votre municipalité.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 max-w-2xl">
        {[
          { label: 'Total', value: stats.total, icon: UsersRound, color: 'text-navy-deep', bg: 'bg-navy-deep/10' },
          { label: 'Actifs', value: stats.active, icon: Check, color: 'text-emerald-600', bg: 'bg-emerald-100' },
          { label: 'Bloqués', value: stats.blocked, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-100' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl ${s.bg} flex items-center justify-center`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
            <div><p className="text-2xl font-extrabold text-navy-deep leading-none">{s.value}</p><p className="text-xs text-slate-400 font-semibold uppercase mt-1">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (nom, email, téléphone)…"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-turquoise/30 focus:border-turquoise outline-none"
        />
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <UsersRound className="h-10 w-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 font-medium">{search ? 'Aucun citoyen ne correspond.' : 'Aucun citoyen pour le moment.'}</p>
        </div>
      ) : (
        <>
          {/* Desktop */}
          <Card className="border border-slate-100 shadow-sm p-0 overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Citoyen</th>
                    <th className="px-5 py-3 font-semibold">Contact</th>
                    <th className="px-5 py-3 font-semibold">Inscrit le</th>
                    <th className="px-5 py-3 font-semibold">Statut</th>
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((c) => {
                    const isActive = c.is_active !== false;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
                              {c.full_name?.charAt(0).toUpperCase() || 'C'}
                            </div>
                            <span className="font-bold text-navy-deep">{c.full_name || 'Citoyen'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm"><Contact c={c} /></td>
                        <td className="px-5 py-3 text-slate-600">{formatDate(c.created_at)}</td>
                        <td className="px-5 py-3">
                          {isActive
                            ? <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-emerald-100 text-emerald-700">Actif</span>
                            : <span className="px-2 py-1 inline-flex text-xs font-semibold rounded-full bg-red-100 text-red-700">Bloqué</span>}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end">
                            <button onClick={() => handleToggleActive(c)} disabled={busyId === c.id}
                              title={isActive ? 'Bloquer' : 'Réactiver'}
                              className={`p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 ${isActive ? 'text-slate-500 hover:text-red-600' : 'text-emerald-600'}`}>
                              <Power className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {filtered.map((c) => {
              const isActive = c.is_active !== false;
              return (
                <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-navy-deep truncate">{c.full_name || 'Citoyen'}</p>
                      <div className="text-xs mt-1"><Contact c={c} /></div>
                    </div>
                    {isActive
                      ? <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 text-emerald-700">Actif</span>
                      : <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-red-100 text-red-700">Bloqué</span>}
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Inscrit le {formatDate(c.created_at)}</span>
                    <button onClick={() => handleToggleActive(c)} disabled={busyId === c.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg ${isActive ? 'text-red-600 bg-red-50' : 'text-emerald-700 bg-emerald-50'}`}>
                      <Power className="h-3.5 w-3.5" /> {isActive ? 'Bloquer' : 'Réactiver'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default ManageCitizens;
