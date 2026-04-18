import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  User,
  Calendar,
  Play,
  CheckCircle2,
  Camera,
  Save,
  Loader2
} from 'lucide-react';
import agentService from '../../services/agentService';
import { resolveImageUrl } from '../../utils/url';

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
    return new Date(value).toLocaleString('fr-FR');
  } catch {
    return null;
  }
}

const InterventionDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [intervention, setIntervention] = useState(null);

  const [notes, setNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);

  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }
  const fileInputRef = useRef(null);

  async function loadIntervention() {
    try {
      setLoading(true);
      const res = await agentService.getMyIntervention(id);
      setIntervention(res.data);
      setNotes(res.data?.notes || '');
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIntervention();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function flash(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  async function handleStatusAction(nextStatus) {
    setActionLoading(true);
    try {
      const res = await agentService.updateInterventionStatus(id, { status: nextStatus });
      setIntervention(res.data);
      setNotes(res.data?.notes || '');
      flash('success', 'Statut mis à jour');
    } catch (err) {
      flash('error', err?.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSaveNotes() {
    setNotesLoading(true);
    try {
      const res = await agentService.updateInterventionStatus(id, { notes });
      setIntervention(res.data);
      flash('success', 'Notes enregistrées');
    } catch (err) {
      flash('error', err?.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setNotesLoading(false);
    }
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    try {
      await agentService.uploadInterventionPhoto(id, file);
      flash('success', 'Photo ajoutée');
      await loadIntervention();
    } catch (err) {
      flash('error', err?.response?.data?.message || 'Erreur lors de l\'upload');
    } finally {
      setPhotoLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  if (loading) {
    return (
      <div className="py-10 flex flex-col items-center justify-center gap-2 text-slate-500">
        <Loader2 className="animate-spin" size={24} />
        <span className="text-sm">Chargement...</span>
      </div>
    );
  }

  if (error || !intervention) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{error || 'Introuvable'}</p>
        <Link to="/agent" className="inline-flex items-center gap-1 mt-4 text-sm text-primary hover:underline">
          <ArrowLeft size={14} /> Retour
        </Link>
      </div>
    );
  }

  const report = intervention.report || {};
  const category = report.category;
  const photos = Array.isArray(report.photos) ? report.photos : [];
  const citizenName = report.is_anonymous
    ? 'Anonyme'
    : (report.citizen_display_name || report.citizen?.full_name || 'Anonyme');

  const status = intervention.status;
  const canStart = status === 'pending' || status === 'scheduled';
  const canComplete = status === 'in_progress';

  return (
    <div className="py-2 max-w-3xl mx-auto">
      <Link
        to="/agent"
        className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400 hover:text-primary mb-4"
      >
        <ArrowLeft size={16} /> Retour
      </Link>

      {message && (
        <div
          className={`mb-4 text-sm ${
            message.type === 'success' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Report info card */}
      <section className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm mb-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
            {report.title || 'Signalement'}
          </h1>
          <span className="text-[10px] uppercase tracking-wide font-bold px-2 py-1 rounded-full whitespace-nowrap bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {STATUS_LABELS[status] || status}
          </span>
        </div>

        {category && (
          <div className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full mb-3">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: category.color || '#64748b' }}
              aria-hidden="true"
            />
            <span className="text-slate-700 dark:text-slate-300">{category.name}</span>
          </div>
        )}

        {report.description && (
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap mb-3">
            {report.description}
          </p>
        )}

        <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
          {report.address && (
            <div className="flex items-start gap-2">
              <MapPin size={16} className="flex-shrink-0 mt-0.5" />
              <span>{report.address}</span>
            </div>
          )}
          <div className="flex items-start gap-2">
            <User size={16} className="flex-shrink-0 mt-0.5" />
            <span>{citizenName}</span>
          </div>
        </div>
      </section>

      {/* Photos */}
      <section className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
          Photos
        </h2>
        {photos.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">Aucune photo.</p>
        ) : (
          <div className="flex overflow-x-auto gap-2 md:grid md:grid-cols-3 md:overflow-visible">
            {photos.map((p) => (
              <a
                key={p.id}
                href={resolveImageUrl(p.photo_url)}
                target="_blank"
                rel="noreferrer"
                className="flex-shrink-0 block w-32 h-32 md:w-full md:h-32 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800"
              >
                <img
                  src={resolveImageUrl(p.photo_url)}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </a>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoChange}
            className="hidden"
            id="intervention-photo-input"
          />
          <label
            htmlFor="intervention-photo-input"
            className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer ${
              photoLoading ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            {photoLoading ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Camera size={16} />
            )}
            Ajouter photo
          </label>
        </div>
      </section>

      {/* Status action */}
      {(canStart || canComplete) && (
        <section className="mb-4">
          {canStart && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleStatusAction('in_progress')}
              className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-60"
            >
              {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />}
              Démarrer
            </button>
          )}
          {canComplete && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => handleStatusAction('completed')}
              className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60"
            >
              {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              Terminer
            </button>
          )}
        </section>
      )}

      {/* Notes */}
      <section className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm mb-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Notes
        </h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={5000}
          placeholder="Notes d'intervention..."
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            disabled={notesLoading}
            onClick={handleSaveNotes}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg bg-primary hover:bg-primary/90 text-white disabled:opacity-60"
          >
            {notesLoading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
            Enregistrer
          </button>
        </div>
      </section>

      {/* Dates */}
      <section className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Dates
        </h2>
        <dl className="space-y-1.5 text-sm">
          {intervention.scheduled_at && (
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" />
              <dt className="text-slate-600 dark:text-slate-400 w-24">Planifiée :</dt>
              <dd className="text-slate-900 dark:text-slate-100">{formatDate(intervention.scheduled_at)}</dd>
            </div>
          )}
          {intervention.started_at && (
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" />
              <dt className="text-slate-600 dark:text-slate-400 w-24">Démarrée :</dt>
              <dd className="text-slate-900 dark:text-slate-100">{formatDate(intervention.started_at)}</dd>
            </div>
          )}
          {intervention.completed_at && (
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-slate-400" />
              <dt className="text-slate-600 dark:text-slate-400 w-24">Terminée :</dt>
              <dd className="text-slate-900 dark:text-slate-100">{formatDate(intervention.completed_at)}</dd>
            </div>
          )}
          {!intervention.scheduled_at && !intervention.started_at && !intervention.completed_at && (
            <p className="text-xs text-slate-500 dark:text-slate-400">Aucune date disponible.</p>
          )}
        </dl>
      </section>
    </div>
  );
};

export default InterventionDetail;
