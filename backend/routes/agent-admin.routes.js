/**
 * Routes Admin - Gestion des agents
 *
 * Montées sur /api/admin/agents
 *
 * Toutes les routes nécessitent :
 *  - authenticateToken
 *  - requireAdmin
 *  - requireMunicipalityScope (super_admin sans municipalité rejeté)
 *  - validateLicense
 *  - logActivity (sur mutations)
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { authenticateToken, requireAdmin } = require('../middlewares/auth');
const { validateLicense } = require('../middlewares/license');
const { logActivity } = require('../middlewares/requestLogger');

const agentAdminController = require('../controllers/agentAdminController');

/**
 * Guard : requiert que req.municipalityId soit défini. Aligne avec le pattern
 * utilisé sur les settings municipalité (admin.routes.js).
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

// Pile de middlewares communs à toutes les routes
const commonGuards = [
  authenticateToken,
  requireAdmin,
  requireMunicipalityScope,
  validateLicense
];

const validateAgentId = [
  param('id').isInt({ min: 1 }).withMessage('ID agent invalide')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page invalide'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit invalide (1-100)')
];

const validateCreateAgent = [
  body('email').isEmail().withMessage('Email invalide'),
  body('full_name')
    .optional()
    .isString()
    .isLength({ min: 2, max: 255 })
    .withMessage('full_name entre 2 et 255 caractères'),
  body('name')
    .optional()
    .isString()
    .isLength({ min: 2, max: 255 })
    .withMessage('name entre 2 et 255 caractères'),
  body('phone')
    .optional()
    .matches(/^\+?[0-9]{8,15}$/)
    .withMessage('Téléphone invalide'),
  body('specializations')
    .optional()
    .isArray()
    .withMessage('specializations doit être un tableau'),
  body('specializations.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('specializations doit contenir des IDs entiers positifs')
];

const validateUpdateAgent = [
  body('full_name')
    .optional()
    .isString()
    .isLength({ min: 2, max: 255 })
    .withMessage('full_name entre 2 et 255 caractères'),
  body('name')
    .optional()
    .isString()
    .isLength({ min: 2, max: 255 })
    .withMessage('name entre 2 et 255 caractères'),
  body('specializations')
    .optional()
    .isArray()
    .withMessage('specializations doit être un tableau'),
  body('specializations.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('specializations doit contenir des IDs entiers positifs')
];

/**
 * @route  GET /api/admin/agents
 * @desc   Liste paginée des agents de la municipalité
 */
router.get(
  '/',
  ...commonGuards,
  validatePagination,
  agentAdminController.listAgents
);

/**
 * @route  POST /api/admin/agents
 * @desc   Créer un agent (mot de passe temporaire + email d'invitation)
 */
router.post(
  '/',
  ...commonGuards,
  logActivity('create_agent'),
  validateCreateAgent,
  agentAdminController.createAgent
);

/**
 * @route  PATCH /api/admin/agents/:id
 * @desc   Mettre à jour nom / specializations
 */
router.patch(
  '/:id',
  ...commonGuards,
  logActivity('update_agent'),
  [...validateAgentId, ...validateUpdateAgent],
  agentAdminController.updateAgent
);

/**
 * @route  DELETE /api/admin/agents/:id
 * @desc   Désactiver un agent (soft delete via is_active=false)
 */
router.delete(
  '/:id',
  ...commonGuards,
  logActivity('delete_agent'),
  validateAgentId,
  agentAdminController.deleteAgent
);

module.exports = router;
