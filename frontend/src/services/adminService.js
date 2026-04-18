import api from './api';

/**
 * Service d'administration (admin et superadmin)
 */
const adminService = {
  /**
   * Obtenir le tableau de bord avec statistiques
   * @param {Object} filters - Filtres optionnels (dateFrom, dateTo)
   * @returns {Promise<Object>} Statistiques du dashboard
   */
  async getGlobalStats() {
    const response = await api.get('/admin/global/stats');
    return response.data;
  },

  async getGlobalReports(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const response = await api.get(`/admin/global/reports${qs ? `?${qs}` : ''}`);
    return response.data;
  },

  async getDashboard(filters = {}) {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);

    const response = await api.get(`/admin/dashboard/stats?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtenir les statistiques détaillées
   * @returns {Promise<Object>} Statistiques détaillées
   */
  async getStatistics() {
    const response = await api.get('/admin/statistics');
    return response.data;
  },

  /**
   * Changer le statut d'un signalement
   * @param {number} reportId - ID du signalement
   * @param {string} newStatus - Nouveau statut
   * @param {string} comment - Commentaire optionnel
   * @returns {Promise<Object>} Signalement mis à jour
   */
  async changeStatus(reportId, newStatus, comment = '') {
    const response = await api.post(`/admin/reports/${reportId}/status`, {
      status: newStatus,
      comment
    });
    return response.data;
  },

  /**
   * Ajouter une note à un signalement
   * @param {number} reportId - ID du signalement
   * @param {string} note - Note à ajouter
   * @returns {Promise<Object>} Signalement mis à jour
   */
  async addNote(reportId, note) {
    const response = await api.post(`/admin/reports/${reportId}/note`, {
      note
    });
    return response.data;
  },

  /**
   * Assigner un signalement à un administrateur
   * @param {number} reportId - ID du signalement
   * @param {number} adminId - ID de l'administrateur
   * @returns {Promise<Object>} Signalement mis à jour
   */
  async assignReport(reportId, adminId) {
    const response = await api.post(`/admin/reports/${reportId}/assign`, {
      assignedAdminId: adminId
    });
    return response.data;
  },

  /**
   * Obtenir l'historique d'un signalement
   * @param {number} reportId - ID du signalement
   * @returns {Promise<Array>} Historique du signalement
   */
  async getReportHistory(reportId) {
    const response = await api.get(`/admin/reports/${reportId}/history`);
    return response.data;
  },

  /**
   * Lister tous les administrateurs de la municipalité
   * @returns {Promise<Array>} Liste des administrateurs
   */
  async listAdmins() {
    const response = await api.get('/admin/admins');
    return response.data;
  },

  /**
   * Exporter les signalements en CSV
   * @param {Object} filters - Filtres de recherche
   * @returns {Promise<Blob>} Fichier CSV
   */
  async exportReports(filters = {}) {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/admin/reports/export?${params.toString()}`, {
      responseType: 'blob'
    });

    return response.data;
  },

  /**
   * Obtenir les signalements assignés à l'administrateur connecté
   * @param {Object} filters - Filtres optionnels
   * @returns {Promise<Object>} Liste paginée des signalements assignés
   */
  async getMyAssignedReports(filters = {}) {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);

    const response = await api.get(`/admin/my-assigned?${params.toString()}`);
    return response.data;
  },

  /**
   * Supprimer un signalement (admin uniquement, soft delete)
   * @param {number} reportId - ID du signalement
   * @param {string} reason - Raison de la suppression
   * @returns {Promise<Object>} Confirmation de suppression
   */
  async deleteReport(reportId, reason) {
    const response = await api.delete(`/admin/reports/${reportId}`, {
      data: { reason }
    });
    return response.data;
  },

  // ============================================
  // GESTION DES CATÉGORIES
  // ============================================

  /**
   * Obtenir toutes les catégories
   * @returns {Promise<Array>} Liste des catégories
   */
  async getCategories() {
    const response = await api.get('/admin/categories');
    return response.data;
  },

  /**
   * Créer une nouvelle catégorie
   * @param {Object} categoryData - Données de la catégorie
   * @returns {Promise<Object>} Catégorie créée
   */
  async createCategory(categoryData) {
    const response = await api.post('/admin/categories', categoryData);
    return response.data;
  },

  /**
   * Modifier une catégorie
   * @param {number} categoryId - ID de la catégorie
   * @param {Object} categoryData - Données à modifier
   * @returns {Promise<Object>} Catégorie modifiée
   */
  async updateCategory(categoryId, categoryData) {
    const response = await api.put(`/admin/categories/${categoryId}`, categoryData);
    return response.data;
  },

  /**
   * Supprimer une catégorie (désactivation)
   * @param {number} categoryId - ID de la catégorie
   * @returns {Promise<Object>} Confirmation de suppression
   */
  async deleteCategory(categoryId) {
    const response = await api.delete(`/admin/categories/${categoryId}`);
    return response.data;
  },

  // ============================================
  // GESTION DES UTILISATEURS
  // ============================================

  /**
   * Obtenir tous les utilisateurs
   * @returns {Promise<Array>} Liste des utilisateurs
   */
  async getUsers() {
    const response = await api.get('/admin/users');
    return response.data;
  },

  /**
   * Créer un nouvel utilisateur admin
   * @param {Object} userData - Données de l'utilisateur
   * @returns {Promise<Object>} Utilisateur créé
   */
  async createUser(userData) {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  /**
   * Modifier un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @param {Object} userData - Données à modifier
   * @returns {Promise<Object>} Utilisateur modifié
   */
  async updateUser(userId, userData) {
    const response = await api.put(`/admin/users/${userId}`, userData);
    return response.data;
  },

  /**
   * Désactiver un utilisateur
   * @param {number} userId - ID de l'utilisateur
   * @returns {Promise<Object>} Confirmation de suppression
   */
  async deleteUser(userId) {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // ============================================
  // GESTION DES MUNICIPALITÉS (SUPER ADMIN)
  // ============================================

  /**
   * Obtenir toutes les municipalités
   * @returns {Promise<Array>} Liste des municipalités
   */
  async getMunicipalities() {
    const response = await api.get('/admin/municipalities');
    return response.data;
  },

  /**
   * Créer une nouvelle municipalité
   * @param {Object} municipalityData - Données de la municipalité
   * @returns {Promise<Object>} Municipalité créée
   */
  async createMunicipality(municipalityData) {
    const response = await api.post('/admin/municipalities', municipalityData);
    return response.data;
  },

  /**
   * Modifier une municipalité
   * @param {number} municipalityId - ID de la municipalité
   * @param {Object} municipalityData - Données à modifier
   * @returns {Promise<Object>} Municipalité modifiée
   */
  async updateMunicipality(municipalityId, municipalityData) {
    const response = await api.put(`/admin/municipalities/${municipalityId}`, municipalityData);
    return response.data;
  },

  /**
   * Désactiver une municipalité
   * @param {number} municipalityId - ID de la municipalité
   * @returns {Promise<Object>} Confirmation de désactivation
   */
  async deleteMunicipality(municipalityId) {
    const response = await api.delete(`/admin/municipalities/${municipalityId}`);
    return response.data;
  },

  /**
   * Créer/renouveler la licence d'une municipalité
   * @param {number} municipalityId - ID de la municipalité
   * @param {Object} licenseData - Données de la licence
   * @returns {Promise<Object>} Licence créée
   */
  async createMunicipalityLicense(municipalityId, licenseData) {
    const response = await api.post(`/admin/municipalities/${municipalityId}/license`, licenseData);
    return response.data;
  },

  // ============================================
  // CATALOGUE DES MODULES
  // ============================================

  async getModulesCatalog() {
    const response = await api.get('/admin/modules/catalog');
    return response.data;
  },

  // ============================================
  // GESTION DES LICENCES (SUPER ADMIN)
  // ============================================

  async listLicenses(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.q) params.append('q', filters.q);
    const response = await api.get(`/admin/licenses?${params.toString()}`);
    return response.data;
  },

  async getLicense(id) {
    const response = await api.get(`/admin/licenses/${id}`);
    return response.data;
  },

  async updateLicenseModules(id, modules) {
    const response = await api.patch(`/admin/licenses/${id}/modules`, { modules });
    return response.data;
  },

  async renewLicense(id, years = 1) {
    const response = await api.post(`/admin/licenses/${id}/renew`, { years });
    return response.data;
  },

  async deactivateLicense(id) {
    const response = await api.patch(`/admin/licenses/${id}/deactivate`);
    return response.data;
  },

  async activateLicense(id) {
    const response = await api.patch(`/admin/licenses/${id}/activate`);
    return response.data;
  },

  // ============================================
  // GESTION DES SUPER ADMINS
  // ============================================

  async listSuperAdmins() {
    const response = await api.get('/admin/super-admins');
    return response.data;
  },

  async createSuperAdmin(data) {
    const response = await api.post('/admin/super-admins', data);
    return response.data;
  },

  // ============================================
  // PARAMÈTRES DE LA MUNICIPALITÉ (ADMIN)
  // ============================================

  async getMunicipalitySettings() {
    const response = await api.get('/admin/municipality/settings');
    return response.data;
  },

  async updateMunicipalitySettings(payload) {
    const response = await api.patch('/admin/municipality/settings', payload);
    return response.data;
  },

  async uploadMunicipalityLogo(file) {
    const formData = new FormData();
    formData.append('logo', file);
    const response = await api.post('/admin/municipality/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  async uploadMunicipalityBanner(file) {
    const formData = new FormData();
    formData.append('banner', file);
    const response = await api.post('/admin/municipality/upload-banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

export default adminService;
