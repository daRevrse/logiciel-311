import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  User,
  Edit,
  Trash2,
  MessageSquare,
  Share2,
  ThumbsUp,
  ChevronLeft,
  Clock,
  X,
} from 'lucide-react';
import { useReports } from '../../hooks/useReports';
import { useSupports } from '../../hooks/useSupports';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge, Spinner, Modal, ConfirmModal } from '../../components/common';
import CommentsSection from '../../components/citizen/CommentsSection';
import { ReportsMap } from '../../components/citizen';
import { resolveImageUrl } from '../../utils/url';
import { reportDate } from '../../utils/date';
import toast from 'react-hot-toast';

/**
 * Détail d'un signalement — version simple & mobile-first.
 */
const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { loadReportById, deleteReport } = useReports({}, false);
  const { hasSupported, supportCount, toggleSupport, refresh } = useSupports(parseInt(id));

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supportLoading, setSupportLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await loadReportById(id);
      setReport(data);
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast.error('Signalement introuvable');
      navigate('/home');
    } finally {
      setLoading(false);
    }
  };

  const handleSupportToggle = async () => {
    setSupportLoading(true);
    try {
      await toggleSupport(parseInt(id));
      await refresh(parseInt(id));
    } catch (error) {
      console.error('Support error:', error);
    } finally {
      setSupportLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: report?.title || 'Signalement', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Lien copié');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') console.error('Share error:', error);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteReport(parseInt(id));
      toast.success('Signalement supprimé');
      navigate('/my-reports');
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const isOwner = report && user && report.citizen_id === user.id;
  const canModify = isOwner && report.status === 'pending';

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Spinner size="lg" className="text-turquoise" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      {/* En-tête compact */}
      <div className="bg-navy-deep text-white">
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-6">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 text-white/80 hover:text-white text-sm font-semibold"
            >
              <ChevronLeft className="w-5 h-5" />
              Retour
            </button>
            <button
              onClick={handleShare}
              title="Partager"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-turquoise bg-turquoise/15 px-2 py-1 rounded">
              {report.category?.name || 'Général'}
            </span>
            <StatusBadge status={report.status} />
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight leading-tight">{report.title}</h1>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-sm text-white/60">
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 text-turquoise" />
              {report.user?.full_name || 'Citoyen'}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-turquoise" />
              {formatDate(reportDate(report))}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-5 mt-5">
        {/* Action d'appui (indisponible pour l'auteur du signalement) */}
        {isOwner ? (
          <div className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold bg-white border border-gray-100 text-gray-500">
            <ThumbsUp className="w-5 h-5 text-turquoise" />
            {supportCount} appui{supportCount > 1 ? 's' : ''} sur votre signalement
          </div>
        ) : (
          <button
            onClick={handleSupportToggle}
            disabled={supportLoading}
            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all ${
              hasSupported
                ? 'bg-navy-deep text-white active:scale-[0.98]'
                : 'bg-turquoise text-navy-deep shadow-lg shadow-turquoise/20 active:scale-[0.98]'
            }`}
          >
            {supportLoading ? <Spinner size="sm" /> : <ThumbsUp className="w-5 h-5" />}
            {hasSupported ? `Vous appuyez (${supportCount}) — retirer` : `Appuyer ce signalement (${supportCount})`}
          </button>
        )}

        {/* Description */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Description</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{report.description}</p>

          {report.photos && report.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-4">
              {report.photos.map((photo) => (
                <button
                  key={photo.id}
                  onClick={() => setSelectedPhoto(photo)}
                  className="aspect-square rounded-xl overflow-hidden bg-gray-100"
                >
                  <img src={resolveImageUrl(photo.photo_url)} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Localisation */}
        {(report.latitude != null && report.longitude != null) || report.address ? (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {report.latitude != null && report.longitude != null && (
              <div className="h-52">
                <ReportsMap reports={[report]} />
              </div>
            )}
            {report.address && (
              <p className="px-5 py-3 text-sm text-gray-600 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-turquoise flex-shrink-0" />
                <span className="truncate">{report.address}</span>
              </p>
            )}
          </section>
        ) : null}

        {/* Timeline */}
        {report.status_history && report.status_history.length > 0 && (
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-turquoise" /> Suivi
            </h2>
            <div className="space-y-4">
              {report.status_history.map((h, i) => (
                <div key={i} className="flex gap-3">
                  <div className="mt-1 w-2.5 h-2.5 rounded-full bg-turquoise shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-navy-deep capitalize">{h.new_status?.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-400">{formatDate(h.created_at)}</p>
                    {h.comment && <p className="text-sm text-gray-600 mt-1">{h.comment}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Discussion */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-turquoise" /> Discussion
          </h2>
          <CommentsSection reportId={report.id} canPost={!!user} />
        </section>

        {/* Actions propriétaire */}
        {canModify && (
          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/reports/${id}/edit`)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-white border border-gray-200 text-navy-deep font-bold hover:border-navy-deep transition-colors"
            >
              <Edit className="w-4 h-4" /> Modifier
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 text-rose-600 font-bold hover:bg-rose-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
        )}
      </div>

      {/* Lightbox photo */}
      <Modal isOpen={!!selectedPhoto} onClose={() => setSelectedPhoto(null)} size="xl">
        {selectedPhoto && (
          <div className="relative bg-black rounded-2xl overflow-hidden">
            <img src={resolveImageUrl(selectedPhoto.photo_url)} alt="" className="max-h-[80vh] mx-auto" />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-white/15 backdrop-blur rounded-full text-white hover:bg-white/25"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </Modal>

      {/* Confirmation suppression */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Supprimer le signalement"
        message="Cette action est définitive. Confirmez-vous le retrait de ce signalement ?"
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default ReportDetail;
