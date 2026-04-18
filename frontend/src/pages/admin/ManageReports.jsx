import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Calendar,
  Eye,
  UserCheck,
  Filter,
  RefreshCw,
  ThumbsUp,
  CheckCircle
} from 'lucide-react';
import {
  Button,
  Card,
  StatusBadge,
  Spinner,
  Select
} from '../../components/common';
import reportService from '../../services/reportService';
import { resolveImageUrl } from '../../utils/url';
import toast from 'react-hot-toast';

/**
 * Page de gestion des signalements pour administrateurs
 */
const ManageReports = () => {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalReports: 0,
    limit: 20
  });

  const [filters, setFilters] = useState({
    status: '',
    categoryId: '',
    search: '',
    sortBy: 'created_at',
    sortOrder: 'DESC',
    page: 1,
    limit: 20
  });

  const [showFilters, setShowFilters] = useState(true);
  const [categories, setCategories] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('Tous');

  // Statistiques rapides
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
    rejected: 0
  });

  // Charger les catégories
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await reportService.getCategories();
      const list = Array.isArray(data) ? data : (data?.data || data?.categories || []);
      setCategories(list);
    } catch (err) {
      console.error('Erreur chargement catégories:', err);
    }
  };

  // Charger les signalements
  const loadReports = async (customFilters = {}) => {
    setLoading(true);

    try {
      const data = await reportService.listReports({ ...filters, ...customFilters });
      setReports(data.reports || data.data || []);

      if (data.pagination) {
        setPagination(data.pagination);
      }

      // Calculer les statistiques
      calculateStats(data.reports || data.data || []);
    } catch (err) {
      console.error('Erreur chargement signalements:', err);
      toast.error('Impossible de charger les signalements');
    } finally {
      setLoading(false);
    }
  };

  // Calculer les statistiques
  const calculateStats = (reportsList) => {
    const newStats = {
      total: reportsList.length,
      pending: 0,
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
    loadReports();
  }, [filters.page]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
  };

  const applyFilters = () => {
    loadReports(filters);
  };

  const resetFilters = () => {
    const defaultFilters = {
      status: '',
      categoryId: '',
      search: '',
      sortBy: 'created_at',
      sortOrder: 'DESC',
      page: 1,
      limit: 20
    };
    setFilters(defaultFilters);
    loadReports(defaultFilters);
  };

  const handleReportClick = (reportId) => {
    navigate(`/admin/reports/${reportId}`);
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

  const sortOptions = [
    { value: 'created_at', label: 'Date de création' },
    { value: 'priority_score', label: 'Priorité' },
    { value: 'supports_count', label: "Nombre d'appuis" },
    { value: 'updated_at', label: 'Dernière mise à jour' }
  ];

  const sortOrderOptions = [
    { value: 'DESC', label: 'Décroissant' },
    { value: 'ASC', label: 'Croissant' }
  ];

  const categoryOptions = [
    { value: '', label: 'Toutes les catégories' },
    ...categories.map((cat) => ({
      value: cat.id.toString(),
      label: cat.name
    }))
  ];

  return (
    <div className="flex gap-6 min-h-full">
      {/* Colonne principale */}
      <div className="flex-1 min-w-0">
        {/* Barre de recherche + filtres secteur */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              onKeyDown={e => e.key === 'Enter' && applyFilters()}
              placeholder="Rechercher des signalements..."
              className="input-field pl-9 h-10 text-sm"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className="p-2 text-gray-400 hover:text-gray-600">
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Titre + filtre Tous / Mon Secteur */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Incidents Récents</h2>
          <div className="flex gap-1 bg-gray-100 rounded-full p-1">
            {['Tous', 'Mon Secteur'].map(f => (
              <button key={f}
                onClick={() => setSectorFilter(f)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  sectorFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Liste signalements */}
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Aucun signalement trouvé</div>
        ) : (
          <div className="space-y-3">
            {reports.map(report => (
              <div key={report.id}
                className="bg-white rounded-[12px] shadow-card p-4 flex gap-4 hover:shadow-card-hover transition-shadow cursor-pointer"
                onClick={() => handleReportClick(report.id)}>
                {/* Thumbnail */}
                {report.photos?.length > 0 ? (
                  <img src={resolveImageUrl(report.photos[0].photo_url)} alt=""
                    className="w-24 h-24 object-cover rounded-xl flex-shrink-0" />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-8 w-8 text-gray-300" />
                  </div>
                )}

                {/* Contenu */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-base leading-tight">{report.title}</h3>
                    <StatusBadge status={report.status} size="sm" />
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mb-3">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    {report.address}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-primary-600">{report.supports_count || 0}</span>
                      <span className="text-xs font-semibold text-gray-400 ml-1.5 tracking-wider">SOUTIENS</span>
                    </div>
                    <Button variant="primary" size="sm"
                      onClick={e => { e.stopPropagation(); handleReportClick(report.id); }}>
                      <CheckCircle className="h-4 w-4" />
                      Traiter l'incident
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <Button variant="secondary" size="sm"
              onClick={() => changePage(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}>
              Précédent
            </Button>
            <span className="text-sm text-gray-500">
              Page {pagination.currentPage} / {pagination.totalPages}
            </span>
            <Button variant="secondary" size="sm"
              onClick={() => changePage(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}>
              Suivant
            </Button>
          </div>
        )}
      </div>

      {/* Panneau droit */}
      <div className="hidden xl:flex flex-col w-80 flex-shrink-0 gap-4">
        {/* Carte */}
        <div className="bg-white rounded-[12px] shadow-card overflow-hidden">
          <div className="p-4 pb-2">
            <div className="font-semibold text-gray-900 text-sm">Carte des Incidents</div>
            <div className="text-xs text-gray-400">Mises à jour en direct</div>
          </div>
          <div className="h-48 bg-gray-100 relative">
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
              Carte chargée en prod
            </div>
          </div>
          <div className="p-3 text-right">
            <button className="text-sm text-primary-600 font-medium hover:underline">
              Agrandir la carte ↗
            </button>
          </div>
        </div>

        {/* Statistiques mensuelles */}
        <div className="bg-white rounded-[12px] shadow-card p-4">
          <div className="text-xs font-semibold text-gray-400 tracking-widest uppercase mb-4">Statistiques Mensuelles</div>
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-1">Total des signalements</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-gray-900">{pagination.totalReports?.toLocaleString() || '0'}</span>
              <span className="text-xs font-semibold text-support bg-emerald-50 px-1.5 py-0.5 rounded-full">+{stats.resolved > 0 ? Math.round(stats.resolved/Math.max(stats.total,1)*100) : 0}%</span>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-600">EN COURS</span>
                <span className="font-bold text-amber-600">{stats.in_progress}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{width: `${Math.min(100, stats.total > 0 ? (stats.in_progress/stats.total)*100 : 0)}%`}} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-gray-600">RÉSOLUS</span>
                <span className="font-bold text-support">{stats.resolved}</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-support rounded-full" style={{width: `${Math.min(100, stats.total > 0 ? (stats.resolved/stats.total)*100 : 0)}%`}} />
              </div>
            </div>
          </div>
        </div>

        {/* Console admin */}
        <div className="bg-primary-600 rounded-[12px] p-5 text-white">
          <h3 className="font-bold text-base mb-2">Console d'Administration</h3>
          <p className="text-sm text-white/80 mb-4">Gérez les déploiements d'équipes et suivez la résolution des incidents prioritaires en temps réel.</p>
          <button className="bg-white text-primary-700 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors w-full">
            Gérer les équipes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageReports;
