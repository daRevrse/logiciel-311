import React, { useEffect, useState } from 'react';
import { X, Loader2, Sparkles, User, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';

/**
 * Modal de création d'intervention depuis un signalement.
 * Props: open, onClose, reportId, onCreated
 */
const AssignInterventionModal = ({ open, onClose, reportId, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !reportId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setSelectedAgentId(null);
      setScheduledAt('');
      setNotes('');
      try {
        const res = await adminService.suggestAgents(reportId);
        const list = res?.data || res?.agents || (Array.isArray(res) ? res : []);
        if (!cancelled) setAgents(list);
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message || 'Impossible de charger les agents');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, reportId]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAgentId) {
      setError('Veuillez sélectionner un agent');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = { report_id: reportId, agent_id: selectedAgentId };
      if (scheduledAt) payload.scheduled_at = new Date(scheduledAt).toISOString();
      if (notes.trim()) payload.notes = notes.trim();
      const res = await adminService.createIntervention(payload);
      toast.success('Intervention créée');
      if (onCreated) onCreated(res?.data || res);
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Erreur lors de la création';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Créer une intervention</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Agent à assigner <span className="text-red-500">*</span>
            </label>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-500">
                <Loader2 className="animate-spin h-5 w-5 mr-2" />
                Chargement des agents suggérés…
              </div>
            ) : agents.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-4">Aucun agent disponible pour ce signalement.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {agents.map((a) => {
                  const selected = selectedAgentId === a.id;
                  return (
                    <button
                      type="button"
                      key={a.id}
                      onClick={() => setSelectedAgentId(a.id)}
                      className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-xl border transition-all ${
                        selected
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${selected ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">{a.full_name}</span>
                          {a.is_specialized && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                              <Sparkles className="h-3 w-3" /> Spécialisé
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Charge actuelle : <span className="font-semibold">{a.workload ?? 0}</span>
                          {Array.isArray(a.specializations) && a.specializations.length > 0 && (
                            <span className="ml-2 text-slate-400">
                              {a.specializations.map((s) => s.name || s).join(', ')}
                            </span>
                          )}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Date prévue (optionnel)
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Précisions pour l'agent…"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedAgentId}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Créer l'intervention
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignInterventionModal;
