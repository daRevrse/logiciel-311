/**
 * Routes Notifications
 * Endpoints pour gérer les notifications utilisateurs
 *
 * Toutes les routes nécessitent :
 * - Authentification JWT
 * - Licence municipalité valide
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

// Middlewares
const { authenticateToken } = require('../middlewares/auth');
const { validateLicense } = require('../middlewares/license');
const { logActivity } = require('../middlewares/requestLogger');

// Contrôleur
const notificationController = require('../controllers/notificationController');

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
    .withMessage('Limite invalide (1-100)'),
  query('unreadOnly')
    .optional()
    .isBoolean()
    .withMessage('unreadOnly doit être un booléen')
];

/**
 * Validation préférences
 */
const validatePreferences = [
  body('email_status_change')
    .optional()
    .isBoolean()
    .withMessage('email_status_change doit être un booléen'),
  body('email_new_support')
    .optional()
    .isBoolean()
    .withMessage('email_new_support doit être un booléen'),
  body('sms_resolved')
    .optional()
    .isBoolean()
    .withMessage('sms_resolved doit être un booléen'),
  body('push_enabled')
    .optional()
    .isBoolean()
    .withMessage('push_enabled doit être un booléen')
];

/**
 * Validation notification ID
 */
const validateNotificationId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID notification invalide')
];

/**
 * Validation test notification
 */
const validateTestNotification = [
  body('type')
    .isIn(['status_change', 'new_report', 'assignment'])
    .withMessage('Type invalide'),
  body('reportId')
    .isInt({ min: 1 })
    .withMessage('ID signalement invalide')
];

// ============================================
// ROUTES NOTIFICATIONS
// ============================================

/**
 * @route   GET /api/notifications
 * @desc    Obtenir mes notifications
 * @access  Private
 */
router.get(
  '/',
  authenticateToken,
  validateLicense,
  validatePagination,
  notificationController.getMyNotifications
);

/**
 * @route   GET /api/notifications/unread
 * @desc    Obtenir mes notifications non lues
 * @access  Private
 */
router.get(
  '/unread',
  authenticateToken,
  validateLicense,
  notificationController.getUnreadNotifications
);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Marquer une notification comme lue
 * @access  Private
 */
router.put(
  '/:id/read',
  authenticateToken,
  validateLicense,
  validateNotificationId,
  notificationController.markAsRead
);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Marquer toutes mes notifications comme lues
 * @access  Private
 */
router.put(
  '/read-all',
  authenticateToken,
  validateLicense,
  logActivity('mark_all_notifications_read'),
  notificationController.markAllAsRead
);

// ============================================
// ROUTES PRÉFÉRENCES
// ============================================

/**
 * @route   GET /api/notifications/preferences
 * @desc    Obtenir mes préférences de notification
 * @access  Private
 */
router.get(
  '/preferences',
  authenticateToken,
  validateLicense,
  notificationController.getPreferences
);

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Mettre à jour mes préférences de notification
 * @access  Private
 */
router.put(
  '/preferences',
  authenticateToken,
  validateLicense,
  logActivity('update_notification_preferences'),
  validatePreferences,
  notificationController.updatePreferences
);

// ============================================
// ROUTES ADMIN - TEST
// ============================================

/**
 * @route   POST /api/notifications/test
 * @desc    Envoyer une notification de test (admin uniquement)
 * @access  Private (Admin)
 */
router.post(
  '/test',
  authenticateToken,
  validateLicense,
  logActivity('send_test_notification'),
  validateTestNotification,
  notificationController.sendTestNotification
);

module.exports = router;
