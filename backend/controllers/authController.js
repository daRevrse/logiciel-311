const authService = require('../services/authService');
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');

/**
 * Contrôleur d'authentification
 * Gère les endpoints de connexion et profil utilisateur
 */

class AuthController {
  /**
   * MÉTHODE 1 : Login par Device Fingerprint
   * POST /api/auth/login/fingerprint
   * Public
   */
  async loginByFingerprint(req, res) {
    try {
      const { municipalityId, deviceFingerprint, fullName } = req.body;

      // Validation
      if (!municipalityId || !deviceFingerprint) {
        return res.status(400).json({
          success: false,
          message: 'ID municipalité et empreinte appareil requis'
        });
      }

      const result = await authService.loginByFingerprint(
        municipalityId,
        deviceFingerprint,
        fullName
      );

      res.json({
        success: true,
        message: result.isNewUser ? 'Compte créé avec succès' : 'Connexion réussie',
        data: {
          user: result.user,
          token: result.token,
          isNewUser: result.isNewUser
        }
      });
    } catch (error) {
      logger.error('Erreur login fingerprint:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de la connexion'
      });
    }
  }

  /**
   * MÉTHODE 2 : Demander un code SMS
   * POST /api/auth/request-code
   * Public
   */
  async requestCode(req, res) {
    try {
      const { municipalityId, phone } = req.body;

      // Validation
      if (!municipalityId || !phone) {
        return res.status(400).json({
          success: false,
          message: 'ID municipalité et téléphone requis'
        });
      }

      const result = await authService.requestVerificationCode(
        municipalityId,
        phone
      );

      res.json({
        success: true,
        message: result.message,
        data: {
          isNewUser: result.isNewUser,
          // Code visible en dev uniquement
          ...(result.devCode && { devCode: result.devCode })
        }
      });
    } catch (error) {
      logger.error('Erreur demande code:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de l\'envoi du code'
      });
    }
  }

  /**
   * MÉTHODE 2 : Vérifier le code et connecter
   * POST /api/auth/verify-code
   * Public
   */
  async verifyCode(req, res) {
    try {
      const { municipalityId, phone, code, fullName } = req.body;

      // Validation
      if (!municipalityId || !phone || !code) {
        return res.status(400).json({
          success: false,
          message: 'ID municipalité, téléphone et code requis'
        });
      }

      const result = await authService.verifyCodeAndLogin(
        municipalityId,
        phone,
        code,
        fullName
      );

      res.json({
        success: true,
        message: result.isNewUser ? 'Compte créé avec succès' : 'Connexion réussie',
        data: {
          user: result.user,
          token: result.token,
          isNewUser: result.isNewUser
        }
      });
    } catch (error) {
      logger.error('Erreur vérification code:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Code invalide ou expiré'
      });
    }
  }

  /**
   * Login Admin (avec email et mot de passe)
   * POST /api/auth/admin/login
   * Public
   */
  async loginAdmin(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email et mot de passe requis'
        });
      }

      const result = await authService.loginAdmin(email, password);

      res.json({
        success: true,
        message: 'Connexion admin réussie',
        data: {
          user: result.user,
          token: result.token
        }
      });
    } catch (error) {
      logger.error('Erreur login admin:', error);
      res.status(401).json({
        success: false,
        message: error.message || 'Email ou mot de passe invalide'
      });
    }
  }

  /**
   * Récupérer le profil de l'utilisateur connecté
   * GET /api/auth/profile
   * Authentifié
   */
  async getProfile(req, res) {
    try {
      const userId = req.userId; // Injecté par middleware auth

      const result = await authService.getProfile(userId);

      res.json({
        success: true,
        data: result.user
      });
    } catch (error) {
      logger.error('Erreur récupération profil:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Profil non trouvé'
      });
    }
  }

  /**
   * Mettre à jour le profil
   * PUT /api/auth/profile
   * Authentifié
   */
  async updateProfile(req, res) {
    try {
      const userId = req.userId;
      const { fullName, email } = req.body;

      const updates = {};
      if (fullName !== undefined) updates.full_name = fullName;
      if (email !== undefined) updates.email = email;

      const result = await authService.updateProfile(userId, updates);

      res.json({
        success: true,
        message: 'Profil mis à jour',
        data: result.user
      });
    } catch (error) {
      logger.error('Erreur mise à jour profil:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de la mise à jour'
      });
    }
  }

  /**
   * Vérifier si un token est valide
   * GET /api/auth/verify-token
   * Authentifié
   */
  async verifyToken(req, res) {
    try {
      // Si on arrive ici, le token est valide (vérifié par middleware)
      res.json({
        success: true,
        message: 'Token valide',
        data: {
          userId: req.userId,
          municipalityId: req.municipalityId,
          role: req.userRole
        }
      });
    } catch (error) {
      logger.error('Erreur vérification token:', error);
      res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }
  }

  /**
   * Déconnexion (côté client, suppression du token)
   * POST /api/auth/logout
   * Authentifié
   */
  async logout(req, res) {
    try {
      // Pour MVP, la déconnexion se fait côté client (suppression du token)
      // TODO: Implémenter blacklist des tokens si nécessaire

      logger.info(`Déconnexion: User ${req.userId}`);

      res.json({
        success: true,
        message: 'Déconnexion réussie'
      });
    } catch (error) {
      logger.error('Erreur déconnexion:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la déconnexion'
      });
    }
  }

  /**
   * Validation rules pour express-validator
   */
  static validationRules = {
    loginFingerprint: [
      body('municipalityId').isInt().withMessage('ID municipalité invalide'),
      body('deviceFingerprint').notEmpty().withMessage('Empreinte appareil requise'),
      body('fullName').optional().isString().trim()
    ],

    requestCode: [
      body('municipalityId').isInt().withMessage('ID municipalité invalide'),
      body('phone').matches(/^\+?[0-9]{8,15}$/).withMessage('Format téléphone invalide')
    ],

    verifyCode: [
      body('municipalityId').isInt().withMessage('ID municipalité invalide'),
      body('phone').matches(/^\+?[0-9]{8,15}$/).withMessage('Format téléphone invalide'),
      body('code').isLength({ min: 6, max: 6 }).withMessage('Code doit contenir 6 chiffres'),
      body('fullName').optional().isString().trim()
    ],

    updateProfile: [
      body('fullName').optional().isString().trim().isLength({ min: 2, max: 255 }),
      body('email').optional().isEmail().withMessage('Email invalide')
    ]
  };
}

/**
 * Middleware de validation
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: errors.array()
    });
  }
  next();
};

const controller = new AuthController();

module.exports = {
  loginByFingerprint: controller.loginByFingerprint.bind(controller),
  requestCode: controller.requestCode.bind(controller),
  verifyCode: controller.verifyCode.bind(controller),
  loginAdmin: controller.loginAdmin.bind(controller),
  getProfile: controller.getProfile.bind(controller),
  updateProfile: controller.updateProfile.bind(controller),
  verifyToken: controller.verifyToken.bind(controller),
  logout: controller.logout.bind(controller),
  validate,
  validationRules: AuthController.validationRules
};
