import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Power, KeyRound, Users, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';
import AgentFormModal from '../../components/admin/AgentFormModal';
import { Modal } from '../../components/common';

const PAGE_LIMIT = 20;

const StatusBadge = ({ active }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
      active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
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
          {c.color && <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />}
          {c.name}
        </span>
      ))}
    </div>
  );
};

function formatLastLogin(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

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
  const [resetResult, setResetResult] = useState(null); // { agent, temp_password, mail_warning }
  const [busyId, setBusyId] = useState(null);
  const [copied, setCopied] = useState(false);

  const loadAgents = useCallback(async (targetPage = page) => {
    setLoading(true);
    try {
      const res = await adminService.listAgents({ page: targetPage, limit });
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

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { loadAgents(page); }, [page, loadAgents]);

  const openCreate = () => { setMode('create'); setEditing(null); setModalOpen(true); };
  const openEdit = (agent) => { setMode('edit'); setEditing(agent); setModalOpen(true); };

  const handleToggleActive = async (agent) => {
    const isActive = agent.is_active !== false;
    const next = !isActive;
    if (isActive && !window.confirm(`Désactiver l'accès de ${agent.full_name} ? Il ne pourra plus se connecter.`)) return;
    setBusyId(agent.id);
    try {
      await adminService.setAgentActive(agent.id, next);
      toast.success(next ? 'Agent réactivé' : 'Agent désactivé');
      loadAgents(page);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = async (agent) => {
    if (!window.confirm(`Réinitialiser le mot de passe de ${agent.full_name} ?`)) return;
    setBusyId(agent.id);
    try {
      const res = await adminService.resetAgentPassword(agent.id);
      if (res?.temp_password) {
        setResetResult({ agent, temp_password: res.temp_password, mail_warning: res.mail_warning });
        setCopied(false);
      } else {
        toast.success("Mot de passe réinitialisé — email envoyé à l'agent");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  const copyTemp = async () => {
    try {
      await navigator.clipboard.writeText(resetResult.temp_password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* noop */ }
  };

  const totalPages = Math.max(1, Math.ceil((total || 0) / (limit || PAGE_LIMIT)));

  const ActionButtons = ({ agent, compact }) => {
    const isActive = agent.is_active !== false;
    return (
      <div className={`flex items-center ${compact ? 'gap-2' : 'justify-end gap-1'}`}>
        <button onClick={() => openEdit(agent)} title="Modifier"
          className="p-2 rounded-lg text-slate-500 hover:text-turquoise-dark hover:bg-slate-100 dark:hover:bg-slate-800">
          <Edit className="h-4 w-4" />
        </button>
        <button onClick={() => handleResetPassword(agent)} disabled={busyId === agent.id} title="Réinitialiser le mot de passe"
          className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50">
          <KeyRound className="h-4 w-4" />
        </button>
        <button onClick={() => handleToggleActive(agent)} disabled={busyId === agent.id}
          title={isActive ? 'Désactiver' : 'Réactiver'}
          className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 ${isActive ? 'text-slate-500 hover:text-red-600' : 'text-emerald-600 hover:text-emerald-700'}`}>
          <Power className="h-4 w-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy-deep dark:text-slate-50">Agents</h1>
          <p className="text-sm text-slate-500 mt-1">Gérez les agents terrain et leurs accès.</p>
        </div>
        <button onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-turquoise text-navy-deep text-sm font-semibold hover:bg-turquoise/90">
          <Plus className="h-4 w-4" />
          Nouvel agent
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-slate-500">
            <div className="h-5 w-5 border-2 border-slate-300 border-t-turquoise rounded-full animate-spin" />
            Chargement…
          </div>
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <Users className="h-10 w-10 mx-auto text-slate-300 mb-3" />
          <p className="text-slate-600 dark:text-slate-300 font-medium">Aucun agent pour le moment.</p>
          <button onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-turquoise text-navy-deep text-sm font-semibold hover:bg-turquoise/90">
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
                  <th className="px-4 py-3 font-semibold">Dernière connexion</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {agents.map((a) => {
                  const lastLogin = formatLastLogin(a.last_login);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-medium text-navy-deep dark:text-slate-100">{a.full_name || a.name || '—'}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{a.email}</td>
                      <td className="px-4 py-3"><SpecChips items={a.specialization_details} /></td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {lastLogin || <span className="text-amber-600 text-xs font-medium">Jamais connecté</span>}
                      </td>
                      <td className="px-4 py-3"><StatusBadge active={a.is_active !== false} /></td>
                      <td className="px-4 py-3"><ActionButtons agent={a} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {agents.map((a) => {
              const lastLogin = formatLastLogin(a.last_login);
              return (
                <div key={a.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-navy-deep dark:text-slate-100 truncate">{a.full_name || a.name || '—'}</p>
                      <p className="text-xs text-slate-500 truncate">{a.email}</p>
                    </div>
                    <StatusBadge active={a.is_active !== false} />
                  </div>
                  <div className="mt-3"><SpecChips items={a.specialization_details} /></div>
                  <p className="mt-2 text-xs text-slate-500">
                    Dernière connexion : {lastLogin || <span className="text-amber-600 font-medium">jamais</span>}
                  </p>
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <ActionButtons agent={a} compact />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between gap-2 pt-2">
              <p className="text-xs text-slate-500">Page {page} sur {totalPages} — {total} agent{total > 1 ? 's' : ''}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none">
                  <ChevronLeft className="h-3.5 w-3.5" /> Précédent
                </button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none">
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

      {/* Résultat réinitialisation mot de passe */}
      <Modal isOpen={!!resetResult} onClose={() => setResetResult(null)} title="Mot de passe réinitialisé">
        {resetResult && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Nouveau mot de passe temporaire pour <strong className="text-navy-deep">{resetResult.agent.full_name}</strong>.
              Transmettez-le à l'agent — il ne sera plus affiché.
            </p>
            {resetResult.mail_warning && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">{resetResult.mail_warning}</p>
            )}
            <div className="flex items-center gap-2">
              <input readOnly value={resetResult.temp_password}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono text-sm" />
              <button onClick={copyTemp}
                className="px-3 py-2 rounded-lg bg-turquoise text-navy-deep flex items-center gap-2 text-sm font-semibold hover:bg-turquoise/90">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copié' : 'Copier'}
              </button>
            </div>
            <div className="flex justify-end">
              <button onClick={() => setResetResult(null)}
                className="px-4 py-2 rounded-lg bg-navy-deep text-white text-sm font-semibold hover:bg-navy-deep/90">
                Fermer
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AgentsList;
