import React, { useState } from 'react';
import { Search, Loader2, AlertCircle, CheckCircle2, Clock, X, MessageSquare } from 'lucide-react';
import publicMunicipalityService from '../../services/publicMunicipalityService';

const STATUS_META = {
  pending: { label: 'En attente', cls: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' },
  assigned: { label: 'Assigné', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  in_progress: { label: 'En cours', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  resolved: { label: 'Résolu', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  rejected: { label: 'Rejeté', cls: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' }
};

function StatusPill({ status }) {
  const meta = STATUS_META[status] || { label: status, cls: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

const formatDate = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
};

export default function TrackReportWidget() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function submit(e) {
    e?.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await publicMunicipalityService.trackReport(trimmed);
      setResult(res?.data || null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Recherche impossible');
    } finally {
      setLoading(false);
    }
  }

  function reset() { setCode(''); setResult(null); setError(null); }

  return (
    <section className="bg-white rounded-card shadow-card p-6">
      <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
        <Search className="w-5 h-5" style={{ color: 'var(--primary)' }} />
        Suivre un signalement
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Entrez le code à 6 caractères reçu lors de la création (ex. <span className="font-mono">A7K2X9</span>).
      </p>

      <form onSubmit={submit} className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          maxLength={12}
          placeholder="Code de suivi"
          className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 text-sm font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-semibold text-sm disabled:opacity-50"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Rechercher
        </button>
      </form>

      {error && (
        <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="mt-5 border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Code</span>
                <span className="font-mono text-sm font-bold text-gray-900">{result.report.tracking_code}</span>
                <StatusPill status={result.report.status} />
              </div>
              <h4 className="font-bold text-gray-900 mt-1.5 truncate">{result.report.title}</h4>
              {result.report.address && (
                <p className="text-xs text-gray-500 mt-0.5 truncate">{result.report.address}</p>
              )}
            </div>
            <button onClick={reset} className="text-gray-400 hover:text-gray-700 p-1 -m-1" type="button" aria-label="Effacer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <h5 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Historique</h5>
              <ol className="space-y-2.5">
                <li className="flex items-start gap-3">
                  <Clock className="w-3.5 h-3.5 mt-1 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 text-sm">
                    <span className="text-gray-700">Signalement créé</span>
                    <span className="text-gray-400 ml-2 text-xs">{formatDate(result.report.created_at)}</span>
                  </div>
                </li>
                {(result.history || []).map((h, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-1.5">
                      <span className={`block w-1.5 h-1.5 rounded-full ${STATUS_META[h.new_status]?.dot || 'bg-gray-400'}`} />
                    </div>
                    <div className="flex-1 text-sm">
                      <span className="text-gray-700">
                        Statut → <strong>{STATUS_META[h.new_status]?.label || h.new_status}</strong>
                      </span>
                      <span className="text-gray-400 ml-2 text-xs">{formatDate(h.created_at)}</span>
                      {h.comment && <p className="text-xs text-gray-500 mt-0.5 italic">« {h.comment} »</p>}
                    </div>
                  </li>
                ))}
                {result.report.resolved_at && (
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-1 text-emerald-600 flex-shrink-0" />
                    <div className="flex-1 text-sm">
                      <span className="text-emerald-700 font-medium">Résolu</span>
                      <span className="text-gray-400 ml-2 text-xs">{formatDate(result.report.resolved_at)}</span>
                    </div>
                  </li>
                )}
              </ol>
            </div>

            {(result.comments || []).length > 0 && (
              <div>
                <h5 className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Messages
                </h5>
                <div className="space-y-2">
                  {result.comments.map((c, i) => (
                    <div key={i} className="text-sm bg-gray-50 rounded-md p-3 border border-gray-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 text-xs">
                          {c.author_name || 'Mairie'}
                          {c.author_role && c.author_role !== 'citizen' && (
                            <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider text-primary-700">staff</span>
                          )}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{c.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
