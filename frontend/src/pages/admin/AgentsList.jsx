import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';
import AgentFormModal from '../../components/admin/AgentFormModal';

const PAGE_LIMIT = 20;

const StatusBadge = ({ active }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
      active
        ? 'bg-emerald-100 text-emerald-700'
        : 'bg-slate-200 text-slate-600'
    }`}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
    {active ? 'Actif' : 'Inactif'}
  </span>
);

const SpecChips = ({ items }) => {
  if (!items || items.length === 0) {
    return <span className="text-xs text-slate-400 italic">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((c) => (
        <span
          key={c.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-200"
        >
          {c.color && (
            <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
          )}
          {c.name}
        </span>
      ))}
    </div>
  );
};

const AgentsList = () => {
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(PAGE_LIMIT);
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState('create');
  const [editing, setEditing] = useState(null);

  const loadAgents = useCallback(async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await adminService.listAgents({ page: targetPage, limit });
      // Accept several common payload shapes
      const list = res?.data || res?.agents || res?.items || (Array.isArray(res) ? res : []);
      setAgents(list);
      setTotal(res?.total ?? res?.pagination?.total ?? list.length);
      setLimit(res?.limit ?? res?.pagination?.limit ?? limit);
    } catch (err) {
      console.error('Erreur chargement agents:', err);
      toast.error('Impossible de charger les agents');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  const loadCategories = useCallback(async () => {
    try {
      const res = await adminService.listAdminCategories();
      const list = res?.data || res?.categories || (Array.isArray(res) ? res : []);
      setCategories(list);
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadAgents(page);
  }, [page, loadAgents]);

  const openCreate = () => {
    setMode('create');
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (agent) => {
    setMode('edit');
    setEditing(agent);
    setModalOpen(true);
  };

  const handleDelete = async (agent) => {
    if (!window.confirm('Désactiver cet agent ?')) return;
    try {
      await adminService.deleteAgent(agent.id);
      toast.success('Agent désactivé');
      loadAgents(page);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erreur lors de la désactivation';
      toast.error(msg);
    }
  };

  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || PAGE_LIMIT)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Agents</h1>
          <p className="text-sm text-slate-500 mt-1">Gérez les agents terrain de votre municipalité.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Nouvel agent
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="h-5 w-5 border-2 border-slate-300 border-t-primary rounded-full animate-spin" />
            Chargement…
          </div>
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Users className="h-10 w-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 dark:text-slate-300 font-medium">Aucun agent pour le moment.</p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Créer le premier
          </button>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Nom</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Spécialisations</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {agents.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {a.full_name || a.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{a.email}</td>
                    <td className="px-4 py-3">
                      <SpecChips items={a.specialization_details} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge active={a.is_active !== false} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(a)}
                          className="p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Modifier"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(a)}
                          className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Désactiver"
                        >
                          <Trash2 className="h-4 w-4" />
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
            {agents.map((a) => (
              <div
                key={a.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {a.full_name || a.name || '—'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{a.email}</p>
                  </div>
                  <StatusBadge active={a.is_active !== false} />
                </div>
                <div className="mt-3">
                  <SpecChips items={a.specialization_details} />
                </div>
                <div className="mt-3 flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => openEdit(a)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200"
                  >
                    <Edit className="h-3.5 w-3.5" /> Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(a)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-red-600 bg-red-50 hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Désactiver
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between gap-2 pt-2">
              <p className="text-xs text-slate-500">
                Page {page} sur {totalPages} — {total} agent{total > 1 ? 's' : ''}
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

      <AgentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => loadAgents(page)}
        mode={mode}
        initialAgent={editing}
        categories={categories}
      />
    </div>
  );
};

export default AgentsList;
