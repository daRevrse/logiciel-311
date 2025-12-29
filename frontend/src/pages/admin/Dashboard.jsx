import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  MapPin,
  Calendar,
  ThumbsUp,
  Target,
  Building2,
  Shield
} from 'lucide-react';
import adminService from '../../services/adminService';
import reportService from '../../services/reportService';
import { Card, Button, Spinner, StatusBadge } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

/**
 * Tableau de bord administrateur
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();

  const [dashboardData, setDashboardData] = useState(null);
  const [recentReports, setRecentReports] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      // Calculer les dates en fonction de la période
      const filters = {};
      if (period !== 'all') {
        const now = new Date();
        const dateFrom = new Date();

        switch (period) {
          case '7d':
            dateFrom.setDate(now.getDate() - 7);
            break;
          case '30d':
            dateFrom.setDate(now.getDate() - 30);
            break;
          case '90d':
            dateFrom.setDate(now.getDate() - 90);
            break;
          case '1y':
            dateFrom.setFullYear(now.getFullYear() - 1);
            break;
        }

        filters.dateFrom = dateFrom.toISOString().split('T')[0];
        filters.dateTo = now.toISOString().split('T')[0];
      }

      const data = await adminService.getDashboard(filters);
      setDashboardData(data);

      // Charger les signalements récents
      const reportsData = await reportService.listReports({
        sortBy: 'created_at',
        sortOrder: 'DESC',
        limit: 5
      });
      setRecentReports(reportsData.reports || reportsData.data || []);

      // Si super admin, charger les données des municipalités
      if (isSuperAdmin()) {
        try {
          const muniData = await adminService.getMunicipalities();
          setMunicipalities(muniData.data || []);
        } catch (err) {
          console.error('Erreur chargement municipalités:', err);
        }
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      toast.error('Impossible de charger le tableau de bord');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const periodOptions = [
    { value: 'all', label: 'Tout' },
    { value: '7d', label: '7 jours' },
    { value: '30d', label: '30 jours' },
    { value: '90d', label: '90 jours' },
    { value: '1y', label: '1 an' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const overview = dashboardData?.data?.overview || {};
  const reportsByStatus = overview.reportsByStatus || {};
  const reportsByCategory = dashboardData?.data?.reportsByCategory || [];
  const topSupported = dashboardData?.data?.topSupported || [];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tableau de bord {isSuperAdmin() && <span className="text-purple-600">Super Admin</span>}
            </h1>
            <p className="text-gray-600 mt-1">
              {isSuperAdmin()
                ? 'Vue d\'ensemble du système multi-municipalités'
                : 'Vue d\'ensemble de l\'activité des signalements'
              }
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Bouton accès rapide super admin */}
            {isSuperAdmin() && (
              <Button
                variant="primary"
                onClick={() => navigate('/admin/municipalities')}
                className="whitespace-nowrap"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Gérer les municipalités
              </Button>
            )}

            {/* Sélecteur de période */}
            <div className="flex gap-2">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPeriod(option.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    period === option.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Super Admin - Statistiques système */}
        {isSuperAdmin() && municipalities.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Municipalités</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {municipalities.length}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Total dans le système
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Licences actives</p>
                  <p className="text-3xl font-bold text-green-600">
                    {municipalities.filter(m => m.license && m.license.is_active).length}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Municipalités actives
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Licences expirées</p>
                  <p className="text-3xl font-bold text-red-600">
                    {municipalities.filter(m => {
                      if (!m.license) return false;
                      const expiresAt = new Date(m.license.expires_at);
                      return expiresAt < new Date();
                    }).length}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Nécessitent renouvellement
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Expirent bientôt</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {municipalities.filter(m => {
                      if (!m.license || !m.license.is_active) return false;
                      const expiresAt = new Date(m.license.expires_at);
                      const now = new Date();
                      const daysUntilExpiry = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
                      return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
                    }).length}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Dans les 30 jours
                  </p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total signalements */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total signalements</p>
                <p className="text-3xl font-bold text-gray-900">
                  {overview.totalReports || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Tous les signalements
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* En attente */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En attente</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {reportsByStatus.pending || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Nécessitent une action
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          {/* En cours */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">En cours</p>
                <p className="text-3xl font-bold text-orange-600">
                  {reportsByStatus.in_progress || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  En traitement
                </p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </Card>

          {/* Résolus */}
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Résolus</p>
                <p className="text-3xl font-bold text-green-600">
                  {reportsByStatus.resolved || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Taux: {overview.resolutionRate || 0}%
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Graphiques et données détaillées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Répartition par statut */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Répartition par statut
            </h2>
            <div className="space-y-3">
              {Object.entries(reportsByStatus).length > 0 ? (
                Object.entries(reportsByStatus).map(([status, count]) => {
                  const total = overview.totalReports || 1;
                  const percentage = ((count / total) * 100).toFixed(1);

                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1">
                        <StatusBadge status={status} size="sm" />
                        <span className="text-sm font-medium text-gray-900">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">Aucune donnée disponible</p>
              )}
            </div>
          </Card>

          {/* Top catégories */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Signalements par catégorie
            </h2>
            <div className="space-y-3">
              {reportsByCategory && reportsByCategory.length > 0 ? (
                reportsByCategory.slice(0, 5).map((item, index) => {
                  const count = parseInt(item.count || item.dataValues?.count || 0);
                  const categoryName = item.category?.name || item['category.name'] || 'Inconnu';

                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span className="text-gray-900">{categoryName}</span>
                      </div>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 text-center py-8">Aucune donnée disponible</p>
              )}
            </div>
          </Card>
        </div>

        {/* Statistiques supplémentaires */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Temps moyen résolution</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overview.avgResolutionTimeDays || 0}j
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Assignés</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overview.assignedCount || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Non assignés</p>
                <p className="text-2xl font-bold text-gray-900">
                  {overview.unassignedCount || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Activité récente</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData?.data?.recentActivityCount || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Top signalements appuyés */}
        {topSupported && topSupported.length > 0 && (
          <Card className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Signalements les plus appuyés
            </h2>
            <div className="space-y-3">
              {topSupported.map((report, index) => {
                const supportsCount = parseInt(report.dataValues?.supports_count || report.supports_count || 0);

                return (
                  <div
                    key={report.id}
                    onClick={() => navigate(`/admin/reports/${report.id}`)}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <span className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        #{report.id} - {report.title}
                      </h3>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        {report.category?.name && (
                          <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
                            {report.category.name}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-primary-600">
                      <ThumbsUp className="h-5 w-5" />
                      <span className="font-bold text-lg">{supportsCount}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Signalements récents */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Signalements récents
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/reports')}
            >
              Voir tout
            </Button>
          </div>

          {recentReports.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              Aucun signalement récent
            </p>
          ) : (
            <div className="space-y-4">
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => navigate(`/admin/reports/${report.id}`)}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  {/* Photo miniature */}
                  {report.photos && report.photos.length > 0 ? (
                    <img
                      src={report.photos[0].photo_url}
                      alt="Photo"
                      className="w-16 h-16 rounded object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-gray-400" />
                    </div>
                  )}

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-medium text-gray-900 truncate">
                        {report.title}
                      </h3>
                      <StatusBadge status={report.status} size="sm" />
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                      {report.address}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(report.created_at)}
                      </span>
                      <span>{report.supports_count || 0} appuis</span>
                      <span>Priorité: {report.priority_score?.toFixed(1) || '0.0'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
