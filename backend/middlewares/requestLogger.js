const logger = require('../utils/logger');
const { ActivityLog } = require('../models');

/**
 * Middleware pour logger les requêtes HTTP
 */
const logHttpRequest = (req, res, next) => {
  const start = Date.now();

  // Intercepter la réponse pour logger le temps de réponse
  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('Requête HTTP', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.userId,
      municipalityId: req.municipalityId
    });
  });

  next();
};

/**
 * Middleware pour enregistrer les activités dans la base de données
 * @param {string} action - Type d'action (ex: 'create_report', 'login')
 * @param {string} entityType - Type d'entité (ex: 'report', 'user')
 */
const logActivity = (action, entityType = null) => {
  return async (req, res, next) => {
    // Sauvegarder la méthode json originale
    const originalJson = res.json;

    // Surcharger res.json pour logger après la réponse
    res.json = async function(data) {
      try {
        // Ne logger que les succès (status 2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const activityData = {
            municipalityId: req.municipalityId,
            userId: req.userId,
            action: action,
            entityType: entityType,
            entityId: data.data?.id || req.params.id || null,
            details: {
              method: req.method,
              path: req.path,
              success: data.success
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          };

          await ActivityLog.log(activityData);
        }
      } catch (error) {
        logger.error('Erreur lors de l\'enregistrement de l\'activité:', error);
        // Ne pas bloquer la réponse si le log échoue
      }

      // Appeler la méthode json originale
      originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Middleware pour logger les erreurs détaillées
 */
const logError = (err, req, res, next) => {
  logger.error('Erreur serveur', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.userId,
    municipalityId: req.municipalityId,
    body: req.body,
    params: req.params,
    query: req.query
  });

  next(err);
};

module.exports = {
  logHttpRequest,
  logActivity,
  logError
};
