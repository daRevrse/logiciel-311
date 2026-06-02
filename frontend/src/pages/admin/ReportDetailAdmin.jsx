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
import ReportCommentsThread from '../../components/admin/ReportCommentsThread';
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
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const CLOSURE_REASONS = {
  resolved: [
    { value: 'resolved_completed', label: 'Résolu — Action effectuée' },
    { value: 'resolved_duplicate', label: 'Résolu — Doublon' },
    { value: 'resolved_no_action_needed', label: 'Résolu — Aucune action requise' }
  ],
  rejected: [
    { value: 'rejected_invalid', label: 'Rejeté — Invalide' },
    { value: 'rejected_out_of_scope', label: 'Rejeté — Hors compétence' },
    { value: 'rejected_duplicate', label: 'Rejeté — Doublon' }
  ]
};

/**
 * Page de détail d'un signalement pour administrateurs
 */
const ReportDetailAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [interventions, setInterventions] = useState([]);

  // États pour changement de statut
  const [newStatus, setNewStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [closureReason, setClosureReason] = useState('');
  const [closureReasonDetails, setClosureReasonDetails] = useState('');
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
      loadInterventions();
    }
  }, [id]);

  const loadInterventions = async () => {
    try {
      const res = await adminService.listInterventions({ report_id: id });
      setInterventions(res?.data || res?.interventions || []);
    } catch (err) {
      console.error('Erreur chargement interventions:', err);
      setInterventions([]);
    }
  };

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await reportService.getReportById(id);
      // Réponse backend : { success, data: report }
      setReport(data.data || data.report || data);
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
      const res = await adminService.getReportHistory(id);
      const payload = res?.data ?? res;
      const timeline = payload?.timeline
        ?? payload?.history
        ?? (Array.isArray(payload) ? payload : []);
      setHistory(Array.isArray(timeline) ? timeline : []);
    } catch (err) {
      console.error('Erreur chargement historique:', err);
      setHistory([]);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus) {
      toast.error('Veuillez sélectionner un statut');
      return;
    }

    const isFinal = newStatus === 'resolved' || newStatus === 'rejected';
    if (isFinal && !closureReason) {
      toast.error('Veuillez sélectionner une raison de clôture');
      return;
    }

    setChangingStatus(true);
    try {
      await adminService.changeStatus(
        id,
        newStatus,
        statusComment,
        isFinal ? closureReason : null,
        isFinal ? closureReasonDetails : null
      );
      toast.success('Statut mis à jour avec succès');
      setStatusModalOpen(false);
      setNewStatus('');
      setStatusComment('');
      setClosureReason('');
      setClosureReasonDetails('');
      loadReport();
      loadHistory();
      loadInterventions();
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
    assigned: 'Assigné',
    in_progress: 'En cours',
    completed: 'Terminé',
    resolved: 'Résolu',
    rejected: 'Rejeté'
  };

  // Transitions autorisées (doit rester synchrone avec adminService backend)
  const allowedTransitions = {
    pending:     ['in_progress', 'rejected'],
    assigned:    ['in_progress', 'rejected', 'pending'],
    in_progress: ['completed', 'resolved', 'rejected', 'pending'],
    completed:   ['resolved', 'rejected', 'in_progress'],
    resolved:    ['in_progress'],
    rejected:    ['pending']
  };

  const currentAllowed = allowedTransitions[report?.status] || [];
  const statusOptions = currentAllowed.map(s => ({ value: s, label: statusLabels[s] }));

  const openStatusChange = (preset) => {
    setNewStatus(preset || '');
    setStatusComment('');
    setClosureReason('');
    setClosureReasonDetails('');
    setStatusModalOpen(true);
  };

  const isOverdueSla = report?.sla_due_at
    && !['resolved', 'rejected'].includes(report?.status)
    && new Date(report.sla_due_at) < new Date();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-amber-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-cyan-600" />;
      case 'assigned':
        return <Wrench className="h-5 w-5 text-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-slate-500" />;
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
            <h3 className="text-lg font-medium text-navy-deep mb-2">
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
    <div>
      <div>
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
              <h1 className="text-2xl font-bold text-navy-deep">
                Signalement #{report.id}
              </h1>
              <p className="text-gray-600">{report.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOverdueSla && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 border border-red-200">
                ⚠ SLA dépassé
              </span>
            )}
            {report.escalated_at && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                Escaladé
              </span>
            )}
            <StatusBadge status={report.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photos */}
            {report.photos && report.photos.length > 0 && (
              <Card>
                <h2 className="text-lg font-semibold text-navy-deep mb-4">Photos</h2>
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
              <h2 className="text-lg font-semibold text-navy-deep mb-4">Détails</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
                  <p className="text-navy-deep">{report.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      Adresse
                    </h3>
                    <p className="text-navy-deep">{report.address}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      Catégorie
                    </h3>
                    <p className="text-navy-deep">{report.category?.name || 'N/A'}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Date de création
                    </h3>
                    <p className="text-navy-deep">{formatDate(report.created_at)}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      Score de priorité
                    </h3>
                    <p className="text-navy-deep font-semibold">
                      {report.priority_score?.toFixed(1) || '0.0'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Citoyen
                    </h3>
                    <p className="text-navy-deep">
                      {report.citizen?.full_name || report.citizen?.email || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1 flex items-center">
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Appuis
                    </h3>
                    <p className="text-navy-deep">{report.supports?.length ?? report.supportsCount ?? report.supports_count ?? 0}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Intervention(s) */}
            <Card>
              <h2 className="text-lg font-semibold text-navy-deep mb-4 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-turquoise" /> Intervention
              </h2>
              {interventions.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucune intervention assignée. Utilisez « Créer intervention » pour affecter un agent.</p>
              ) : (
                <div className="space-y-4">
                  {interventions.map((iv) => {
                    const IV_STATUS = {
                      pending: { label: 'En attente', cls: 'bg-slate-100 text-slate-700' },
                      scheduled: { label: 'Planifiée', cls: 'bg-blue-50 text-blue-700' },
                      in_progress: { label: 'En cours', cls: 'bg-amber-50 text-amber-700' },
                      completed: { label: 'Terminée', cls: 'bg-cyan-50 text-cyan-700' },
                      cancelled: { label: 'Annulée', cls: 'bg-slate-100 text-slate-500' },
                    };
                    const st = IV_STATUS[iv.status] || IV_STATUS.pending;
                    const dur = iv.started_at && iv.completed_at
                      ? (() => { const ms = new Date(iv.completed_at) - new Date(iv.started_at); const h = Math.floor(ms / 3600000); const m = Math.floor((ms % 3600000) / 60000); return `${h}h ${m}min`; })()
                      : null;
                    return (
                      <div key={iv.id} className="rounded-xl border border-gray-100 p-4 bg-gray-50/50">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold text-navy-deep">{iv.agent?.full_name || iv.agent?.email || 'Agent —'}</span>
                          </div>
                          <span className={`text-[10px] uppercase tracking-wide font-bold px-2 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                        </div>
                        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
                          <div><dt className="text-gray-400">Planifiée</dt><dd className="font-medium text-navy-deep">{iv.scheduled_at ? formatDate(iv.scheduled_at) : '—'}</dd></div>
                          <div><dt className="text-gray-400">Démarrée</dt><dd className="font-medium text-navy-deep">{iv.started_at ? formatDate(iv.started_at) : '—'}</dd></div>
                          <div><dt className="text-gray-400">Terminée</dt><dd className="font-medium text-navy-deep">{iv.completed_at ? formatDate(iv.completed_at) : '—'}</dd></div>
                          {dur && <div><dt className="text-gray-400">Durée</dt><dd className="font-medium text-navy-deep">{dur}</dd></div>}
                          {iv.cost != null && <div><dt className="text-gray-400">Coût</dt><dd className="font-medium text-navy-deep">{Number(iv.cost).toFixed(2)} €</dd></div>}
                        </dl>
                        {iv.notes && <p className="text-xs text-gray-600 mt-3 pt-3 border-t border-gray-100 whitespace-pre-wrap">{iv.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Fil de discussion */}
            <Card>
              <ReportCommentsThread
                reportId={report.id}
                currentUserId={user?.id}
                currentUserRole={user?.role}
              />
            </Card>

            {/* Historique */}
            <Card>
              <h2 className="text-lg font-semibold text-navy-deep mb-4">
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
                        <p className="text-sm font-medium text-navy-deep">
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
              <h2 className="text-lg font-semibold text-navy-deep mb-4">Actions</h2>
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
              <h2 className="text-lg font-semibold text-navy-deep mb-4">
                Informations
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Statut actuel</p>
                  <p className="font-medium text-navy-deep">
                    <StatusBadge status={report.status} />
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Dernière mise à jour</p>
                  <p className="font-medium text-navy-deep">
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

          {(newStatus === 'resolved' || newStatus === 'rejected') && (
            <>
              <Select
                label="Raison de clôture *"
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                options={[
                  { value: '', label: 'Sélectionner une raison' },
                  ...(CLOSURE_REASONS[newStatus] || [])
                ]}
                helperText="Obligatoire pour résoudre ou rejeter"
              />
              <Textarea
                label="Détails complémentaires (optionnel)"
                value={closureReasonDetails}
                onChange={(e) => setClosureReasonDetails(e.target.value)}
                placeholder="Précisions sur la raison de clôture..."
                rows={2}
              />
            </>
          )}

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
              disabled={
                changingStatus
                || !newStatus
                || ((newStatus === 'resolved' || newStatus === 'rejected') && !closureReason)
              }
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
          loadInterventions();
        }}
      />
    </div>
  );
};

export default ReportDetailAdmin;
