/**
 * Routes Agent - Interventions propres à l'agent connecté.
 *
 * Montées sur /api/agent.
 *
 * Guards : authenticateToken + requireAgentRole + validateLicense + logActivity.
 */

const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');

const { authenticateToken } = require('../middlewares/auth');
const { validateLicense } = require('../middlewares/license');
const { logActivity } = require('../middlewares/requestLogger');
const { handleMulterErrors } = require('../middlewares/uploadMunicipalityImage');
const uploadService = require('../services/uploadService');

const agentController = require('../controllers/agentController');

/**
 * Guard local : le user doit avoir le rôle 'agent'.
 */
function requireAgentRole(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentification requise' });
  }
  if (req.userRole !== 'agent') {
    return res.status(403).json({ success: false, message: 'Accès réservé aux agents' });
  }
  next();
}

const commonGuards = [authenticateToken, requireAgentRole, validateLicense];

const validateId = [
  param('id').isInt({ min: 1 }).withMessage('ID invalide')
];

const validateList = [
  query('status').optional().isIn(['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'])
];

const validateUpdate = [
  body('status').optional().isIn(['pending', 'in_progress', 'completed']),
  body('notes').optional({ nullable: true }).isString().isLength({ max: 5000 })
];

router.get(
  '/interventions',
  ...commonGuards,
  validateList,
  agentController.listMyInterventions
);

router.get(
  '/interventions/:id',
  ...commonGuards,
  validateId,
  agentController.getMyIntervention
);

router.patch(
  '/interventions/:id',
  ...commonGuards,
  logActivity('update_my_intervention'),
  [...validateId, ...validateUpdate],
  agentController.updateMyIntervention
);

router.post(
  '/interventions/:id/photos',
  ...commonGuards,
  logActivity('upload_intervention_photo'),
  validateId,
  handleMulterErrors(uploadService.single('photo')),
  agentController.uploadInterventionPhoto
);

module.exports = router;
