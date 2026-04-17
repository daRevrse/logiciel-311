import api from './api';

/**
 * Service de gestion des signalements
 */
const reportService = {
  /**
   * Créer un nouveau signalement
   * @param {Object} reportData - Données du signalement
   * @returns {Promise<Object>} Signalement créé
   */
  async createReport(reportData) {
    const response = await api.post('/reports', reportData);
    return response.data;
  },

  /**
   * Uploader des photos pour un signalement
   * @param {number} reportId - ID du signalement
   * @param {FileList|Array} files - Fichiers à uploader
   * @returns {Promise<Object>} Photos uploadées
   */
  async uploadPhotos(reportId, files) {
    const formData = new FormData();

    Array.from(files).forEach((file) => {
      formData.append('photos', file);
    });

    const response = await api.post(`/reports/${reportId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return response.data;
  },

  /**
   * Lister les signalements avec filtres
   * @param {Object} filters - Filtres de recherche
   * @returns {Promise<Object>} Liste paginée des signalements
   */
  async listReports(filters = {}) {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('order', filters.sortOrder);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get(`/reports?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtenir les détails d'un signalement
   * @param {number} reportId - ID du signalement
   * @returns {Promise<Object>} Détails du signalement
   */
  async getReportById(reportId) {
    const response = await api.get(`/reports/${reportId}`);
    return response.data;
  },

  /**
   * Obtenir les signalements de l'utilisateur connecté
   * @param {Object} filters - Filtres optionnels
   * @returns {Promise<Object>} Liste des signalements de l'utilisateur
   */
  async getMyReports(filters = {}) {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get(`/reports/my-reports?${params.toString()}`);
    return response.data;
  },

  /**
   * Mettre à jour un signalement (citoyen)
   * @param {number} reportId - ID du signalement
   * @param {Object} updateData - Données à mettre à jour
   * @returns {Promise<Object>} Signalement mis à jour
   */
  async updateReport(reportId, updateData) {
    const response = await api.put(`/reports/${reportId}`, updateData);
    return response.data;
  },

  /**
   * Supprimer un signalement (citoyen)
   * @param {number} reportId - ID du signalement
   * @returns {Promise<Object>} Confirmation de suppression
   */
  async deleteReport(reportId) {
    const response = await api.delete(`/reports/${reportId}`);
    return response.data;
  },

  /**
   * Supprimer une photo d'un signalement
   * @param {number} reportId - ID du signalement
   * @param {number} photoId - ID de la photo
   * @returns {Promise<Object>} Confirmation de suppression
   */
  async deletePhoto(reportId, photoId) {
    const response = await api.delete(`/reports/${reportId}/photos/${photoId}`);
    return response.data;
  },

  /**
   * Obtenir les catégories de signalements
   * @param {number} municipalityId - ID de la municipalité (optionnel pour les connectés)
   * @returns {Promise<Array>} Liste des catégories
   */
  async getCategories(municipalityId = null) {
    const params = municipalityId ? { municipalityId } : {};
    const response = await api.get('/reports/categories', { params });
    return response.data;
  },

  /**
   * Récupérer les municipalités actives pour le signalement public
   * @returns {Promise<Array>}
   */
  async getPublicMunicipalities() {
    const response = await api.get('/reports/public/municipalities');
    return response.data;
  },

  /**
   * Rechercher des signalements par localisation
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {number} radius - Rayon de recherche en km (optionnel)
   * @returns {Promise<Array>} Signalements à proximité
   */
  async searchByLocation(latitude, longitude, radius = 5) {
    const response = await api.get('/reports/nearby', {
      params: { latitude, longitude, radius }
    });
    return response.data;
  }
};

export default reportService;
