const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const supportController = require('../controllers/supportController');
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
router.use(authenticateToken);
router.use(validateLicense);

// ============================================
// ROUTES CATÉGORIES & STATISTIQUES
// ============================================

/**
 * @route   GET /api/reports/categories
 * @desc    Récupérer les catégories de la municipalité
 * @access  Authentifié
 */
router.get('/categories',
  reportController.getCategories
);

/**
 * @route   GET /api/reports/statistics
 * @desc    Récupérer les statistiques des signalements
 * @access  Authentifié
 */
router.get('/statistics',
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
  reportController.validationRules.listReports,
  reportController.validate,
  reportController.listReports
);

/**
 * @route   GET /api/reports/top-supported
 * @desc    Obtenir les signalements les plus appuyés
 * @access  Authentifié
 */
router.get('/top-supported',
  logActivity('view_top_supported'),
  supportController.getTopSupportedReports
);

/**
 * @route   GET /api/reports/:id
 * @desc    Récupérer un signalement par ID
 * @access  Authentifié
 */
router.get('/:id',
  reportController.getReport
);

/**
 * @route   PUT /api/reports/:id
 * @desc    Mettre à jour un signalement
 * @access  Authentifié (créateur uniquement)
 */
router.put('/:id',
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
  uploadLimiter,
  checkReportOwnership,
  uploadService.single('photo'),
  logActivity('upload_photo', 'report_photo'),
  reportController.uploadPhoto
);

/**
 * @route   DELETE /api/reports/photos/:photoId
 * @desc    Supprimer une photo
 * @access  Authentifié (créateur uniquement)
 */
router.delete('/photos/:photoId',
  logActivity('delete_photo', 'report_photo'),
  reportController.deletePhoto
);

module.exports = router;
