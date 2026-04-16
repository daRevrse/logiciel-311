import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, Plus, Filter, ThumbsUp } from 'lucide-react';
import { useReports } from '../../hooks/useReports';
import { useSupports } from '../../hooks/useSupports';
import { Button, Card, StatusBadge, Spinner } from '../../components/common';

/**
 * Page d'accueil citoyenne - Vue split carte/liste des signalements
 */
const Home = () => {
  const navigate = useNavigate();
  const { reports, loading, loadReports } = useReports({}, true);
  const { getTopSupported } = useSupports();

  const [activeTab, setActiveTab] = useState('list');
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

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Liste — full mobile, 40% desktop */}
      <div className="w-full lg:w-2/5 overflow-y-auto border-r border-gray-200 bg-white flex flex-col">
        {/* Tabs mobile Liste/Carte */}
        <div className="lg:hidden flex border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'list' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
          >
            Liste
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-3 text-sm font-medium ${activeTab === 'map' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
          >
            Carte
          </button>
        </div>

        {/* Filtres */}
        <div className={`flex-shrink-0 p-4 border-b border-gray-100 ${activeTab === 'map' ? 'hidden lg:block' : ''}`}>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtres</span>
          </div>
          <div className="flex gap-2">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="input-field text-sm flex-1"
            >
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmé</option>
              <option value="in_progress">En cours</option>
              <option value="resolved">Résolu</option>
              <option value="rejected">Rejeté</option>
            </select>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Rechercher..."
              className="input-field text-sm flex-1"
            />
            <Button variant="primary" size="sm" onClick={applyFilters}>
              OK
            </Button>
          </div>
        </div>

        {/* Liste des signalements — cachée sur mobile si tab=map */}
        <div className={`flex-1 overflow-y-auto ${activeTab === 'map' ? 'hidden lg:block' : ''}`}>
          {loading ? (
            <div className="flex justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">Aucun signalement trouvé</p>
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/reports/${report.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{report.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{report.address || report.location}</p>
                  </div>
                  <StatusBadge status={report.status} size="sm" />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">{report.category?.name}</span>
                  <span className="inline-flex items-center gap-1 text-[#2BB673] font-semibold text-sm">
                    <ThumbsUp className="h-3.5 w-3.5" />{report.supports_count || 0}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Carte — cachée sur mobile si tab=list */}
      <div className={`lg:flex-1 ${activeTab === 'list' ? 'hidden lg:block' : 'flex-1'}`}>
        <div className="h-full bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-2" />
            <p>Carte interactive (Leaflet)</p>
          </div>
        </div>
      </div>

      {/* FAB — nouveau signalement */}
      <Link
        to="/reports/create"
        className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-20 h-14 w-14 rounded-full bg-[#2BB673] text-white shadow-lg flex items-center justify-center hover:opacity-90 transition-opacity"
        aria-label="Nouveau signalement"
      >
        <Plus className="h-7 w-7" />
      </Link>
    </div>
  );
};

export default Home;
