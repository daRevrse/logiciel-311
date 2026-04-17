const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middlewares/auth');
const { validateLicense } = require('../middlewares/license');
const { reportCreationLimiter, uploadLimiter } = require('../middlewares/rateLimiter');
const { logActivity } = require('../middlewares/requestLogger');
const { checkReportOwnership } = require('../middlewares/multiTenant');
const uploadService = require('../services/uploadService');

/**
 * Routes de gestion des signalements
 * Toutes les routes nécessitent authentification + licence valide
 */

// Appliquer auth + licence sur toutes les routes
// Appliquer la protection sur les routes spécifiques ci-dessous
const needsAuth = [authenticateToken, validateLicense];

// ============================================
// ROUTES CATÉGORIES & STATISTIQUES
// ============================================

/**
 * @route   GET /api/reports/public/municipalities
 * @desc    Récupérer les municipalités actives
 * @access  Public
 */
router.get('/public/municipalities',
  reportController.getPublicMunicipalities
);

/**
 * @route   GET /api/reports/nearby
 * @desc    Rechercher des signalements à proximité
 * @access  Public
 */
router.get('/nearby',
  reportController.getNearbyReports
);

/**
 * @route   GET /api/reports/categories
 * @desc    Récupérer les catégories d'une municipalité
 * @access  Public (si municipalityId fourni en query) ou Authentifié
 */
router.get('/categories',
  require('../middlewares/auth').optionalAuth,
  reportController.getCategories
);

/**
 * @route   GET /api/reports/statistics
 * @desc    Récupérer les statistiques des signalements
 * @access  Authentifié
 */
router.get('/statistics',
  ...needsAuth,
  reportController.getStatistics
);

// ============================================
// ROUTES MES SIGNALEMENTS
// ============================================

/**
 * @route   GET /api/reports/my-reports
 * @desc    Récupérer mes signalements
 * @access  Authentifié (citoyen)
 */
router.get('/my-reports',
  ...needsAuth,
  reportController.getMyReports
);

// ============================================
// ROUTES CRUD SIGNALEMENTS
// ============================================

/**
 * @route   POST /api/reports
 * @desc    Créer un nouveau signalement
 * @access  Authentifié (citoyen)
 */
router.post('/',
  require('../middlewares/auth').optionalAuth, // Utilisation d'authentification facultative
  reportCreationLimiter,
  reportController.validationRules.createReport,
  reportController.validate,
  logActivity('create_report', 'report'),
  reportController.createReport
);

/**
 * @route   GET /api/reports
 * @desc    Lister les signalements avec filtres
 * @access  Authentifié
 */
router.get('/',
  ...needsAuth,
  reportController.validationRules.listReports,
  reportController.validate,
  reportController.listReports
);

/**
 * @route   GET /api/reports/:id
 * @desc    Récupérer un signalement par ID
 * @access  Authentifié
 */
router.get('/:id',
  ...needsAuth,
  reportController.getReport
);

/**
 * @route   PUT /api/reports/:id
 * @desc    Mettre à jour un signalement
 * @access  Authentifié (créateur uniquement)
 */
router.put('/:id',
  ...needsAuth,
  reportController.validationRules.updateReport,
  reportController.validate,
  logActivity('update_report', 'report'),
  reportController.updateReport
);

/**
 * @route   DELETE /api/reports/:id
 * @desc    Supprimer un signalement (status=pending uniquement)
 * @access  Authentifié (créateur uniquement)
 */
router.delete('/:id',
  ...needsAuth,
  logActivity('delete_report', 'report'),
  reportController.deleteReport
);

// ============================================
// ROUTES PHOTOS
// ============================================

/**
 * @route   POST /api/reports/:reportId/photos
 * @desc    Upload une photo pour un signalement
 * @access  Authentifié (créateur uniquement)
 */
router.post('/:reportId/photos',
  ...needsAuth,
  uploadLimiter,
  checkReportOwnership,
  uploadService.single('photo'),
  logActivity('upload_photo', 'report_photo'),
  reportController.uploadPhoto
);

/**
 * @route   DELETE /api/reports/:reportId/photos/:photoId
 * @desc    Supprimer une photo
 * @access  Authentifié (créateur uniquement)
 */
router.delete('/:reportId/photos/:photoId',
  ...needsAuth,
  checkReportOwnership,
  logActivity('delete_photo', 'report_photo'),
  reportController.deletePhoto
);

module.exports = router;
