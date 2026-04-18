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
  }
};

export default agentService;
