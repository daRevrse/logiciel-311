const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Rate limiter général pour toutes les routes API
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requêtes max
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit dépassé', {
      ip: req.ip,
      path: req.path,
      userId: req.userId
    });

    res.status(429).json({
      success: false,
      message: 'Trop de requêtes. Veuillez patienter avant de réessayer.'
    });
  }
});

/**
 * Rate limiter strict pour l'authentification
 * Protection contre les attaques par force brute
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives max
  skipSuccessfulRequests: true, // Ne pas compter les requêtes réussies
  message: {
    success: false,
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
  },
  handler: (req, res) => {
    logger.warn('Rate limit authentification dépassé', {
      ip: req.ip,
      phone: req.body?.phone,
      deviceFingerprint: req.body?.deviceFingerprint
    });

    res.status(429).json({
      success: false,
      message: 'Trop de tentatives de connexion. Compte temporairement bloqué.'
    });
  }
});

/**
 * Rate limiter pour la création de signalements
 * Éviter le spam de signalements
 */
const reportCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // 10 signalements max par heure
  keyGenerator: (req) => {
    // Limiter par utilisateur
    return req.userId?.toString() || req.ip;
  },
  message: {
    success: false,
    message: 'Limite de création de signalements atteinte (10 par heure)'
  },
  handler: (req, res) => {
    logger.warn('Limite de création de signalements atteinte', {
      userId: req.userId,
      municipalityId: req.municipalityId,
      ip: req.ip
    });

    res.status(429).json({
      success: false,
      message: 'Vous avez atteint la limite de 10 signalements par heure.'
    });
  }
});

/**
 * Rate limiter pour les supports (appuis)
 * Éviter les abus
 */
const supportLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 appuis max par minute
  keyGenerator: (req) => {
    return req.userId?.toString() || req.ip;
  },
  message: {
    success: false,
    message: 'Trop d\'actions. Veuillez patienter un instant.'
  }
});

/**
 * Rate limiter pour l'upload de fichiers
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 50, // 50 uploads max par heure
  keyGenerator: (req) => {
    return req.userId?.toString() || req.ip;
  },
  message: {
    success: false,
    message: 'Limite d\'upload atteinte (50 fichiers par heure)'
  }
});

module.exports = {
  generalLimiter,
  authLimiter,
  reportCreationLimiter,
  supportLimiter,
  uploadLimiter
};
