import api from './api';

/**
 * Public (non-authentifié) — endpoints mairie vitrine.
 */
const publicMunicipalityService = {
  /**
   * Récupère le payload complet de la page publique d'une municipalité
   * par son slug.
   * @param {string} slug
   * @returns {Promise<object>}
   */
  async getMunicipalityPublicPage(slug) {
    const response = await api.get(`/public/municipalities/${slug}`);
    return response.data;
  },

  /**
   * Recherche un signalement par son code de suivi (sans authentification).
   * @param {string} code
   */
  async trackReport(code) {
    const response = await api.get(`/public/reports/track/${encodeURIComponent(code)}`);
    return response.data;
  }
};

export default publicMunicipalityService;
