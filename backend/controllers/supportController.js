/**
 * Contrôleur des Appuis Citoyens
 * Gère les endpoints pour ajouter/retirer des appuis sur les signalements
 *
 * Endpoints :
 * - POST /api/reports/:id/support - Ajouter son appui
 * - DELETE /api/reports/:id/support - Retirer son appui
 * - GET /api/reports/:id/supports - Lister appuis (admin)
 * - GET /api/reports/:id/supports/stats - Stats appuis
 * - GET /api/reports/top-supported - Top signalements appuyés
 * - GET /api/supports/my-supported - Mes signalements appuyés
 */

const supportService = require('../services/supportService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Ajouter son appui à un signalement
 * POST /api/reports/:id/support
 *
 * Authentification : Requise (citoyen)
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.addSupport = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: errors.array()
      });
    }

    const reportId = parseInt(req.params.id);
    const citizenId = req.userId;
    const municipalityId = req.municipalityId;

    // Vérifier que l'utilisateur est un citoyen
    if (req.user.role !== 'citizen') {
      logger.warn(`Tentative d'appui par non-citoyen: user ${citizenId} (role: ${req.user.role})`);
      return res.status(403).json({
        success: false,
        message: 'Seuls les citoyens peuvent appuyer les signalements'
      });
    }

    const result = await supportService.addSupport(reportId, citizenId, municipalityId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(`✅ Appui ajouté: Citoyen ${citizenId} → Signalement ${reportId}`);

    res.status(201).json(result);

  } catch (error) {
    logger.error(`Erreur addSupport controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'ajout de l\'appui'
    });
  }
};

/**
 * Retirer son appui d'un signalement
 * DELETE /api/reports/:id/support
 *
 * Authentification : Requise (citoyen)
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.removeSupport = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: errors.array()
      });
    }

    const reportId = parseInt(req.params.id);
    const citizenId = req.userId;
    const municipalityId = req.municipalityId;

    // Vérifier que l'utilisateur est un citoyen
    if (req.user.role !== 'citizen') {
      logger.warn(`Tentative de retrait d'appui par non-citoyen: user ${citizenId} (role: ${req.user.role})`);
      return res.status(403).json({
        success: false,
        message: 'Seuls les citoyens peuvent retirer leur appui'
      });
    }

    const result = await supportService.removeSupport(reportId, citizenId, municipalityId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(`✅ Appui retiré: Citoyen ${citizenId} ✗ Signalement ${reportId}`);

    res.json(result);

  } catch (error) {
    logger.error(`Erreur removeSupport controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du retrait de l\'appui'
    });
  }
};

/**
 * Vérifier si l'utilisateur a appuyé un signalement
 * GET /api/reports/:id/support/check
 *
 * Authentification : Requise
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.checkSupport = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const citizenId = req.userId;

    const hasSupported = await supportService.hasSupported(reportId, citizenId);

    res.json({
      success: true,
      data: {
        hasSupported,
        reportId,
        citizenId
      }
    });

  } catch (error) {
    logger.error(`Erreur checkSupport controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la vérification'
    });
  }
};

/**
 * Lister les appuis d'un signalement
 * GET /api/reports/:id/supports
 *
 * Authentification : Requise (admin uniquement)
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.listSupports = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const municipalityId = req.municipalityId;

    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      logger.warn(`Tentative d'accès liste appuis par non-admin: user ${req.userId}`);
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 50, 100)
    };

    const result = await supportService.listSupports(reportId, municipalityId, options);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);

  } catch (error) {
    logger.error(`Erreur listSupports controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des appuis'
    });
  }
};

/**
 * Obtenir les statistiques d'appuis d'un signalement
 * GET /api/reports/:id/supports/stats
 *
 * Authentification : Requise
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.getSupportStats = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);

    const result = await supportService.getSupportStats(reportId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);

  } catch (error) {
    logger.error(`Erreur getSupportStats controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
};

/**
 * Obtenir les signalements les plus appuyés
 * GET /api/reports/top-supported
 *
 * Authentification : Requise
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.getTopSupportedReports = async (req, res) => {
  try {
    const municipalityId = req.municipalityId;

    const options = {
      limit: Math.min(parseInt(req.query.limit) || 10, 50),
      status: req.query.status || null
    };

    const result = await supportService.getTopSupportedReports(municipalityId, options);

    res.json(result);

  } catch (error) {
    logger.error(`Erreur getTopSupportedReports controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des signalements'
    });
  }
};

/**
 * Obtenir les signalements appuyés par le citoyen connecté
 * GET /api/supports/my-supported
 *
 * Authentification : Requise (citoyen)
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.getMySupportedReports = async (req, res) => {
  try {
    const citizenId = req.userId;
    const municipalityId = req.municipalityId;

    // Vérifier que l'utilisateur est un citoyen
    if (req.user.role !== 'citizen') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux citoyens'
      });
    }

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 20, 100)
    };

    const result = await supportService.getMySupportedReports(citizenId, municipalityId, options);

    res.json(result);

  } catch (error) {
    logger.error(`Erreur getMySupportedReports controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des signalements'
    });
  }
};

/**
 * Obtenir le nombre total d'appuis d'un signalement
 * GET /api/reports/:id/supports/count
 *
 * Authentification : Requise
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.getSupportCount = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);

    const count = await supportService.getSupportCount(reportId);

    res.json({
      success: true,
      data: {
        reportId,
        supportsCount: count
      }
    });

  } catch (error) {
    logger.error(`Erreur getSupportCount controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du comptage des appuis'
    });
  }
};
