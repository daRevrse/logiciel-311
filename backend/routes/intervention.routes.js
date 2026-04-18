/**
 * Routes Admin - Gestion des interventions
 *
 * Montées sur /api/admin/interventions
 *
 * Guards : authenticateToken + requireAdmin + requireMunicipalityScope
 *        + validateLicense + logActivity (sur mutations).
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { authenticateToken, requireAdmin } = require('../middlewares/auth');
const { validateLicense } = require('../middlewares/license');
const { logActivity } = require('../middlewares/requestLogger');

const interventionController = require('../controllers/interventionController');

function requireMunicipalityScope(req, res, next) {
  if (!req.municipalityId) {
    return res.status(400).json({
      success: false,
      message: 'Super-admins doivent utiliser les routes /municipalities/:id'
    });
  }
  next();
}

const commonGuards = [
  authenticateToken,
  requireAdmin,
  requireMunicipalityScope,
  validateLicense
];

const validateId = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide')
];

const validateCreate = [
  body('report_id').isInt({ min: 1 }).withMessage('report_id requis'),
  body('agent_id').isInt({ min: 1 }).withMessage('agent_id requis'),
  body('scheduled_at').optional({ nullable: true }).isISO8601().withMessage('scheduled_at invalide'),
  body('notes').optional({ nullable: true }).isString().isLength({ max: 5000 })
];

const validateUpdate = [
  body('status').optional().isIn(['pending', 'scheduled', 'in_progress', 'completed', 'cancelled']),
  body('notes').optional({ nullable: true }).isString().isLength({ max: 5000 }),
  body('scheduled_at').optional({ nullable: true }).isISO8601().withMessage('scheduled_at invalide'),
  body('agent_id').optional().isInt({ min: 1 }).withMessage('agent_id invalide')
];

const validatePagination = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
];

router.get('/', ...commonGuards, validatePagination, interventionController.listInterventions);
router.get('/:id', ...commonGuards, validateId, interventionController.getIntervention);
router.post(
  '/',
  ...commonGuards,
  logActivity('create_intervention'),
  validateCreate,
  interventionController.createIntervention
);
router.patch(
  '/:id',
  ...commonGuards,
  logActivity('update_intervention'),
  [...validateId, ...validateUpdate],
  interventionController.updateIntervention
);

module.exports = router;
