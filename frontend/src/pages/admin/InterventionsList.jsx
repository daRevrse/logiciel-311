import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Edit, Wrench, Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';
import InterventionDetailModal from '../../components/admin/InterventionDetailModal';

const PAGE_LIMIT = 20;

const STATUS_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'pending', label: 'En attente' },
  { value: 'scheduled', label: 'Planifiée' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminée' },
  { value: 'cancelled', label: 'Annulée' }
];

const STATUS_BADGE = {
  pending: 'bg-slate-200 text-slate-700',
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-slate-200 text-slate-500'
};

const STATUS_LABEL = {
  pending: 'En attente',
  scheduled: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée'
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[status] || 'bg-slate-200 text-slate-700'}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch { return '—'; }
}

const InterventionsList = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(PAGE_LIMIT);
  const [page, setPage] = useState(1);

  const [agents, setAgents] = useState([]);
  const [categories, setCategories] = useState([]);

  const [filters, setFilters] = useState({ status: '', agent_id: '', category_id: '' });

  const [selectedId, setSelectedId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit };
      if (filters.status) params.status = filters.status;
      if (filters.agent_id) params.agent_id = filters.agent_id;
      if (filters.category_id) params.category_id = filters.category_id;
      const res = await adminService.listInterventions(params);
      const list = res?.data || res?.interventions || (Array.isArray(res) ? res : []);
      setItems(list);
      setTotal(res?.total ?? res?.pagination?.total ?? list.length);
      setLimit(res?.limit ?? res?.pagination?.limit ?? limit);
    } catch (err) {
      console.error('Erreur chargement interventions:', err);
      toast.error('Impossible de charger les interventions');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    (async () => {
      try {
        const res = await adminService.listAgents({ limit: 200 });
        const list = res?.data || res?.agents || (Array.isArray(res) ? res : []);
        setAgents(list);
      } catch { /* ignore */ }
      try {
        const res = await adminService.listAdminCategories();
        const list = res?.data || res?.categories || (Array.isArray(res) ? res : []);
        setCategories(list);
      } catch { /* ignore */ }
    })();
  }, []);

  const openDetail = (id) => {
    setSelectedId(id);
    setDetailOpen(true);
  };

  const resetFilters = () => {
    setFilters({ status: '', agent_id: '', category_id: '' });
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || PAGE_LIMIT)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Interventions</h1>
        <p className="text-sm text-slate-500 mt-1">Suivi des interventions assignées aux agents.</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Statut</label>
            <select
              value={filters.status}
              onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Agent</label>
            <select
              value={filters.agent_id}
              onChange={(e) => { setFilters((f) => ({ ...f, agent_id: e.target.value })); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="">Tous les agents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.full_name || a.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Catégorie</label>
            <select
              value={filters.category_id}
              onChange={(e) => { setFilters((f) => ({ ...f, category_id: e.target.value })); setPage(1); }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
            >
              <option value="">Toutes</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
            >
              <RefreshCw className="h-4 w-4" /> Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Chargement…
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Wrench className="h-10 w-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 dark:text-slate-300 font-medium">Aucune intervention trouvée.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Signalement</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold">Agent</th>
                  <th className="px-4 py-3 font-semibold">Date prévue</th>
                  <th className="px-4 py-3 font-semibold">Créée le</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((iv) => (
                  <tr key={iv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDetail(iv.id)}
                        className="text-left font-medium text-slate-900 dark:text-slate-100 hover:text-primary hover:underline"
                      >
                        {iv.report?.title || `Signalement #${iv.report_id}`}
                      </button>
                      {iv.report?.category && (
                        <div
                          className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: iv.report.category.color ? `${iv.report.category.color}20` : '#e2e8f0', color: iv.report.category.color || '#334155' }}
                        >
                          {iv.report.category.name}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={iv.status} /></td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {iv.agent?.full_name || iv.agent?.email || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(iv.scheduled_at)}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{formatDate(iv.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => openDetail(iv.id)}
                          className="p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {items.map((iv) => (
              <div key={iv.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => openDetail(iv.id)}
                    className="text-left font-semibold text-slate-900 dark:text-slate-100 hover:text-primary flex-1 min-w-0 truncate"
                  >
                    {iv.report?.title || `Signalement #${iv.report_id}`}
                  </button>
                  <StatusBadge status={iv.status} />
                </div>
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <div>Agent : <strong>{iv.agent?.full_name || '—'}</strong></div>
                  <div>Prévue : {formatDate(iv.scheduled_at)}</div>
                  <div>Créée : {formatDate(iv.created_at)}</div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                  <button
                    onClick={() => openDetail(iv.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                  >
                    <Edit className="h-3.5 w-3.5" /> Modifier
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between gap-2 pt-2">
              <p className="text-xs text-slate-500">
                Page {page} sur {totalPages} — {total} intervention{total > 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Précédent
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
                >
                  Suivant <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <InterventionDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        interventionId={selectedId}
        onUpdated={() => load()}
      />
    </div>
  );
};

export default InterventionsList;
