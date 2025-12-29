const express = require('express');
const router = express.Router();
const licenseController = require('../controllers/licenseController');
const { authenticateToken, requireSuperAdmin } = require('../middlewares/auth');
const { logActivity } = require('../middlewares/requestLogger');

/**
 * Routes de gestion des licences
 * PRIORITÉ #1 - Système critique
 */

// ============================================
// ROUTES PUBLIQUES (sans authentification)
// ============================================

/**
 * @route   POST /api/licenses/validate
 * @desc    Valide une clé de licence
 * @access  Public
 */
router.post('/validate', licenseController.validateLicense);

/**
 * @route   POST /api/licenses/activate
 * @desc    Active une licence pour une municipalité
 * @access  Public (première installation)
 */
router.post('/activate',
  logActivity('activate_license', 'municipality'),
  licenseController.activateLicense
);

// ============================================
// ROUTES PROTÉGÉES (super administrateurs uniquement)
// ============================================

/**
 * @route   POST /api/licenses/generate
 * @desc    Génère une nouvelle licence
 * @access  Super Admin
 */
router.post('/generate',
  authenticateToken,
  requireSuperAdmin,
  logActivity('generate_license', 'license'),
  licenseController.generateLicense
);

/**
 * @route   GET /api/licenses
 * @desc    Liste toutes les licences
 * @access  Super Admin
 */
router.get('/',
  authenticateToken,
  requireSuperAdmin,
  licenseController.getAllLicenses
);

/**
 * @route   GET /api/licenses/expiring
 * @desc    Récupère les licences qui expirent bientôt
 * @access  Super Admin
 */
router.get('/expiring',
  authenticateToken,
  requireSuperAdmin,
  licenseController.getExpiringLicenses
);

/**
 * @route   GET /api/licenses/:id
 * @desc    Récupère les détails d'une licence
 * @access  Super Admin
 */
router.get('/:id',
  authenticateToken,
  requireSuperAdmin,
  licenseController.getLicenseById
);

/**
 * @route   PUT /api/licenses/:id/renew
 * @desc    Renouvelle une licence
 * @access  Super Admin
 */
router.put('/:id/renew',
  authenticateToken,
  requireSuperAdmin,
  logActivity('renew_license', 'license'),
  licenseController.renewLicense
);

/**
 * @route   PUT /api/licenses/:id/deactivate
 * @desc    Désactive une licence
 * @access  Super Admin
 */
router.put('/:id/deactivate',
  authenticateToken,
  requireSuperAdmin,
  logActivity('deactivate_license', 'license'),
  licenseController.deactivateLicense
);

/**
 * @route   PUT /api/licenses/:id/features
 * @desc    Met à jour les fonctionnalités d'une licence
 * @access  Super Admin
 */
router.put('/:id/features',
  authenticateToken,
  requireSuperAdmin,
  logActivity('update_license_features', 'license'),
  licenseController.updateFeatures
);

module.exports = router;
