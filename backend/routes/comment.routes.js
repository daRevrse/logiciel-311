const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticateToken } = require('../middlewares/auth');
const { validateLicense } = require('../middlewares/license');
const commentController = require('../controllers/commentController');

const needsAuth = [authenticateToken, validateLicense];

router.get('/', ...needsAuth, commentController.list);
router.post('/', ...needsAuth, commentController.validationRules.create, commentController.create);
router.delete('/:commentId', ...needsAuth, commentController.remove);

module.exports = router;
