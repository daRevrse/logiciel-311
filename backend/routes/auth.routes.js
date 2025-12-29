const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const { logActivity } = require('../middlewares/requestLogger');

/**
 * Routes d'authentification
 * Support 2 méthodes :
 * 1. Device Fingerprinting (MVP)
 * 2. Téléphone + SMS
 */

// ============================================
// ROUTES PUBLIQUES (Sans authentification)
// ============================================

/**
 * @route   POST /api/auth/login/fingerprint
 * @desc    Connexion par device fingerprint
 * @access  Public
 */
router.post('/login/fingerprint',
  authLimiter,
  authController.validationRules.loginFingerprint,
  authController.validate,
  logActivity('login_fingerprint', 'user'),
  authController.loginByFingerprint
);

/**
 * @route   POST /api/auth/request-code
 * @desc    Demander un code de vérification SMS
 * @access  Public
 */
router.post('/request-code',
  authLimiter,
  authController.validationRules.requestCode,
  authController.validate,
  logActivity('request_verification_code', 'user'),
  authController.requestCode
);

/**
 * @route   POST /api/auth/verify-code
 * @desc    Vérifier le code SMS et se connecter
 * @access  Public
 */
router.post('/verify-code',
  authLimiter,
  authController.validationRules.verifyCode,
  authController.validate,
  logActivity('verify_code_login', 'user'),
  authController.verifyCode
);

/**
 * @route   POST /api/auth/admin/login
 * @desc    Connexion administrateur
 * @access  Public
 */
router.post('/admin/login',
  authLimiter,
  logActivity('admin_login', 'user'),
  authController.loginAdmin
);

// ============================================
// ROUTES PROTÉGÉES (Authentification requise)
// ============================================

/**
 * @route   GET /api/auth/profile
 * @desc    Récupérer le profil de l'utilisateur connecté
 * @access  Authentifié
 */
router.get('/profile',
  authenticateToken,
  authController.getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Mettre à jour le profil
 * @access  Authentifié
 */
router.put('/profile',
  authenticateToken,
  authController.validationRules.updateProfile,
  authController.validate,
  logActivity('update_profile', 'user'),
  authController.updateProfile
);

/**
 * @route   GET /api/auth/verify-token
 * @desc    Vérifier si le token est valide
 * @access  Authentifié
 */
router.get('/verify-token',
  authenticateToken,
  authController.verifyToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnexion (supprime le token côté client)
 * @access  Authentifié
 */
router.post('/logout',
  authenticateToken,
  logActivity('logout', 'user'),
  authController.logout
);

module.exports = router;
