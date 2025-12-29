import api from './api';

/**
 * Service de gestion des appuis (supports)
 */
const supportService = {
  /**
   * Ajouter son appui à un signalement
   * @param {number} reportId - ID du signalement
   * @returns {Promise<Object>} Détails de l'appui créé
   */
  async addSupport(reportId) {
    const response = await api.post(`/reports/${reportId}/support`);
    return response.data;
  },

  /**
   * Retirer son appui d'un signalement
   * @param {number} reportId - ID du signalement
   * @returns {Promise<Object>} Confirmation de retrait
   */
  async removeSupport(reportId) {
    const response = await api.delete(`/reports/${reportId}/support`);
    return response.data;
  },

  /**
   * Vérifier si l'utilisateur a déjà apporté son appui
   * @param {number} reportId - ID du signalement
   * @returns {Promise<Object>} { hasSupported: boolean }
   */
  async checkSupport(reportId) {
    const response = await api.get(`/reports/${reportId}/support/check`);
    return response.data;
  },

  /**
   * Obtenir la liste des citoyens qui ont apporté leur appui
   * @param {number} reportId - ID du signalement
   * @param {number} page - Numéro de page (optionnel)
   * @param {number} limit - Nombre par page (optionnel)
   * @returns {Promise<Object>} Liste paginée des appuis
   */
  async getSupporters(reportId, page = 1, limit = 20) {
    const response = await api.get(`/reports/${reportId}/supports`, {
      params: { page, limit }
    });
    return response.data;
  },

  /**
   * Obtenir le nombre total d'appuis pour un signalement
   * @param {number} reportId - ID du signalement
   * @returns {Promise<Object>} { count: number }
   */
  async getSupportCount(reportId) {
    const response = await api.get(`/reports/${reportId}/supports/count`);
    return response.data;
  },

  /**
   * Obtenir les signalements les plus appuyés
   * @param {number} limit - Nombre de résultats (optionnel)
   * @returns {Promise<Array>} Liste des signalements les plus appuyés
   */
  async getTopSupported(limit = 10) {
    const response = await api.get('/reports/top-supported', {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Obtenir les signalements appuyés par l'utilisateur connecté
   * @param {number} page - Numéro de page (optionnel)
   * @param {number} limit - Nombre par page (optionnel)
   * @returns {Promise<Object>} Liste paginée des signalements appuyés
   */
  async getMySupportedReports(page = 1, limit = 20) {
    const response = await api.get('/supports/my-supported', {
      params: { page, limit }
    });
    return response.data;
  }
};

export default supportService;
