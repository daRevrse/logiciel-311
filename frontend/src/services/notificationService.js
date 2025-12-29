import api from './api';

/**
 * Service de gestion des notifications
 */
const notificationService = {
  /**
   * Obtenir les préférences de notification de l'utilisateur
   * @returns {Promise<Object>} Préférences de notification
   */
  async getPreferences() {
    const response = await api.get('/notifications/preferences');
    return response.data;
  },

  /**
   * Mettre à jour les préférences de notification
   * @param {Object} preferences - Nouvelles préférences
   * @returns {Promise<Object>} Préférences mises à jour
   */
  async updatePreferences(preferences) {
    const response = await api.put('/notifications/preferences', preferences);
    return response.data;
  },

  /**
   * Obtenir l'historique des notifications
   * @param {Object} filters - Filtres optionnels
   * @returns {Promise<Object>} Liste paginée des notifications
   */
  async getHistory(filters = {}) {
    const params = new URLSearchParams();

    if (filters.type) params.append('type', filters.type);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get(`/notifications/history?${params.toString()}`);
    return response.data;
  },

  /**
   * Renvoyer une notification échouée
   * @param {number} notificationId - ID de la notification
   * @returns {Promise<Object>} Confirmation de renvoi
   */
  async resendNotification(notificationId) {
    const response = await api.post(`/notifications/${notificationId}/resend`);
    return response.data;
  },

  /**
   * Envoyer une notification de test (admin uniquement)
   * @param {string} email - Email de destination
   * @returns {Promise<Object>} Confirmation d'envoi
   */
  async sendTestNotification(email) {
    const response = await api.post('/notifications/test', { email });
    return response.data;
  },

  /**
   * Obtenir les statistiques des notifications (admin)
   * @param {string} startDate - Date de début (ISO format)
   * @param {string} endDate - Date de fin (ISO format)
   * @returns {Promise<Object>} Statistiques des notifications
   */
  async getStats(startDate, endDate) {
    const response = await api.get('/notifications/stats', {
      params: { startDate, endDate }
    });
    return response.data;
  }
};

export default notificationService;
