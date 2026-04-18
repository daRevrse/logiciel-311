import api from './api';

/**
 * Service agent - Interventions de l'agent connecté.
 */
const agentService = {
  /**
   * Récupère la liste des interventions de l'agent connecté.
   * @param {Object} [params]
   * @param {string} [params.status] - Filtre optionnel par statut.
   * @returns {Promise<Object>} { success, data: Intervention[] }
   */
  async getMyInterventions(params = {}) {
    const response = await api.get('/agent/interventions', { params });
    return response.data;
  },

  /**
   * Met à jour une intervention (statut et/ou notes).
   * @param {number} id
   * @param {{ status?: string, notes?: string }} payload
   */
  async updateInterventionStatus(id, payload) {
    const response = await api.patch(`/agent/interventions/${id}`, payload);
    return response.data;
  },

  /**
   * Récupère le détail d'une intervention.
   * @param {number|string} id
   */
  async getMyIntervention(id) {
    const response = await api.get(`/agent/interventions/${id}`);
    return response.data;
  },

  /**
   * Upload une photo liée au rapport d'une intervention.
   * @param {number|string} id
   * @param {File} file
   */
  async uploadInterventionPhoto(id, file) {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await api.post(
      `/agent/interventions/${id}/photos`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }
};

export default agentService;
