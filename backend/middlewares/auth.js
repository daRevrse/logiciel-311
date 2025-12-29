const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Middleware d'authentification JWT
 * Vérifie le token et charge les informations utilisateur
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant'
      });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Charger l'utilisateur depuis la base de données
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['verification_code', 'verification_expires_at'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Compte désactivé'
      });
    }

    // Attacher les infos utilisateur à la requête
    req.user = user;
    req.userId = user.id;
    req.municipalityId = user.municipality_id;
    req.userRole = user.role;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }

    logger.error('Erreur authentification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'authentification'
    });
  }
};

/**
 * Middleware pour vérifier que l'utilisateur est un administrateur
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  if (!req.user.isAdmin()) {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux administrateurs'
    });
  }

  next();
};

/**
 * Middleware pour vérifier que l'utilisateur est un super administrateur
 */
const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  if (!req.user.isSuperAdmin()) {
    return res.status(403).json({
      success: false,
      message: 'Accès réservé aux super administrateurs'
    });
  }

  next();
};

/**
 * Middleware optionnel : charge l'utilisateur si token présent
 * Utile pour routes accessibles avec ou sans auth
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.userId);

      if (user && user.is_active) {
        req.user = user;
        req.userId = user.id;
        req.municipalityId = user.municipality_id;
        req.userRole = user.role;
      }
    }

    next();
  } catch (error) {
    // Ignorer les erreurs de token en mode optionnel
    next();
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireSuperAdmin,
  optionalAuth
};
