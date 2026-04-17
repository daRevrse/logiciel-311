const { Op } = require('sequelize');
const { License, Municipality } = require('../models');
const logger = require('../utils/logger');

/**
 * Middleware de vérification de licence
 * PRIORITÉ #1 - Vérifier que la municipalité a une licence valide
 */
const validateLicense = async (req, res, next) => {
  try {
    // Les super admins traversent la vérification de licence (pas de municipalité)
    if (req.user?.isSuperAdmin?.()) {
      return next();
    }

    // Récupérer le municipality_id depuis le token (injecté par auth middleware)
    const municipalityId = req.municipalityId;

    if (!municipalityId) {
      return res.status(400).json({
        success: false,
        message: 'ID de municipalité manquant'
      });
    }

    // Debugging municipalityId
    logger.info(`[DEBUG LICENSE] Verification pour municipalityId: ${municipalityId} (Type: ${typeof municipalityId})`);

    // Charger la municipalité avec sa licence
    const municipality = await Municipality.findByPk(municipalityId, {
      include: [{
        model: License,
        as: 'license',
        required: false
      }]
    });

    if (!municipality) {
      logger.warn(`Municipalité ${municipalityId} non trouvée`);
      return res.status(404).json({
        success: false,
        message: 'Municipalité non trouvée'
      });
    }

    const license = municipality.license;

    // Vérifier que la licence existe
    if (!license) {
      logger.error(`Licence manquante pour municipalité ${municipalityId}`);
      return res.status(403).json({
        success: false,
        message: 'Aucune licence associée à cette municipalité'
      });
    }

    // Vérifier que la licence est active
    if (!license.is_active) {
      logger.warn(`Licence ${license.license_key} désactivée`);
      return res.status(403).json({
        success: false,
        message: 'Licence désactivée. Veuillez contacter le support.'
      });
    }

    // Vérifier que la licence n'est pas expirée
    if (license.isExpired()) {
      logger.warn(`Licence ${license.license_key} expirée le ${license.expires_at}`);
      return res.status(403).json({
        success: false,
        message: `Licence expirée le ${new Date(license.expires_at).toLocaleDateString('fr-FR')}`,
        expiredAt: license.expires_at
      });
    }

    // Avertissement si la licence expire bientôt (< 30 jours)
    const daysRemaining = license.daysRemaining();
    if (daysRemaining > 0 && daysRemaining <= 30) {
      logger.info(`Licence ${license.license_key} expire dans ${daysRemaining} jours`);
      // Ajouter un header d'avertissement
      res.set('X-License-Warning', `Votre licence expire dans ${daysRemaining} jours`);
    }

    // Attacher la licence et la municipalité à la requête
    req.license = license;
    req.municipality = municipality;

    next();
  } catch (error) {
    logger.error('Erreur validation licence:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification de la licence'
    });
  }
};

/**
 * Middleware pour vérifier une fonctionnalité spécifique de la licence
 * @param {string} feature - Nom de la fonctionnalité à vérifier
 */
const requireFeature = (feature) => {
  return (req, res, next) => {
    // Les super admins ont accès à toutes les fonctionnalités
    if (req.user?.isSuperAdmin?.()) {
      return next();
    }

    const license = req.license;

    if (!license) {
      return res.status(403).json({
        success: false,
        message: 'Licence non vérifiée'
      });
    }

    // Vérifier si la fonctionnalité est activée
    let features = license.features || {};
    
    // Au cas où features serait une chaîne JSON (selon le driver/seeder)
    if (typeof features === 'string') {
      try {
        features = JSON.parse(features);
      } catch (e) {
        logger.error(`Erreur parsing features pour licence ${license.license_key}:`, e);
        features = {};
      }
    }

    const isEnabled = features[feature];

    if (!isEnabled) {
      logger.warn(`Fonctionnalité '${feature}' non activée pour licence ${license.license_key}. Features dispos: ${JSON.stringify(features)}`);
      return res.status(403).json({
        success: false,
        message: `La fonctionnalité '${feature}' n'est pas activée pour votre licence`
      });
    }

    next();
  };
};

/**
 * Middleware pour vérifier les limites d'utilisateurs
 */
const checkUserLimit = async (req, res, next) => {
  try {
    const license = req.license;
    const municipalityId = req.municipalityId;

    if (!license) {
      return res.status(403).json({
        success: false,
        message: 'Licence non vérifiée'
      });
    }

    // Compter les utilisateurs actifs
    const { User } = require('../models');
    const activeUsers = await User.count({
      where: {
        municipality_id: municipalityId,
        is_active: true
      }
    });

    // Vérifier la limite
    if (activeUsers >= license.max_users) {
      logger.warn(`Limite utilisateurs atteinte pour municipalité ${municipalityId} (${activeUsers}/${license.max_users})`);
      return res.status(403).json({
        success: false,
        message: `Limite d'utilisateurs atteinte (${license.max_users} max)`,
        currentUsers: activeUsers,
        maxUsers: license.max_users
      });
    }

    next();
  } catch (error) {
    logger.error('Erreur vérification limite utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des limites'
    });
  }
};

/**
 * Middleware pour vérifier les limites d'administrateurs
 */
const checkAdminLimit = async (req, res, next) => {
  try {
    const license = req.license;
    const municipalityId = req.municipalityId;

    if (!license) {
      return res.status(403).json({
        success: false,
        message: 'Licence non vérifiée'
      });
    }

    // Compter les administrateurs actifs
    const { User } = require('../models');
    const activeAdmins = await User.count({
      where: {
        municipality_id: municipalityId,
        role: { [Op.in]: ['admin', 'super_admin'] },
        is_active: true
      }
    });

    // Vérifier la limite
    if (activeAdmins >= license.max_admins) {
      logger.warn(`Limite administrateurs atteinte pour municipalité ${municipalityId} (${activeAdmins}/${license.max_admins})`);
      return res.status(403).json({
        success: false,
        message: `Limite d'administrateurs atteinte (${license.max_admins} max)`,
        currentAdmins: activeAdmins,
        maxAdmins: license.max_admins
      });
    }

    next();
  } catch (error) {
    logger.error('Erreur vérification limite administrateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des limites'
    });
  }
};

module.exports = {
  validateLicense,
  requireFeature,
  checkUserLimit,
  checkAdminLimit
};
