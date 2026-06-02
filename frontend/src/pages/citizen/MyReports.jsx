import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MapPin, Edit, Trash2, Inbox, ChevronRight } from 'lucide-react';
import { StatusBadge, Spinner, Modal, HeroBackground, ImageWithFallback } from '../../components/common';
import { IMAGES } from '../../config/images';
import { formatShortDate, reportDate } from '../../utils/date';
import reportService from '../../services/reportService';
import toast from 'react-hot-toast';

const STATUS_FILTERS = [
  { value: '', label: 'Tous' },
  { value: 'pending', label: 'En attente' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'resolved', label: 'Résolus' },
];

const PAGE_SIZE = 10;

/**
 * Mes signalements — version simple & mobile-first.
 */
const MyReports = () => {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadMyReports = async () => {
    setLoading(true);
    try {
      const data = await reportService.getMyReports({
        status: status || undefined,
        page: 1,
        limit,
      });
      setReports(data.reports || data.data || []);
      setTotal(data.pagination?.totalReports ?? (data.reports || []).length);
    } catch (err) {
      console.error('Erreur chargement:', err);
      toast.error('Impossible de charger vos signalements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, limit]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await reportService.deleteReport(deleteTarget.id);
      toast.success('Signalement retiré');
      setDeleteTarget(null);
      loadMyReports();
    } catch (err) {
      toast.error('Erreur de suppression');
    } finally {
      setDeleting(false);
    }
  };

  const canLoadMore = !loading && reports.length < total;

  return (
    <div className="min-h-screen bg-surface">
      {/* En-tête */}
      <div className="relative overflow-hidden bg-navy-deep text-white">
        <HeroBackground image={IMAGES.heroStreet} opacity={0.25} />
        <div className="relative z-10 max-w-2xl mx-auto px-4 pt-8 pb-16">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Mes signalements</h1>
          <p className="text-white/60 text-sm mt-1">{total} signalement{total > 1 ? 's' : ''} au total</p>

          <button
            onClick={() => navigate('/reports/create')}
            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 bg-turquoise text-navy-deep font-bold rounded-2xl shadow-lg shadow-turquoise/20 active:scale-[0.98] transition-transform"
          >
            <Plus className="h-5 w-5" />
            Nouveau signalement
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-8 pb-24">
        {/* Filtres de statut */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-5 -mx-1 px-1 scrollbar-none">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setLimit(PAGE_SIZE); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                status === f.value
                  ? 'bg-navy-deep text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-turquoise'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading && reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500">Chargement…</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12">
            <ImageWithFallback
              src={IMAGES.emptyReports}
              alt=""
              className="w-36 h-36 rounded-3xl mx-auto mb-5 shadow-lg"
            >
              <Inbox className="h-10 w-10 text-white/70" />
            </ImageWithFallback>
            <p className="text-navy-deep font-bold">Aucun signalement</p>
            <p className="text-gray-500 text-sm mt-1 mb-5">
              {status ? 'Aucun signalement avec ce statut.' : "Vous n'avez pas encore créé de signalement."}
            </p>
            <button
              onClick={() => navigate('/reports/create')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-turquoise text-navy-deep font-bold rounded-xl active:scale-95 transition-transform"
            >
              <Plus className="h-4 w-4" />
              Créer mon premier signalement
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white border border-gray-100 rounded-2xl shadow-sm relative overflow-hidden"
                >
                  <div
                    className={`absolute top-0 bottom-0 left-0 w-1.5 ${
                      report.status === 'resolved'
                        ? 'bg-emerald-500'
                        : report.status === 'completed'
                        ? 'bg-cyan-500'
                        : report.status === 'in_progress'
                        ? 'bg-amber-500'
                        : report.status === 'assigned'
                        ? 'bg-blue-500'
                        : 'bg-slate-300'
                    }`}
                  />
                  <button
                    onClick={() => navigate(`/reports/${report.id}`)}
                    className="w-full text-left p-4 pl-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-turquoise bg-turquoise/10 px-2 py-0.5 rounded">
                            {report.category?.name || 'Général'}
                          </span>
                          <span className="text-[10px] font-medium text-gray-400">
                            {formatShortDate(reportDate(report))}
                          </span>
                        </div>
                        <h3 className="font-bold text-navy-deep leading-snug truncate">{report.title}</h3>
                        <div className="flex items-center gap-1.5 mt-1.5 text-gray-500">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="text-xs truncate">{report.address}</span>
                        </div>
                      </div>
                      <StatusBadge status={report.status} />
                    </div>
                  </button>

                  {/* Actions (brouillons modifiables) */}
                  {report.status === 'pending' && (
                    <div className="flex border-t border-gray-100">
                      <button
                        onClick={() => navigate(`/reports/${report.id}/edit`)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        <Edit className="h-4 w-4" /> Modifier
                      </button>
                      <div className="w-px bg-gray-100" />
                      <button
                        onClick={() => setDeleteTarget(report)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" /> Supprimer
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {canLoadMore && (
              <button
                onClick={() => setLimit((l) => l + PAGE_SIZE)}
                className="mt-5 w-full py-3.5 rounded-2xl bg-white border border-gray-200 text-navy-deep font-bold text-sm hover:border-turquoise transition-colors"
              >
                Voir plus
              </button>
            )}
          </>
        )}
      </div>

      {/* Confirmation de suppression */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer le signalement">
        <div className="p-2 text-center">
          <Trash2 className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <p className="text-gray-600 text-sm mb-6">
            Cette action est définitive. Confirmez-vous le retrait de ce signalement ?
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="flex-1 py-3 font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Suppression…' : 'Supprimer'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyReports;
