import React, { useEffect, useState } from 'react';
import { X, Loader2, MapPin, Tag, User, Calendar, Play, CheckCircle2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';

const STATUS_OPTIONS = [
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

function toLocalInput(value) {
  if (!value) return '';
  try {
    const d = new Date(value);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '';
  }
}

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch { return '—'; }
}

const InterventionDetailModal = ({ open, onClose, interventionId, onUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [intervention, setIntervention] = useState(null);
  const [agents, setAgents] = useState([]);
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [agentId, setAgentId] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !interventionId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminService.getIntervention(interventionId);
        const iv = res?.data || res;
        if (cancelled) return;
        setIntervention(iv);
        setStatus(iv.status || '');
        setNotes(iv.notes || '');
        setScheduledAt(toLocalInput(iv.scheduled_at));
        setAgentId(iv.agent_id || iv.agent?.id || '');
        // Charger suggestions d'agents
        if (iv.report_id || iv.report?.id) {
          try {
            const agentsRes = await adminService.suggestAgents(iv.report_id || iv.report.id);
            const list = agentsRes?.data || agentsRes?.agents || (Array.isArray(agentsRes) ? agentsRes : []);
            if (!cancelled) setAgents(list);
          } catch {
            // suggestions non disponibles : fallback listAgents
            try {
              const all = await adminService.listAgents({ limit: 200 });
              const list = all?.data || all?.agents || (Array.isArray(all) ? all : []);
              if (!cancelled) setAgents(list);
            } catch { /* ignore */ }
          }
        }
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || 'Impossible de charger');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, interventionId]);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = {};
      if (status && status !== intervention.status) payload.status = status;
      if (notes !== (intervention.notes || '')) payload.notes = notes;
      const currentScheduled = toLocalInput(intervention.scheduled_at);
      if (scheduledAt !== currentScheduled) {
        payload.scheduled_at = scheduledAt ? new Date(scheduledAt).toISOString() : null;
      }
      const currentAgent = intervention.agent_id || intervention.agent?.id || '';
      if (agentId && agentId !== currentAgent) payload.agent_id = agentId;

      if (Object.keys(payload).length === 0) {
        toast('Aucun changement à enregistrer');
        setSaving(false);
        return;
      }
      const res = await adminService.updateIntervention(interventionId, payload);
      toast.success('Intervention mise à jour');
      if (onUpdated) onUpdated(res?.data || res);
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erreur lors de la mise à jour';
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const report = intervention?.report || {};
  const category = report.category;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Intervention {intervention ? `#${intervention.id}` : ''}
            </h3>
            {intervention && (
              <span className={`inline-block mt-1 text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full ${STATUS_BADGE[intervention.status] || 'bg-slate-200 text-slate-700'}`}>
                {STATUS_LABEL[intervention.status] || intervention.status}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="animate-spin h-6 w-6 mr-2" />
            Chargement…
          </div>
        ) : !intervention ? (
          <div className="p-6 text-center text-slate-500">Introuvable.</div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Report info */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-800/40">
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{report.title || 'Signalement'}</h4>
              <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-400">
                {category && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: category.color ? `${category.color}20` : '#e2e8f0', color: category.color || '#334155' }}
                  >
                    <Tag className="h-3 w-3" />{category.name}
                  </span>
                )}
                {report.status && (
                  <span className="inline-flex items-center gap-1">Statut signalement : <strong>{report.status}</strong></span>
                )}
                {report.address && (
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{report.address}</span>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><Calendar className="h-3.5 w-3.5" />Prévue</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(intervention.scheduled_at)}</div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><Play className="h-3.5 w-3.5" />Démarrée</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(intervention.started_at)}</div>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1"><CheckCircle2 className="h-3.5 w-3.5" />Terminée</div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(intervention.completed_at)}</div>
              </div>
            </div>

            {/* Current agent */}
            {intervention.agent && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <User className="h-4 w-4" />
                Agent actuel : <strong className="text-slate-900 dark:text-slate-100">{intervention.agent.full_name || intervention.agent.email}</strong>
              </div>
            )}

            {/* Edit fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Statut</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Date prévue</label>
                <input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Réassigner à un agent</label>
              <select
                value={agentId || ''}
                onChange={(e) => setAgentId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">—</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name} {a.is_specialized ? '★' : ''} {typeof a.workload === 'number' ? `(${a.workload})` : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> ★ = spécialisé — trié par charge de travail croissante
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterventionDetailModal;
