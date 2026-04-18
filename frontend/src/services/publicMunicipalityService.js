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
};

export default publicMunicipalityService;
