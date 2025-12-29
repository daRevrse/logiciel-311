/**
 * Contrôleur Notifications
 * Gère les endpoints pour les notifications
 *
 * Endpoints :
 * - GET /api/notifications - Mes notifications
 * - GET /api/notifications/unread - Notifications non lues
 * - PUT /api/notifications/:id/read - Marquer comme lue
 * - PUT /api/notifications/read-all - Tout marquer comme lu
 * - GET /api/notifications/preferences - Mes préférences
 * - PUT /api/notifications/preferences - Modifier préférences
 * - POST /api/notifications/test - Test notification (admin)
 */

const notificationService = require('../services/notificationService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Obtenir mes notifications
 * GET /api/notifications
 *
 * Authentification : Requise
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    const options = {
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 20, 100),
      unreadOnly: req.query.unreadOnly === 'true'
    };

    const result = await notificationService.getUserNotifications(userId, options);

    res.json(result);

  } catch (error) {
    logger.error(`Erreur getMyNotifications controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des notifications'
    });
  }
};

/**
 * Obtenir mes notifications non lues
 * GET /api/notifications/unread
 *
 * Authentification : Requise
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.getUnreadNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await notificationService.getUserNotifications(userId, {
      page: 1,
      limit: 50,
      unreadOnly: true
    });

    res.json(result);

  } catch (error) {
    logger.error(`Erreur getUnreadNotifications controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des notifications'
    });
  }
};

/**
 * Marquer une notification comme lue
 * PUT /api/notifications/:id/read
 *
 * Authentification : Requise
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.markAsRead = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const userId = req.userId;

    const result = await notificationService.markAsRead(notificationId, userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);

  } catch (error) {
    logger.error(`Erreur markAsRead controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour'
    });
  }
};

/**
 * Marquer toutes les notifications comme lues
 * PUT /api/notifications/read-all
 *
 * Authentification : Requise
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await notificationService.markAllAsRead(userId);

    res.json(result);

  } catch (error) {
    logger.error(`Erreur markAllAsRead controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour'
    });
  }
};

/**
 * Obtenir mes préférences de notification
 * GET /api/notifications/preferences
 *
 * Authentification : Requise
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.getPreferences = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await notificationService.getUserPreferences(userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);

  } catch (error) {
    logger.error(`Erreur getPreferences controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des préférences'
    });
  }
};

/**
 * Mettre à jour mes préférences de notification
 * PUT /api/notifications/preferences
 *
 * Authentification : Requise
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.updatePreferences = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: errors.array()
      });
    }

    const userId = req.userId;
    const preferences = req.body;

    const result = await notificationService.updateUserPreferences(userId, preferences);

    if (!result.success) {
      return res.status(404).json(result);
    }

    logger.info(`✅ Préférences notifications mises à jour: User ${userId}`);

    res.json(result);

  } catch (error) {
    logger.error(`Erreur updatePreferences controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la mise à jour'
    });
  }
};

/**
 * Envoyer une notification de test
 * POST /api/notifications/test
 *
 * Authentification : Requise (admin)
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.sendTestNotification = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès réservé aux administrateurs'
      });
    }

    const { type, reportId } = req.body;

    let result;

    switch (type) {
      case 'status_change':
        result = await notificationService.notifyStatusChange(
          reportId,
          'in_progress',
          'Ceci est une notification de test'
        );
        break;

      case 'new_report':
        result = await notificationService.notifyAdminNewReport(reportId);
        break;

      case 'assignment':
        result = await notificationService.notifyAdminAssignment(reportId, req.userId);
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Type de notification invalide'
        });
    }

    logger.info(`✅ Notification de test envoyée: ${type} pour report ${reportId}`);

    res.json(result);

  } catch (error) {
    logger.error(`Erreur sendTestNotification controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'envoi'
    });
  }
};
