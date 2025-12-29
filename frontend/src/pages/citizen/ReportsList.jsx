import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, MapPin, Calendar } from "lucide-react";
import { useReports } from "../../hooks/useReports";
import {
  Button,
  Card,
  StatusBadge,
  Spinner,
  Select,
} from "../../components/common";

/**
 * Page de liste des signalements avec filtres avancés
 */
const ReportsList = () => {
  const navigate = useNavigate();
  const { reports, loading, pagination, loadReports, changePage } = useReports(
    {},
    true
  );

  const [filters, setFilters] = useState({
    status: "",
    categoryId: "",
    search: "",
    sortBy: "created_at",
    sortOrder: "DESC",
    page: 1,
    limit: 10,
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadReports(filters);
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
      status: "",
      categoryId: "",
      search: "",
      sortBy: "created_at",
      sortOrder: "DESC",
      page: 1,
      limit: 10,
    };
    setFilters(defaultFilters);
    loadReports(defaultFilters);
  };

  const handleReportClick = (reportId) => {
    navigate(`/reports/${reportId}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusOptions = [
    { value: "", label: "Tous les statuts" },
    { value: "pending", label: "En attente" },
    { value: "confirmed", label: "Confirmé" },
    { value: "in_progress", label: "En cours" },
    { value: "resolved", label: "Résolu" },
    { value: "rejected", label: "Rejeté" },
  ];

  const sortOptions = [
    { value: "created_at", label: "Date de création" },
    { value: "priority_score", label: "Priorité" },
    { value: "supports_count", label: "Nombre d'appuis" },
  ];

  const sortOrderOptions = [
    { value: "DESC", label: "Décroissant" },
    { value: "ASC", label: "Croissant" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Tous les signalements
          </h1>
          <p className="text-gray-600 mt-2">
            Consultez l'ensemble des signalements de votre municipalité
          </p>
        </div>

        {/* Barre de recherche et filtres */}
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  name="search"
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder="Rechercher par titre, description ou adresse..."
                  className="input-field pl-10"
                />
              </div>
            </div>

            {/* Boutons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filtres
              </Button>

              <Button variant="primary" onClick={applyFilters}>
                Rechercher
              </Button>
            </div>
          </div>

          {/* Filtres avancés (masquables) */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select
                  label="Statut"
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  options={statusOptions}
                />

                <Select
                  label="Trier par"
                  name="sortBy"
                  value={filters.sortBy}
                  onChange={handleFilterChange}
                  options={sortOptions}
                />

                <Select
                  label="Ordre"
                  name="sortOrder"
                  value={filters.sortOrder}
                  onChange={handleFilterChange}
                  options={sortOrderOptions}
                />

                <div className="flex items-end">
                  <Button variant="secondary" fullWidth onClick={resetFilters}>
                    Réinitialiser
                  </Button>
                </div>
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
                Aucun signalement ne correspond à vos critères de recherche
              </p>
              <Button
                variant="primary"
                onClick={() => navigate("/reports/create")}
              >
                Créer un signalement
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
                          Priorité: {report.priority_score?.toFixed(1) || "0.0"}
                        </span>
                      </div>
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
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    )
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
                        const showEllipsis =
                          index > 0 && page - array[index - 1] > 1;

                        return (
                          <React.Fragment key={page}>
                            {showEllipsis && (
                              <span className="text-gray-400">...</span>
                            )}
                            <button
                              onClick={() => changePage(page)}
                              className={`px-3 py-1 rounded ${
                                page === pagination.currentPage
                                  ? "bg-primary-600 text-white"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
    </div>
  );
};

export default ReportsList;
