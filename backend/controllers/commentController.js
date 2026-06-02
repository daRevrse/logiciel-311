const { ReportComment, Report, User, Notification } = require('../models');
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');

const STAFF_ROLES = ['agent', 'admin', 'super_admin'];

function isStaff(role) {
  return STAFF_ROLES.includes(role);
}

async function loadReportOrFail(reportId, municipalityId) {
  const report = await Report.findOne({ where: { id: reportId, municipality_id: municipalityId } });
  if (!report) {
    const err = new Error('Signalement introuvable');
    err.status = 404;
    throw err;
  }
  return report;
}

class CommentController {
  /**
   * GET /api/reports/:reportId/comments
   * Liste les commentaires. Citoyens propriétaires + staff voient publics.
   * Staff voit aussi internes.
   */
  async list(req, res) {
    try {
      const { reportId } = req.params;
      const municipalityId = req.municipalityId;
      const report = await loadReportOrFail(reportId, municipalityId);

      const userRole = req.userRole;
      const userId = req.userId;
      const staff = isStaff(userRole);
      const isOwner = report.citizen_id && report.citizen_id === userId;

      if (!staff && !isOwner) {
        return res.status(403).json({ success: false, message: 'Accès refusé' });
      }

      const where = { report_id: reportId };
      if (!staff) where.is_internal = false;

      const comments = await ReportComment.findAll({
        where,
        include: [{
          model: User,
          as: 'author',
          attributes: ['id', 'full_name', 'role']
        }],
        order: [['created_at', 'ASC']]
      });

      res.json({ success: true, data: comments });
    } catch (error) {
      logger.error('Erreur list comments:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Erreur serveur' });
    }
  }

  /**
   * POST /api/reports/:reportId/comments
   * Propriétaire ou staff peut commenter. is_internal réservé staff.
   */
  async create(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { reportId } = req.params;
      const { body: text, is_internal } = req.body;
      const municipalityId = req.municipalityId;
      const userId = req.userId;
      const userRole = req.userRole;

      const report = await loadReportOrFail(reportId, municipalityId);
      const staff = isStaff(userRole);
      const isOwner = report.citizen_id && report.citizen_id === userId;

      if (!staff && !isOwner) {
        return res.status(403).json({ success: false, message: 'Accès refusé' });
      }

      const internal = staff && !!is_internal;

      const comment = await ReportComment.create({
        report_id: reportId,
        author_id: userId,
        author_role: userRole,
        body: text,
        is_internal: internal
      });

      // Notification au citoyen si commentaire public d'un staff
      if (!internal && staff && report.citizen_id) {
        try {
          await Notification.create({
            municipality_id: municipalityId,
            user_id: report.citizen_id,
            report_id: report.id,
            type: 'status_change',
            title: `Nouveau message sur signalement #${report.id}`,
            message: text.substring(0, 200)
          });
          const realtime = req.app.get('realtime');
          if (realtime) realtime.emitToUser(report.citizen_id, 'comment:new', {
            reportId: report.id,
            commentId: comment.id
          });
        } catch (notifErr) {
          logger.warn('Notification commentaire échouée:', notifErr.message);
        }
      }

      // Notification staff si commentaire du citoyen
      if (!staff && isOwner) {
        try {
          const realtime = req.app.get('realtime');
          if (realtime) realtime.emitToMunicipality(municipalityId, 'comment:new', {
            reportId: report.id,
            commentId: comment.id,
            scope: 'admin'
          });
        } catch (e) { /* noop */ }
      }

      const full = await ReportComment.findByPk(comment.id, {
        include: [{ model: User, as: 'author', attributes: ['id', 'full_name', 'role'] }]
      });

      res.status(201).json({ success: true, data: full });
    } catch (error) {
      logger.error('Erreur create comment:', error);
      res.status(error.status || 500).json({ success: false, message: error.message || 'Erreur serveur' });
    }
  }

  /**
   * DELETE /api/reports/:reportId/comments/:commentId
   * Auteur ou admin peut supprimer (soft delete).
   */
  async remove(req, res) {
    try {
      const { reportId, commentId } = req.params;
      const userId = req.userId;
      const userRole = req.userRole;

      const comment = await ReportComment.findOne({
        where: { id: commentId, report_id: reportId }
      });
      if (!comment) {
        return res.status(404).json({ success: false, message: 'Commentaire introuvable' });
      }

      const canDelete = comment.author_id === userId
        || userRole === 'admin'
        || userRole === 'super_admin';
      if (!canDelete) {
        return res.status(403).json({ success: false, message: 'Suppression non autorisée' });
      }

      await comment.destroy();
      res.json({ success: true, message: 'Commentaire supprimé' });
    } catch (error) {
      logger.error('Erreur remove comment:', error);
      res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  static validationRules = {
    create: [
      body('body').trim().isLength({ min: 1, max: 5000 })
        .withMessage('Commentaire entre 1 et 5000 caractères'),
      body('is_internal').optional().isBoolean()
    ]
  };
}

const controller = new CommentController();
module.exports = {
  list: controller.list.bind(controller),
  create: controller.create.bind(controller),
  remove: controller.remove.bind(controller),
  validationRules: CommentController.validationRules
};
