import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Inbox, Loader2 } from 'lucide-react';
import agentService from '../../services/agentService';
import AgentHome from './AgentHome';

/**
 * Page "Mes interventions" de l'agent.
 * Trois groupes : À faire / En cours / Terminées. Les interventions
 * annulées sont ignorées.
 */

const GROUPS = [
  {
    key: 'todo',
    title: 'À faire',
    statuses: ['pending', 'scheduled'],
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
  },
  {
    key: 'in_progress',
    title: 'En cours',
    statuses: ['in_progress'],
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
  },
  {
    key: 'done',
    title: 'Terminées',
    statuses: ['completed'],
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
  }
];

const STATUS_LABELS = {
  pending: 'En attente',
  scheduled: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée'
};

function formatDate(value) {
  if (!value) return null;
  try {
    return new Date(value).toLocaleString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return null;
  }
}

function InterventionCard({ intervention, badgeClass }) {
  const report = intervention.report || {};
  const category = report.category;
  const scheduledLabel = formatDate(intervention.scheduled_at);

  return (
    <Link
      to={`/agent/interventions/${intervention.id}`}
      className="block rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md hover:border-primary/50 transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 flex-1">
          {report.title || 'Signalement'}
        </h3>
        <span
          className={`text-[10px] uppercase tracking-wide font-bold px-2 py-1 rounded-full whitespace-nowrap ${badgeClass}`}
        >
          {STATUS_LABELS[intervention.status] || intervention.status}
        </span>
      </div>

      {category && (
        <div
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full mb-2"
          style={{
            backgroundColor: category.color ? `${category.color}20` : '#e2e8f0',
            color: category.color || '#334155'
          }}
        >
          {category.icon && <span aria-hidden="true">{category.icon}</span>}
          <span>{category.name}</span>
        </div>
      )}

      {scheduledLabel && (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mb-1">
          <Calendar size={14} className="flex-shrink-0" />
          <span className="truncate">{scheduledLabel}</span>
        </div>
      )}

      {report.address && (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
          <MapPin size={14} className="flex-shrink-0" />
          <span className="line-clamp-1">{report.address}</span>
        </div>
      )}
    </Link>
  );
}

function Column({ title, items, badgeClass }) {
  return (
    <section className="flex-1 min-w-0">
      <header className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300">
          {title}
        </h2>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {items.length}
        </span>
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-6 text-center">
          <Inbox className="mx-auto mb-2 text-slate-400" size={24} />
          <p className="text-xs text-slate-500 dark:text-slate-400">Aucune intervention</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <InterventionCard key={it.id} intervention={it} badgeClass={badgeClass} />
          ))}
        </div>
      )}
    </section>
  );
}

const MyInterventions = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [interventions, setInterventions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await agentService.getMyInterventions();
        if (!cancelled) {
          setInterventions(Array.isArray(res.data) ? res.data : []);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || 'Erreur lors du chargement');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="py-10 flex flex-col items-center justify-center gap-2 text-slate-500">
        <Loader2 className="animate-spin" size={24} />
        <span className="text-sm">Chargement...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  // Filtrer cancelled en amont.
  const active = interventions.filter((i) => i.status !== 'cancelled');

  if (active.length === 0) {
    return <AgentHome />;
  }

  const grouped = GROUPS.map((g) => ({
    ...g,
    items: active.filter((i) => g.statuses.includes(i.status))
  }));

  return (
    <div className="py-2">
      <div className="mb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
          Mes interventions
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Retrouvez vos tâches assignées et leur avancement.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {grouped.map((g) => (
          <Column key={g.key} title={g.title} items={g.items} badgeClass={g.badgeClass} />
        ))}
      </div>
    </div>
  );
};

export default MyInterventions;
