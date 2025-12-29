import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Plus, Filter, List as ListIcon } from 'lucide-react';
import { useReports } from '../../hooks/useReports';
import { useSupports } from '../../hooks/useSupports';
import { Button, Card, StatusBadge, Spinner } from '../../components/common';
import toast from 'react-hot-toast';

/**
 * Page d'accueil citoyenne - Vue carte et liste des signalements
 */
const Home = () => {
  const navigate = useNavigate();
  const { reports, loading, loadReports } = useReports({}, true);
  const { getTopSupported } = useSupports();

  const [view, setView] = useState('list'); // 'map' ou 'list'
  const [topReports, setTopReports] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  useEffect(() => {
    loadTopReports();
  }, []);

  const loadTopReports = async () => {
    try {
      const data = await getTopSupported(5);
      setTopReports(data);
    } catch (error) {
      console.error('Erreur chargement top signalements:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    loadReports(filters);
  };

  const handleReportClick = (reportId) => {
    navigate(`/reports/${reportId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec actions */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Signalements</h1>
              <p className="text-gray-600">Consultez et signalez les problèmes de votre ville</p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setView(view === 'list' ? 'map' : 'list')}
              >
                {view === 'list' ? (
                  <>
                    <MapPin className="h-4 w-4 mr-2" />
                    Vue carte
                  </>
                ) : (
                  <>
                    <ListIcon className="h-4 w-4 mr-2" />
                    Vue liste
                  </>
                )}
              </Button>

              <Button variant="primary" onClick={() => navigate('/reports/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau signalement
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2">
            {/* Filtres */}
            <Card className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Filtres</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Statut
                  </label>
                  <select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    className="input-field"
                  >
                    <option value="">Tous les statuts</option>
                    <option value="pending">En attente</option>
                    <option value="confirmed">Confirmé</option>
                    <option value="in_progress">En cours</option>
                    <option value="resolved">Résolu</option>
                    <option value="rejected">Rejeté</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Recherche
                  </label>
                  <input
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Rechercher..."
                    className="input-field"
                  />
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={applyFilters}
              >
                Appliquer les filtres
              </Button>
            </Card>

            {/* Liste des signalements */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : view === 'map' ? (
              <Card>
                <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-2" />
                    <p>Carte interactive (à intégrer avec Leaflet/Mapbox)</p>
                  </div>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {reports.length === 0 ? (
                  <Card>
                    <div className="text-center py-8 text-gray-500">
                      <p>Aucun signalement trouvé</p>
                    </div>
                  </Card>
                ) : (
                  reports.map((report) => (
                    <Card
                      key={report.id}
                      hoverable
                      onClick={() => handleReportClick(report.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {report.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {report.address}
                          </p>
                        </div>
                        <StatusBadge status={report.status} />
                      </div>

                      <p className="text-gray-700 line-clamp-2 mb-3">
                        {report.description}
                      </p>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {report.category?.name || 'Sans catégorie'}
                          </span>
                          <span>
                            {report.supports_count || 0} appuis
                          </span>
                        </div>
                        <span>{formatDate(report.created_at)}</span>
                      </div>

                      {report.photos && report.photos.length > 0 && (
                        <div className="mt-3 flex gap-2">
                          {report.photos.slice(0, 3).map((photo) => (
                            <img
                              key={photo.id}
                              src={photo.photo_url}
                              alt="Photo du signalement"
                              className="h-16 w-16 object-cover rounded"
                            />
                          ))}
                          {report.photos.length > 3 && (
                            <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center text-sm text-gray-600">
                              +{report.photos.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Top signalements */}
            <Card className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                🔥 Signalements les plus appuyés
              </h3>

              {topReports.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun signalement pour le moment</p>
              ) : (
                <div className="space-y-3">
                  {topReports.map((report, index) => (
                    <div
                      key={report.id}
                      onClick={() => handleReportClick(report.id)}
                      className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {report.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {report.supports_count || 0} appuis
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Statistiques */}
            <Card>
              <h3 className="font-semibold text-gray-900 mb-4">
                📊 Statistiques
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total signalements</span>
                  <span className="font-semibold text-gray-900">{reports.length}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">En attente</span>
                  <span className="font-semibold text-yellow-600">
                    {reports.filter(r => r.status === 'pending').length}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">En cours</span>
                  <span className="font-semibold text-purple-600">
                    {reports.filter(r => r.status === 'in_progress').length}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Résolus</span>
                  <span className="font-semibold text-green-600">
                    {reports.filter(r => r.status === 'resolved').length}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
