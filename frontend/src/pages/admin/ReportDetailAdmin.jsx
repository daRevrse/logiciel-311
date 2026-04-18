import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Tag,
  TrendingUp,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wrench
} from 'lucide-react';
import AssignInterventionModal from '../../components/admin/AssignInterventionModal';
import {
  Button,
  Card,
  StatusBadge,
  Spinner,
  Modal,
  Select,
  Textarea
} from '../../components/common';
import reportService from '../../services/reportService';
import adminService from '../../services/adminService';
import { resolveImageUrl } from '../../utils/url';
import toast from 'react-hot-toast';

/**
 * Page de détail d'un signalement pour administrateurs
 */
const ReportDetailAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [history, setHistory] = useState([]);

  // États pour changement de statut
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [changingStatus, setChangingStatus] = useState(false);

  // États pour ajout de note
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Modal création d'intervention
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // Charger le signalement
  useEffect(() => {
    if (id) {
      loadReport();
      loadHistory();
    }
  }, [id]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await reportService.getReportById(id);
      setReport(data.report || data);
    } catch (err) {
      console.error('Erreur chargement signalement:', err);
      toast.error('Impossible de charger le signalement');
      navigate('/admin/reports');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await adminService.getReportHistory(id);
      setHistory(data.history || data || []);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus) {
      toast.error('Veuillez sélectionner un statut');
      return;
    }

    setChangingStatus(true);
    try {
      await adminService.changeStatus(id, newStatus, statusComment);
      toast.success('Statut mis à jour avec succès');
      setStatusModalOpen(false);
      setNewStatus('');
      setStatusComment('');
      loadReport();
      loadHistory();
    } catch (err) {
      console.error('Erreur changement statut:', err);
      toast.error(err.response?.data?.message || 'Erreur lors du changement de statut');
    } finally {
      setChangingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) {
      toast.error('Veuillez entrer une note');
      return;
    }

    setAddingNote(true);
    try {
      await adminService.addNote(id, newNote);
      toast.success('Note ajoutée avec succès');
      setNoteModalOpen(false);
      setNewNote('');
      loadHistory();
    } catch (err) {
      console.error('Erreur ajout note:', err);
      toast.error(err.response?.data?.message || "Erreur lors de l'ajout de la note");
    } finally {
      setAddingNote(false);
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

  const statusLabels = {
    pending: 'En attente',
    in_progress: 'En cours',
    resolved: 'Résolu',
    rejected: 'Rejeté'
  };

  // Transitions autorisées (doit rester synchrone avec adminService backend)
  const allowedTransitions = {
    pending:     ['in_progress', 'rejected'],
    in_progress: ['resolved', 'rejected', 'pending'],
    resolved:    ['in_progress'],
    rejected:    ['pending']
  };

  const currentAllowed = allowedTransitions[report?.status] || [];
  const statusOptions = currentAllowed.map(s => ({ value: s, label: statusLabels[s] }));

  const openStatusChange = (preset) => {
    setNewStatus(preset || '');
    setStatusComment('');
    setStatusModalOpen(true);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-orange-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Signalement introuvable
            </h3>
            <Button variant="primary" onClick={() => navigate('/admin/reports')}>
              Retour à la liste
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/admin/reports')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Signalement #{report.id}
              </h1>
              <p className="text-gray-600">{report.title}</p>
            </div>
          </div>
          <StatusBadge status={report.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photos */}
            {report.photos && report.photos.length > 0 && (
              <Card>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Photos</h2>
                <div className="grid grid-cols-2 gap-4">
                  {report.photos.map((photo) => (
                    <img
                      key={photo.id}
                      src={resolveImageUrl(photo.photo_url)}
                      alt="Photo du signalement"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </Card>
            )}

            {/* Détails */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Détails</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                  <p className="text-gray-900">{report.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      Adresse
                    </h3>
                    <p className="text-gray-900">{report.address}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      Catégorie
                    </h3>
                    <p className="text-gray-900">{report.category?.name || 'N/A'}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Date de création
                    </h3>
                    <p className="text-gray-900">{formatDate(report.created_at)}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Score de priorité
                    </h3>
                    <p className="text-gray-900 font-semibold">
                      {report.priority_score?.toFixed(1) || '0.0'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Citoyen
                    </h3>
                    <p className="text-gray-900">
                      {report.citizen?.full_name || report.citizen?.email || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Appuis
                    </h3>
                    <p className="text-gray-900">{report.supports_count || 0}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Historique */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Historique des changements
              </h2>
              {history.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucun historique disponible</p>
              ) : (
                <div className="space-y-4">
                  {history.map((entry, index) => (
                    <div key={index} className="flex gap-4 border-l-2 border-gray-200 pl-4">
                      <div className="flex-shrink-0 pt-1">
                        {getStatusIcon(entry.new_status)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          Changement de statut: {entry.old_status} → {entry.new_status}
                        </p>
                        {entry.comment && (
                          <p className="text-sm text-gray-600 mt-1">{entry.comment}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(entry.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar actions */}
          <div className="space-y-6">
            {/* Actions rapides */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-2">
                {currentAllowed.includes('in_progress') && (
                  <Button variant="primary" fullWidth onClick={() => openStatusChange('in_progress')}>
                    <Clock className="h-4 w-4 mr-2" />
                    {report.status === 'resolved' ? 'Rouvrir' : 'Prendre en charge'}
                  </Button>
                )}
                {currentAllowed.includes('resolved') && (
                  <Button variant="primary" fullWidth onClick={() => openStatusChange('resolved')}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marquer résolu
                  </Button>
                )}
                {currentAllowed.includes('rejected') && (
                  <Button variant="outline" fullWidth onClick={() => openStatusChange('rejected')}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>
                )}
                {currentAllowed.includes('pending') && (
                  <Button variant="outline" fullWidth onClick={() => openStatusChange('pending')}>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Remettre en attente
                  </Button>
                )}
                {currentAllowed.length === 0 && (
                  <p className="text-sm text-gray-500">Aucune transition disponible depuis ce statut.</p>
                )}

                <Button variant="outline" fullWidth onClick={() => setNoteModalOpen(true)} className="mt-2">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Ajouter une note
                </Button>

                <Button variant="primary" fullWidth onClick={() => setAssignModalOpen(true)} className="mt-2">
                  <Wrench className="h-4 w-4 mr-2" />
                  Créer intervention
                </Button>
              </div>
            </Card>

            {/* Informations supplémentaires */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Informations
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Statut actuel</p>
                  <p className="font-medium text-gray-900">
                    <StatusBadge status={report.status} />
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Dernière mise à jour</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(report.updated_at)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal changement de statut */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title="Changer le statut"
      >
        <div className="space-y-4">
          <Select
            label="Nouveau statut"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            options={[
              { value: '', label: 'Sélectionner un statut' },
              ...statusOptions
            ]}
            helperText={`Statut actuel : ${statusLabels[report.status] || report.status}`}
          />

          <Textarea
            label="Commentaire (optionnel)"
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
            placeholder="Ajouter un commentaire sur ce changement de statut..."
            rows={4}
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => setStatusModalOpen(false)}
              disabled={changingStatus}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleStatusChange}
              disabled={changingStatus || !newStatus}
            >
              {changingStatus ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Mise à jour...
                </>
              ) : (
                'Confirmer'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal ajout de note */}
      <Modal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        title="Ajouter une note"
      >
        <div className="space-y-4">
          <Textarea
            label="Note"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Ajouter une note interne sur ce signalement..."
            rows={6}
          />

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => setNoteModalOpen(false)}
              disabled={addingNote}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleAddNote}
              disabled={addingNote || !newNote.trim()}
            >
              {addingNote ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Ajout...
                </>
              ) : (
                'Ajouter'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <AssignInterventionModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        reportId={report.id}
        onCreated={() => {
          loadReport();
          loadHistory();
        }}
      />
    </div>
  );
};

export default ReportDetailAdmin;
