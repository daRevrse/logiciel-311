import api from './api';

/**
 * Service d'authentification
 */
const authService = {
  /**
   * Connexion par empreinte digitale (device fingerprint)
   * @param {string} municipalityId - ID de la municipalité
   * @param {string} deviceFingerprint - Empreinte unique de l'appareil
   * @param {string} fullName - Nom complet du citoyen
   * @returns {Promise<Object>} Données d'authentification (user, token, isNewUser)
   */
  async loginByFingerprint(municipalityId, deviceFingerprint, fullName) {
    const response = await api.post('/auth/login/fingerprint', {
      municipalityId,
      deviceFingerprint,
      fullName
    });

    // Le backend retourne { success, message, data: { user, token, isNewUser } }
    const { data } = response.data;

    if (data && data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data || response.data;
  },

  /**
   * Demander un code de vérification par SMS
   * @param {string} municipalityId - ID de la municipalité
   * @param {string} phone - Numéro de téléphone
   * @param {string} fullName - Nom complet du citoyen
   * @returns {Promise<Object>} Confirmation de l'envoi du code
   */
  async requestSmsCode(municipalityId, phone, fullName) {
    const response = await api.post('/auth/request-code', {
      municipalityId,
      phone,
      fullName
    });

    return response.data;
  },

  /**
   * Vérifier le code SMS et se connecter
   * @param {string} municipalityId - ID de la municipalité
   * @param {string} phone - Numéro de téléphone
   * @param {string} code - Code de vérification
   * @returns {Promise<Object>} Données d'authentification (user, token)
   */
  async verifyCode(municipalityId, phone, code) {
    const response = await api.post('/auth/verify-code', {
      municipalityId,
      phone,
      code
    });

    // Le backend retourne { success, message, data: { user, token } }
    const { data } = response.data;

    if (data && data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data || response.data;
  },

  /**
   * Connexion administrateur
   * @param {string} email - Email de l'administrateur
   * @param {string} password - Mot de passe
   * @returns {Promise<Object>} Données d'authentification (user, token)
   */
  async loginAdmin(email, password, municipalitySlug = null) {
    const response = await api.post('/auth/admin/login', {
      email,
      password,
      ...(municipalitySlug ? { municipalitySlug } : {})
    });

    // Le backend retourne { success, message, data: { user, token } }
    const { data } = response.data;

    if (data && data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data || response.data;
  },

  /**
   * Déconnexion
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Obtenir l'utilisateur actuel depuis le localStorage
   * @returns {Object|null} Utilisateur actuel ou null
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Erreur parsing user:', error);
      return null;
    }
  },

  /**
   * Vérifier si l'utilisateur est connecté
   * @returns {boolean} True si connecté
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  /**
   * Vérifier si l'utilisateur est administrateur (admin ou super_admin)
   * @returns {boolean} True si admin ou super_admin
   */
  isAdmin() {
    const user = this.getCurrentUser();
    return user && (user.role === 'admin' || user.role === 'super_admin');
  },

  /**
   * Vérifier si l'utilisateur est super-administrateur
   * @returns {boolean} True si super_admin
   */
  isSuperAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'super_admin';
  },

  /**
   * Vérifier si l'utilisateur est un agent terrain
   * @returns {boolean} True si agent
   */
  isAgent() {
    const user = this.getCurrentUser();
    return user && user.role === 'agent';
  }
};

export default authService;
