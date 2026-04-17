/**
 * Routes des Appuis Citoyens
 * Endpoints pour gérer les appuis (supports) sur les signalements
 *
 * Toutes les routes nécessitent :
 * - Authentification JWT
 * - Licence municipalité valide
 * - Rate limiting
 */

const express = require('express');
const router = express.Router();
const { param, query } = require('express-validator');

// Middlewares
const { authenticateToken } = require('../middlewares/auth');
const { validateLicense, requireFeature } = require('../middlewares/license');
const { logActivity } = require('../middlewares/requestLogger');
const { supportLimiter } = require('../middlewares/rateLimiter');

// Contrôleur
const supportController = require('../controllers/supportController');

/**
 * Validation ID signalement
 */
const validateReportId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID signalement invalide')
];

/**
 * Validation pagination
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Numéro de page invalide'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite invalide (1-100)')
];

/**
 * Validation status
 */
const validateStatus = [
  query('status')
    .optional()
    .isIn(['pending', 'in_progress', 'resolved', 'rejected'])
    .withMessage('Status invalide')
];

// ============================================
// ROUTES CITOYENS - Gestion de ses appuis
// ============================================

/**
 * @route   POST /api/reports/:id/support
 * @desc    Ajouter son appui à un signalement
 * @access  Private (Citoyen uniquement)
 * @rate    10 appuis / heure
 */
router.post(
  '/reports/:id/support',
  authenticateToken,
  validateLicense,
  requireFeature('support'),
  supportLimiter,
  logActivity('add_support'),
  validateReportId,
  supportController.addSupport
);

/**
 * @route   DELETE /api/reports/:id/support
 * @desc    Retirer son appui d'un signalement
 * @access  Private (Citoyen uniquement)
 * @rate    10 retraits / heure
 */
router.delete(
  '/reports/:id/support',
  authenticateToken,
  validateLicense,
  requireFeature('support'),
  supportLimiter,
  logActivity('remove_support'),
  validateReportId,
  supportController.removeSupport
);

/**
 * @route   GET /api/reports/:id/support/check
 * @desc    Vérifier si l'utilisateur a appuyé ce signalement
 * @access  Private
 */
router.get(
  '/reports/:id/support/check',
  authenticateToken,
  validateLicense,
  validateReportId,
  supportController.checkSupport
);

/**
 * @route   GET /api/supports/my-supported
 * @desc    Obtenir les signalements que j'ai appuyés
 * @access  Private (Citoyen uniquement)
 */
router.get(
  '/supports/my-supported',
  authenticateToken,
  validateLicense,
  logActivity('view_my_supported'),
  validatePagination,
  supportController.getMySupportedReports
);

// ============================================
// ROUTES PUBLIQUES - Statistiques appuis
// ============================================

/**
 * @route   GET /api/reports/:id/supports/count
 * @desc    Obtenir le nombre total d'appuis d'un signalement
 * @access  Private
 */
router.get(
  '/reports/:id/supports/count',
  authenticateToken,
  validateLicense,
  validateReportId,
  supportController.getSupportCount
);

/**
 * @route   GET /api/reports/:id/supports/stats
 * @desc    Obtenir les statistiques d'appuis d'un signalement
 * @access  Private
 */
router.get(
  '/reports/:id/supports/stats',
  authenticateToken,
  validateLicense,
  validateReportId,
  supportController.getSupportStats
);

/**
 * @route   GET /api/reports/top-supported
 * @desc    Obtenir les signalements les plus appuyés
 * @access  Private
 */
router.get(
  '/reports/top-supported',
  authenticateToken,
  validateLicense,
  logActivity('view_top_supported'),
  [...validatePagination, ...validateStatus],
  supportController.getTopSupportedReports
);

// ============================================
// ROUTES ADMIN - Voir qui a appuyé
// ============================================

/**
 * @route   GET /api/reports/:id/supports
 * @desc    Lister tous les appuis d'un signalement avec détails citoyens
 * @access  Private (Admin uniquement)
 */
router.get(
  '/reports/:id/supports',
  authenticateToken,
  validateLicense,
  logActivity('view_report_supports'),
  [...validateReportId, ...validatePagination],
  supportController.listSupports
);

module.exports = router;
