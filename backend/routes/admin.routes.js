/**
 * Routes Admin
 * Endpoints réservés aux administrateurs
 *
 * Toutes les routes nécessitent :
 * - Authentification JWT
 * - Rôle admin ou super_admin
 * - Licence municipalité valide
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// Middlewares
const { authenticateToken, requireAdmin } = require('../middlewares/auth');
const { validateLicense, requireFeature } = require('../middlewares/license');
const { logActivity } = require('../middlewares/requestLogger');

// Contrôleurs
const adminController = require('../controllers/adminController');
const licenseAdminController = require('../controllers/licenseAdminController');
const superAdminController = require('../controllers/superAdminController');

/**
 * Validation ID signalement
 */
const validateReportId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID signalement invalide')
];

/**
 * Validation changement statut
 */
const validateStatusChange = [
  body('status')
    .isIn(['pending', 'in_progress', 'resolved', 'rejected'])
    .withMessage('Statut invalide'),
  body('comment')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('Commentaire trop long (max 1000 caractères)')
];

/**
 * Validation note admin
 */
const validateNote = [
  body('note')
    .notEmpty()
    .withMessage('Note requise')
    .isString()
    .isLength({ min: 5, max: 2000 })
    .withMessage('Note entre 5 et 2000 caractères')
];

/**
 * Validation assignation
 */
const validateAssignment = [
  body('adminId')
    .isInt({ min: 1 })
    .withMessage('ID admin invalide')
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
 * Validation dates
 */
const validateDates = [
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('Format date invalide (dateFrom)'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('Format date invalide (dateTo)')
];

// ============================================
// ROUTES GESTION SIGNALEMENTS
// ============================================

/**
 * @route   PUT /api/admin/reports/:id/status
 * @desc    Changer le statut d'un signalement
 * @access  Private (Admin uniquement)
 */
router.put(
  '/reports/:id/status',
  authenticateToken,
  requireAdmin,
  validateLicense,
  logActivity('change_report_status'),
  [...validateReportId, ...validateStatusChange],
  adminController.changeStatus
);

/**
 * @route   POST /api/admin/reports/:id/notes
 * @desc    Ajouter une note interne sur un signalement
 * @access  Private (Admin uniquement)
 */
router.post(
  '/reports/:id/notes',
  authenticateToken,
  requireAdmin,
  validateLicense,
  logActivity('add_admin_note'),
  [...validateReportId, ...validateNote],
  adminController.addNote
);

/**
 * @route   GET /api/admin/reports/:id/history
 * @desc    Obtenir l'historique complet d'un signalement
 * @access  Private (Admin uniquement)
 */
router.get(
  '/reports/:id/history',
  authenticateToken,
  requireAdmin,
  validateLicense,
  validateReportId,
  adminController.getHistory
);

/**
 * @route   POST /api/admin/reports/:id/assign
 * @desc    Assigner un signalement à un admin
 * @access  Private (Admin uniquement)
 */
router.post(
  '/reports/:id/assign',
  authenticateToken,
  requireAdmin,
  validateLicense,
  logActivity('assign_report'),
  [...validateReportId, ...validateAssignment],
  adminController.assignReport
);

/**
 * @route   DELETE /api/admin/reports/:id/assign
 * @desc    Retirer l'assignation d'un signalement
 * @access  Private (Admin uniquement)
 */
router.delete(
  '/reports/:id/assign',
  authenticateToken,
  requireAdmin,
  validateLicense,
  logActivity('unassign_report'),
  validateReportId,
  adminController.unassignReport
);

/**
 * @route   GET /api/admin/reports/assigned
 * @desc    Obtenir les signalements assignés à l'admin connecté
 * @access  Private (Admin uniquement)
 */
router.get(
  '/reports/assigned',
  authenticateToken,
  requireAdmin,
  validateLicense,
  logActivity('view_assigned_reports'),
  validatePagination,
  adminController.getMyAssignedReports
);

// ============================================
// ROUTES DASHBOARD & STATISTIQUES
// ============================================

/**
 * @route   GET /api/admin/dashboard/stats
 * @desc    Obtenir les statistiques du dashboard admin
 * @access  Private (Admin uniquement)
 */
router.get(
  '/dashboard/stats',
  authenticateToken,
  requireAdmin,
  validateLicense,
  requireFeature('statistics'),
  logActivity('view_dashboard_stats'),
  validateDates,
  adminController.getDashboardStats
);

// ============================================
// ROUTES UTILISATEURS
// ============================================

/**
 * @route   GET /api/admin/users/admins
 * @desc    Obtenir la liste des admins de la municipalité
 * @access  Private (Admin uniquement)
 */
router.get(
  '/users/admins',
  authenticateToken,
  requireAdmin,
  validateLicense,
  adminController.getMunicipalityAdmins
);

// ============================================
// ROUTES GESTION DES CATÉGORIES
// ============================================

/**
 * Validation catégorie
 */
const validateCategory = [
  body('name')
    .notEmpty()
    .withMessage('Nom requis')
    .isLength({ min: 3, max: 100 })
    .withMessage('Nom entre 3 et 100 caractères'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description max 500 caractères'),
  body('icon')
    .optional()
    .isString()
    .withMessage('Icône invalide'),
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Couleur invalide (format #RRGGBB)'),
  body('active')
    .optional()
    .isBoolean()
    .withMessage('Active doit être un booléen')
];

/**
 * @route   GET /api/admin/categories
 * @desc    Obtenir toutes les catégories
 * @access  Private (Admin uniquement)
 */
router.get(
  '/categories',
  authenticateToken,
  requireAdmin,
  validateLicense,
  adminController.getCategories
);

/**
 * @route   POST /api/admin/categories
 * @desc    Créer une nouvelle catégorie
 * @access  Private (Admin uniquement)
 */
router.post(
  '/categories',
  authenticateToken,
  requireAdmin,
  validateLicense,
  logActivity('create_category'),
  validateCategory,
  adminController.createCategory
);

/**
 * @route   PUT /api/admin/categories/:id
 * @desc    Modifier une catégorie
 * @access  Private (Admin uniquement)
 */
router.put(
  '/categories/:id',
  authenticateToken,
  requireAdmin,
  validateLicense,
  logActivity('update_category'),
  [param('id').isInt({ min: 1 }).withMessage('ID invalide'), ...validateCategory],
  adminController.updateCategory
);

/**
 * @route   DELETE /api/admin/categories/:id
 * @desc    Désactiver une catégorie
 * @access  Private (Admin uniquement)
 */
router.delete(
  '/categories/:id',
  authenticateToken,
  requireAdmin,
  validateLicense,
  logActivity('delete_category'),
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  adminController.deleteCategory
);

// ============================================
// ROUTES GESTION DES UTILISATEURS
// ============================================

/**
 * Validation utilisateur
 */
const validateUser = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email invalide'),
  body('phone')
    .notEmpty()
    .withMessage('Téléphone requis')
    .matches(/^\+?228[0-9]{8}$/)
    .withMessage('Numéro togolais invalide (+228XXXXXXXX)'),
  body('full_name')
    .notEmpty()
    .withMessage('Nom complet requis')
    .isLength({ min: 3, max: 100 })
    .withMessage('Nom entre 3 et 100 caractères'),
  body('role')
    .optional()
    .isIn(['citizen', 'admin', 'super_admin'])
    .withMessage('Rôle invalide')
];

/**
 * @route   GET /api/admin/users
 * @desc    Obtenir tous les utilisateurs
 * @access  Private (Admin uniquement)
 */
router.get(
  '/users',
  authenticateToken,
  requireAdmin,
  validateLicense,
  adminController.getUsers
);

/**
 * @route   POST /api/admin/users
 * @desc    Créer un nouvel utilisateur admin
 * @access  Private (Admin uniquement)
 */
router.post(
  '/users',
  authenticateToken,
  requireAdmin,
  validateLicense,
  logActivity('create_user'),
  validateUser,
  adminController.createUser
);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Modifier un utilisateur
 * @access  Private (Admin uniquement)
 */
router.put(
  '/users/:id',
  authenticateToken,
  requireAdmin,
  validateLicense,
  logActivity('update_user'),
  [
    param('id').isInt({ min: 1 }).withMessage('ID invalide'),
    body('email').optional().isEmail().withMessage('Email invalide'),
    body('full_name').optional().isLength({ min: 3, max: 100 }).withMessage('Nom entre 3 et 100 caractères'),
    body('role').optional().isIn(['citizen', 'admin', 'super_admin']).withMessage('Rôle invalide'),
    body('is_active').optional().isBoolean().withMessage('is_active doit être un booléen')
  ],
  adminController.updateUser
);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Désactiver un utilisateur
 * @access  Private (Admin uniquement)
 */
router.delete(
  '/users/:id',
  authenticateToken,
  requireAdmin,
  validateLicense,
  logActivity('delete_user'),
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  adminController.deleteUser
);

// ============================================
// ROUTES SETTINGS MUNICIPALITÉ (ADMIN SCOPE)
// ============================================

const { logoUpload, bannerUpload, handleMulterErrors } = require('../middlewares/uploadMunicipalityImage');

/**
 * Guard : les routes de settings municipalité (scope admin) requièrent un
 * municipalityId. Un super_admin sans rattachement doit passer par les
 * routes /municipalities/:id dédiées.
 */
function requireMunicipalityScope(req, res, next) {
  if (!req.municipalityId) {
    return res.status(400).json({
      success: false,
      message: 'Super-admins doivent utiliser les routes /municipalities/:id'
    });
  }
  next();
}

/**
 * Validation des settings municipalité (tous champs optionnels en PATCH).
 */
const validateMunicipalitySettings = [
  body('primary_color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('primary_color invalide (format #RRGGBB)'),
  body('secondary_color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('secondary_color invalide (format #RRGGBB)'),
  body('display_name').optional().isString().isLength({ max: 150 }).withMessage('display_name max 150 caractères'),
  body('public_description').optional().isString().isLength({ max: 2000 }).withMessage('public_description max 2000 caractères'),
  body('address').optional().isString().isLength({ max: 255 }).withMessage('address max 255 caractères'),
  body('contact_phone').optional().isString().isLength({ max: 30 }).withMessage('contact_phone invalide'),
  body('contact_email').optional().isEmail().withMessage('contact_email invalide'),
  body('public_hours').optional().isObject().withMessage('public_hours doit être un objet'),
  body('priority_support_threshold').optional().isInt({ min: 1 }).withMessage('priority_support_threshold doit être >= 1')
];

/**
 * @route   GET /api/admin/municipality/settings
 * @desc    Récupérer les settings (branding/page publique) de la municipalité de l'admin
 * @access  Private (Admin)
 */
router.get(
  '/municipality/settings',
  authenticateToken,
  requireAdmin,
  requireMunicipalityScope,
  validateLicense,
  adminController.getMunicipalitySettings
);

/**
 * @route   PATCH /api/admin/municipality/settings
 * @desc    Mettre à jour les settings branding/page publique
 * @access  Private (Admin)
 */
router.patch(
  '/municipality/settings',
  authenticateToken,
  requireAdmin,
  requireMunicipalityScope,
  validateLicense,
  logActivity('update_municipality_settings'),
  validateMunicipalitySettings,
  adminController.updateMunicipalitySettings
);

/**
 * @route   POST /api/admin/municipality/upload-logo
 * @desc    Upload du logo de la municipalité (png/jpg/jpeg/svg, 2 MB max)
 * @access  Private (Admin)
 */
router.post(
  '/municipality/upload-logo',
  authenticateToken,
  requireAdmin,
  requireMunicipalityScope,
  validateLicense,
  logActivity('upload_municipality_logo'),
  handleMulterErrors(logoUpload.single('logo')),
  adminController.uploadLogo
);

/**
 * @route   POST /api/admin/municipality/upload-banner
 * @desc    Upload du banner de la municipalité (png/jpg/jpeg/svg, 5 MB max)
 * @access  Private (Admin)
 */
router.post(
  '/municipality/upload-banner',
  authenticateToken,
  requireAdmin,
  requireMunicipalityScope,
  validateLicense,
  logActivity('upload_municipality_banner'),
  handleMulterErrors(bannerUpload.single('banner')),
  adminController.uploadBanner
);

// ============================================
// ROUTES GESTION DES MUNICIPALITÉS (SUPER ADMIN)
// ============================================

const { requireSuperAdmin } = require('../middlewares/auth');

/**
 * Validation municipalité
 */
const validateMunicipality = [
  body('name')
    .notEmpty()
    .withMessage('Nom requis')
    .isLength({ min: 3, max: 100 })
    .withMessage('Nom entre 3 et 100 caractères'),
  body('region')
    .notEmpty()
    .withMessage('Région requise')
    .isLength({ min: 2, max: 100 })
    .withMessage('Région entre 2 et 100 caractères'),
  body('country')
    .notEmpty()
    .withMessage('Pays requis')
    .isLength({ min: 2, max: 100 })
    .withMessage('Pays entre 2 et 100 caractères'),
  body('contact_email')
    .notEmpty()
    .withMessage('Email requis')
    .isEmail()
    .withMessage('Email invalide'),
  body('contact_phone')
    .notEmpty()
    .withMessage('Téléphone requis')
    .matches(/^\+?228[0-9]{8}$/)
    .withMessage('Numéro togolais invalide (+228XXXXXXXX)'),
  body('address')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Adresse max 255 caractères'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active doit être un booléen'),
  body('license_duration_years')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Durée licence entre 1 et 10 ans')
];

/**
 * Validation données de licence
 */
const validateLicenseData = [
  body('valid_until')
    .notEmpty()
    .withMessage('Date de fin requise')
    .isISO8601()
    .withMessage('Date invalide'),
  body('max_users')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Nombre max utilisateurs invalide'),
  body('max_reports_per_month')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Nombre max signalements invalide'),
  body('features')
    .optional()
    .isObject()
    .withMessage('Features doit être un objet')
];

/**
 * @route   GET /api/admin/municipalities
 * @desc    Obtenir toutes les municipalités (super admin uniquement)
 * @access  Private (Super Admin uniquement)
 */
router.get(
  '/municipalities',
  authenticateToken,
  requireSuperAdmin,
  adminController.getMunicipalities
);

/**
 * @route   POST /api/admin/municipalities
 * @desc    Créer une nouvelle municipalité (super admin uniquement)
 * @access  Private (Super Admin uniquement)
 */
router.post(
  '/municipalities',
  authenticateToken,
  requireSuperAdmin,
  logActivity('create_municipality'),
  validateMunicipality,
  adminController.createMunicipality
);

/**
 * @route   PUT /api/admin/municipalities/:id
 * @desc    Modifier une municipalité (super admin uniquement)
 * @access  Private (Super Admin uniquement)
 */
router.put(
  '/municipalities/:id',
  authenticateToken,
  requireSuperAdmin,
  logActivity('update_municipality'),
  [
    param('id').isInt({ min: 1 }).withMessage('ID invalide'),
    body('name').optional().isLength({ min: 3, max: 100 }).withMessage('Nom entre 3 et 100 caractères'),
    body('slug').optional().matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).withMessage('Slug invalide (minuscules, chiffres, tirets)'),
    body('region').optional().isLength({ min: 2, max: 100 }).withMessage('Région entre 2 et 100 caractères'),
    body('country').optional().isLength({ min: 2, max: 100 }).withMessage('Pays entre 2 et 100 caractères'),
    body('contact_email').optional().isEmail().withMessage('Email invalide'),
    body('contact_phone').optional().matches(/^\+?228[0-9]{8}$/).withMessage('Numéro togolais invalide'),
    body('address').optional().isLength({ max: 255 }).withMessage('Adresse max 255 caractères'),
    body('is_active').optional().isBoolean().withMessage('is_active doit être un booléen')
  ],
  adminController.updateMunicipality
);

/**
 * @route   DELETE /api/admin/municipalities/:id
 * @desc    Désactiver une municipalité (super admin uniquement)
 * @access  Private (Super Admin uniquement)
 */
router.delete(
  '/municipalities/:id',
  authenticateToken,
  requireSuperAdmin,
  logActivity('delete_municipality'),
  param('id').isInt({ min: 1 }).withMessage('ID invalide'),
  adminController.deleteMunicipality
);

/**
 * @route   POST /api/admin/municipalities/:id/license
 * @desc    Créer/renouveler la licence d'une municipalité (super admin uniquement)
 * @access  Private (Super Admin uniquement)
 */
router.post(
  '/municipalities/:id/license',
  authenticateToken,
  requireSuperAdmin,
  logActivity('create_municipality_license'),
  [
    param('id').isInt({ min: 1 }).withMessage('ID invalide'),
    ...validateLicenseData
  ],
  adminController.createMunicipalityLicense
);

// ============================================
// ROUTES VUE GLOBALE (SUPER ADMIN)
// ============================================

router.get('/global/stats', authenticateToken, requireSuperAdmin, adminController.getGlobalStats);
router.get(
  '/global/reports',
  authenticateToken,
  requireSuperAdmin,
  validatePagination,
  adminController.getGlobalReports
);

// ============================================
// ROUTES GESTION DES LICENCES (SUPER ADMIN)
// ============================================

router.get('/modules/catalog', authenticateToken, requireSuperAdmin, licenseAdminController.getCatalog);

router.get('/licenses', authenticateToken, requireSuperAdmin, licenseAdminController.listLicenses);
router.get(
  '/licenses/:id',
  authenticateToken,
  requireSuperAdmin,
  [param('id').isInt({ min: 1 }).withMessage('ID invalide')],
  licenseAdminController.getLicense
);
router.patch(
  '/licenses/:id/modules',
  authenticateToken,
  requireSuperAdmin,
  logActivity('update_license_modules'),
  [
    param('id').isInt({ min: 1 }).withMessage('ID invalide'),
    body('modules').optional().isObject(),
    body('features').optional().isObject()
  ],
  licenseAdminController.updateModules
);
router.post(
  '/licenses/:id/renew',
  authenticateToken,
  requireSuperAdmin,
  logActivity('renew_license'),
  [
    param('id').isInt({ min: 1 }).withMessage('ID invalide'),
    body('years').optional().isInt({ min: 1, max: 10 }).withMessage('Années 1-10')
  ],
  licenseAdminController.renewLicense
);
router.patch(
  '/licenses/:id/deactivate',
  authenticateToken,
  requireSuperAdmin,
  logActivity('deactivate_license'),
  [param('id').isInt({ min: 1 }).withMessage('ID invalide')],
  licenseAdminController.deactivateLicense
);
router.patch(
  '/licenses/:id/activate',
  authenticateToken,
  requireSuperAdmin,
  logActivity('activate_license'),
  [param('id').isInt({ min: 1 }).withMessage('ID invalide')],
  licenseAdminController.activateLicense
);

// ============================================
// ROUTES GESTION DES SUPER ADMINS
// ============================================

router.get('/super-admins', authenticateToken, requireSuperAdmin, superAdminController.listSuperAdmins);
router.post(
  '/super-admins',
  authenticateToken,
  requireSuperAdmin,
  logActivity('create_super_admin'),
  [
    body('full_name').notEmpty().isLength({ min: 3, max: 100 }).withMessage('Nom entre 3 et 100 caractères'),
    body('email').isEmail().withMessage('Email invalide'),
    body('phone').optional().matches(/^\+?[0-9]{8,15}$/).withMessage('Téléphone invalide')
  ],
  superAdminController.createSuperAdmin
);

module.exports = router;
