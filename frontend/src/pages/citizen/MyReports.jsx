import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Calendar,
  Edit,
  Trash2,
  Plus,
  TrendingUp,
  BarChart3,
  FileText
} from 'lucide-react';
import {
  Button,
  Card,
  StatusBadge,
  Spinner,
  Select,
  Modal
} from '../../components/common';
import reportService from '../../services/reportService';
import toast from 'react-hot-toast';

/**
 * Page des signalements de l'utilisateur connecté
 */
const MyReports = () => {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReports: 0,
    limit: 10
  });

  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 10
  });

  const [showFilters, setShowFilters] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Statistiques de l'utilisateur
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0
  });

  // Charger les signalements
  const loadMyReports = async (customFilters = {}) => {
    setLoading(true);

    try {
      const data = await reportService.getMyReports({ ...filters, ...customFilters });
      setReports(data.reports || data.data || []);

      if (data.pagination) {
        setPagination(data.pagination);
      }

      // Calculer les statistiques à partir des données
      calculateStats(data.reports || data.data || []);
    } catch (err) {
      console.error('Erreur chargement signalements:', err);
      toast.error('Impossible de charger vos signalements');
    } finally {
      setLoading(false);
    }
  };

  // Calculer les statistiques
  const calculateStats = (reportsList) => {
    const newStats = {
      total: reportsList.length,
      pending: 0,
      confirmed: 0,
      in_progress: 0,
      resolved: 0,
      rejected: 0
    };

    reportsList.forEach((report) => {
      if (newStats[report.status] !== undefined) {
        newStats[report.status]++;
      }
    });

    setStats(newStats);
  };

  // Charger au montage et quand les filtres changent
  useEffect(() => {
    loadMyReports();
  }, [filters.page]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const applyFilters = () => {
    loadMyReports(filters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      status: '',
      page: 1,
      limit: 10
    };
    setFilters(defaultFilters);
    loadMyReports(defaultFilters);
  };

  const handleReportClick = (reportId) => {
    navigate(`/reports/${reportId}`);
  };

  const handleEditReport = (e, reportId) => {
    e.stopPropagation();
    navigate(`/reports/${reportId}/edit`);
  };

  const handleDeleteClick = (e, report) => {
    e.stopPropagation();
    setReportToDelete(report);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;

    setDeleting(true);
    try {
      await reportService.deleteReport(reportToDelete.id);
      toast.success('Signalement supprimé avec succès');
      setDeleteModalOpen(false);
      setReportToDelete(null);
      loadMyReports(); // Recharger la liste
    } catch (err) {
      console.error('Erreur suppression:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setDeleting(false);
    }
  };

  const changePage = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'pending', label: 'En attente' },
    { value: 'confirmed', label: 'Confirmé' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'resolved', label: 'Résolu' },
    { value: 'rejected', label: 'Rejeté' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Mes signalements
          </h1>
          <p className="text-gray-600 mt-2">
            Gérez et suivez vos signalements
          </p>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <Card className="text-center">
            <div className="flex items-center justify-center mb-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </Card>

          <Card className="text-center">
            <div className="flex items-center justify-center mb-2">
              <FileText className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.pending}</div>
            <div className="text-xs text-gray-500">En attente</div>
          </Card>

          <Card className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.confirmed}</div>
            <div className="text-xs text-gray-500">Confirmés</div>
          </Card>

          <Card className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.in_progress}</div>
            <div className="text-xs text-gray-500">En cours</div>
          </Card>

          <Card className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.resolved}</div>
            <div className="text-xs text-gray-500">Résolus</div>
          </Card>

          <Card className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{stats.rejected}</div>
            <div className="text-xs text-gray-500">Rejetés</div>
          </Card>
        </div>

        {/* Filtres et actions */}
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            {/* Filtres */}
            <div className="flex-1">
              <Select
                label="Filtrer par statut"
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                options={statusOptions}
              />
            </div>

            {/* Boutons */}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filtres
              </Button>

              <Button variant="primary" onClick={applyFilters}>
                Rechercher
              </Button>

              <Button variant="primary" onClick={() => navigate('/reports/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau
              </Button>
            </div>
          </div>

          {/* Filtres avancés (masquables) */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-end justify-end">
                <Button variant="secondary" onClick={resetFilters}>
                  Réinitialiser
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Liste des signalements */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <MapPin className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun signalement trouvé
              </h3>
              <p className="text-gray-500 mb-6">
                Vous n'avez pas encore créé de signalement
              </p>
              <Button variant="primary" onClick={() => navigate('/reports/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Créer mon premier signalement
              </Button>
            </div>
          </Card>
        ) : (
          <>
            {/* Résultats */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {pagination.totalReports} signalement(s) trouvé(s)
              </p>
              <p className="text-sm text-gray-600">
                Page {pagination.currentPage} sur {pagination.totalPages}
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {reports.map((report) => (
                <Card
                  key={report.id}
                  hoverable
                  onClick={() => handleReportClick(report.id)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Photo miniature */}
                    {report.photos && report.photos.length > 0 ? (
                      <div className="flex-shrink-0">
                        <img
                          src={report.photos[0].photo_url}
                          alt="Photo du signalement"
                          className="w-full sm:w-32 h-32 object-cover rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="flex-shrink-0 w-full sm:w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                        <MapPin className="h-8 w-8 text-gray-400" />
                      </div>
                    )}

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {report.title}
                          </h3>
                          <p className="text-sm text-gray-600 flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {report.address}
                          </p>
                        </div>
                        <StatusBadge status={report.status} />
                      </div>

                      <p className="text-gray-700 line-clamp-2 mb-3">
                        {report.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(report.created_at)}
                        </span>
                        <span>{report.supports_count || 0} appuis</span>
                        {report.category && (
                          <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                            {report.category.name}
                          </span>
                        )}
                        <span className="ml-auto font-medium text-primary-600">
                          Priorité: {report.priority_score?.toFixed(1) || '0.0'}
                        </span>
                      </div>

                      {/* Actions (seulement pour les signalements en attente) */}
                      {report.status === 'pending' && (
                        <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleEditReport(e, report.id)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleDeleteClick(e, report)}
                            className="text-red-600 hover:bg-red-50 border-red-200"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Supprimer
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Card>
                <div className="flex items-center justify-between">
                  <Button
                    variant="secondary"
                    onClick={() => changePage(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                  >
                    Précédent
                  </Button>

                  <div className="flex items-center gap-2">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter((page) => {
                        // Afficher seulement quelques pages autour de la page actuelle
                        return (
                          page === 1 ||
                          page === pagination.totalPages ||
                          Math.abs(page - pagination.currentPage) <= 2
                        );
                      })
                      .map((page, index, array) => {
                        // Ajouter "..." entre les pages non consécutives
                        const showEllipsis = index > 0 && page - array[index - 1] > 1;

                        return (
                          <React.Fragment key={page}>
                            {showEllipsis && <span className="text-gray-400">...</span>}
                            <button
                              onClick={() => changePage(page)}
                              className={`px-3 py-1 rounded ${
                                page === pagination.currentPage
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        );
                      })}
                  </div>

                  <Button
                    variant="secondary"
                    onClick={() => changePage(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                  >
                    Suivant
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirmer la suppression"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Êtes-vous sûr de vouloir supprimer ce signalement ?
          </p>
          {reportToDelete && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-1">
                {reportToDelete.title}
              </h4>
              <p className="text-sm text-gray-600">{reportToDelete.address}</p>
            </div>
          )}
          <p className="text-sm text-red-600">
            Cette action est irréversible.
          </p>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyReports;
