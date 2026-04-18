import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Calendar, User, ArrowLeft, Edit, Trash2, Image as ImageIcon } from 'lucide-react';
import { useReports } from '../../hooks/useReports';
import { useSupports } from '../../hooks/useSupports';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Card, StatusBadge, Spinner, Modal, ConfirmModal } from '../../components/common';
import { resolveImageUrl } from '../../utils/url';
import toast from 'react-hot-toast';

/**
 * Page de détail d'un signalement
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
  }, [id]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await loadReportById(id);
      setReport(data);
    } catch (error) {
      console.error('Erreur chargement signalement:', error);
      toast.error('Impossible de charger le signalement');
      navigate('/reports');
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
      console.error('Erreur appui:', error);
    } finally {
      setSupportLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await deleteReport(parseInt(id));
      toast.success('Signalement supprimé');
      navigate('/my-reports');
    } catch (error) {
      console.error('Erreur suppression:', error);
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canEdit = report && user && report.user_id === user.id && report.status === 'pending';
  const canDelete = report && user && report.user_id === user.id && report.status === 'pending';

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <Card>
          <p className="text-gray-600">Signalement introuvable</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Bouton retour */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        {/* Carte principale */}
        <Card className="mb-6">
          {/* Header avec statut et actions */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold text-gray-900">{report.title}</h1>
                <StatusBadge status={report.status} size="lg" />
              </div>

              <div className="flex flex-col gap-2 text-gray-600">
                <p className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {report.address}
                </p>
                <p className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Créé le {formatDate(report.created_at)}
                </p>
                {report.user && (
                  <p className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {report.user.full_name}
                  </p>
                )}
              </div>
            </div>

            {/* Actions (si propriétaire) */}
            {(canEdit || canDelete) && (
              <div className="flex gap-2">
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/reports/${id}/edit`)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}
                {canDelete && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{report.description}</p>
          </div>

          {/* Photos */}
          {report.photos && report.photos.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Photos ({report.photos.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {report.photos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => setSelectedPhoto(photo)}
                    className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={resolveImageUrl(photo.photo_url)}
                      alt={`Photo ${photo.id}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Informations supplémentaires */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-600 mb-1">Catégorie</p>
              <p className="font-medium text-gray-900">
                {report.category?.name || 'Non catégorisé'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Score de priorité</p>
              <p className="font-medium text-gray-900">
                {report.priority_score?.toFixed(1) || '0.0'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Appuis</p>
              <p className="font-medium text-gray-900">{supportCount}</p>
            </div>
          </div>

          {/* Coordonnées GPS si disponibles */}
          {report.latitude && report.longitude && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Localisation</h2>
              <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="h-12 w-12 mx-auto mb-2" />
                  <p>Carte à intégrer (Leaflet/Mapbox)</p>
                  <p className="text-sm mt-1">
                    {report.latitude}, {report.longitude}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Bouton inline — desktop uniquement */}
        <div className="hidden lg:block mt-6">
          <Button
            variant="support"
            size="lg"
            onClick={handleSupportToggle}
            disabled={hasSupported || supportLoading}
            loading={supportLoading}
          >
            {hasSupported
              ? `Vous avez appuyé (${report?.supports_count || 0})`
              : `Appuyer (${report?.supports_count || 0})`}
          </Button>
        </div>

        {/* Historique des changements de statut (si admin a ajouté des notes) */}
        {report.status_history && report.status_history.length > 0 && (
          <Card className="mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Historique
            </h2>
            <div className="space-y-4">
              {report.status_history.map((history, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary-600"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 font-medium">
                      Statut changé: {history.old_status} → {history.new_status}
                    </p>
                    {history.comment && (
                      <p className="text-sm text-gray-600 mt-1">{history.comment}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(history.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Barre fixe bas — mobile uniquement */}
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 lg:hidden bg-white border-t border-gray-200 pt-3 z-10">
          <Button
            variant="support"
            fullWidth
            size="lg"
            onClick={handleSupportToggle}
            disabled={hasSupported || supportLoading}
            loading={supportLoading}
          >
            {hasSupported
              ? `Vous avez appuyé (${report?.supports_count || 0})`
              : `Appuyer (${report?.supports_count || 0})`}
          </Button>
        </div>

        {/* Modal de confirmation de suppression */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Supprimer le signalement"
          message="Êtes-vous sûr de vouloir supprimer ce signalement ? Cette action est irréversible."
          confirmText="Supprimer"
          cancelText="Annuler"
          variant="danger"
          loading={deleteLoading}
        />

        {/* Modal galerie photo */}
        <Modal
          isOpen={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          size="xl"
        >
          {selectedPhoto && (
            <div className="flex items-center justify-center">
              <img
                src={resolveImageUrl(selectedPhoto.photo_url)}
                alt="Photo agrandie"
                className="max-w-full max-h-[70vh] object-contain"
              />
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default ReportDetail;
