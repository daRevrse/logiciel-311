const logger = require('../utils/logger');

/**
 * Middleware Multi-Tenant
 * Filtre automatiquement toutes les requêtes par municipality_id
 * pour garantir l'isolation totale des données
 */

/**
 * Ajoute automatiquement le municipality_id aux requêtes de création
 */
const injectMunicipalityId = (req, res, next) => {
  const municipalityId = req.municipalityId;

  if (!municipalityId) {
    logger.warn('Tentative de requête sans municipality_id');
    return res.status(400).json({
      success: false,
      message: 'ID de municipalité manquant'
    });
  }

  // Ajouter automatiquement le municipality_id au body
  if (req.body && typeof req.body === 'object') {
    req.body.municipality_id = municipalityId;
  }

  // Ajouter aux query params pour les recherches
  if (req.query && typeof req.query === 'object') {
    req.query.municipality_id = municipalityId;
  }

  next();
};

/**
 * Vérifie qu'une ressource appartient bien à la municipalité de l'utilisateur
 * @param {string} resourceModel - Nom du modèle (ex: 'Report', 'Category')
 * @param {string} paramName - Nom du paramètre d'URL (ex: 'id', 'reportId')
 */
const checkResourceOwnership = (resourceModel, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];
      const municipalityId = req.municipalityId;

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: `Paramètre ${paramName} manquant`
        });
      }

      // Charger le modèle dynamiquement
      const Model = require('../models')[resourceModel];

      if (!Model) {
        logger.error(`Modèle ${resourceModel} non trouvé`);
        return res.status(500).json({
          success: false,
          message: 'Erreur de configuration'
        });
      }

      // Chercher la ressource
      const resource = await Model.findByPk(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${resourceModel} non trouvé(e)`
        });
      }

      // Vérifier que la ressource appartient à la municipalité
      if (resource.municipality_id !== municipalityId) {
        logger.warn(`Tentative d'accès cross-municipality: User ${req.userId} -> ${resourceModel} ${resourceId}`);
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cette ressource'
        });
      }

      // Attacher la ressource à la requête
      req.resource = resource;

      next();
    } catch (error) {
      logger.error('Erreur vérification ownership:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification des droits'
      });
    }
  };
};

/**
 * Vérifie qu'un signalement appartient à la municipalité
 * Cas spécial car souvent utilisé
 */
const checkReportOwnership = checkResourceOwnership('Report', 'reportId');

/**
 * Vérifie qu'une catégorie appartient à la municipalité
 */
const checkCategoryOwnership = checkResourceOwnership('Category', 'categoryId');

/**
 * Vérifie qu'un utilisateur appartient à la municipalité
 */
const checkUserOwnership = checkResourceOwnership('User', 'userId');

/**
 * Filtre les résultats de requêtes pour ne retourner que ceux de la municipalité
 * Utile pour les listes
 */
const filterByMunicipality = (req, res, next) => {
  const municipalityId = req.municipalityId;

  // Créer un filtre par défaut
  req.municipalityFilter = {
    municipality_id: municipalityId
  };

  next();
};

/**
 * Middleware pour logger les accès cross-tenant (audit de sécurité)
 */
const logCrossTenantAttempts = (req, res, next) => {
  const original = res.json;

  res.json = function(data) {
    // Si erreur 403, logger comme tentative cross-tenant
    if (res.statusCode === 403 && data.message?.includes('Accès non autorisé')) {
      logger.warn('Tentative d\'accès cross-tenant détectée', {
        userId: req.userId,
        municipalityId: req.municipalityId,
        path: req.path,
        method: req.method,
        ip: req.ip
      });
    }

    original.call(this, data);
  };

  next();
};

module.exports = {
  injectMunicipalityId,
  checkResourceOwnership,
  checkReportOwnership,
  checkCategoryOwnership,
  checkUserOwnership,
  filterByMunicipality,
  logCrossTenantAttempts
};
