/**
 * Contrôleur Agent - Interventions propres à l'agent connecté.
 *
 * Endpoints :
 *  - GET   /api/agent/interventions        Liste des interventions de l'agent
 *  - PATCH /api/agent/interventions/:id    Mise à jour status / notes
 *
 * Scope : agent_id === req.userId.
 */

const {
  Intervention,
  Report,
  User,
  Category,
  ReportPhoto,
  sequelize
} = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const uploadService = require('../services/uploadService');

const ALLOWED_STATUSES = ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'];
// Transitions autorisées pour l'agent (il ne peut pas annuler).
const AGENT_ALLOWED_TARGETS = ['pending', 'in_progress', 'completed'];
const ACTIVE_STATUSES = ['pending', 'scheduled', 'in_progress'];

/**
 * Relations pour la réponse côté agent.
 */
function buildAgentInclude() {
  return [
    {
      model: Report,
      as: 'report',
      attributes: [
        'id', 'title', 'description', 'status', 'address',
        'latitude', 'longitude', 'is_anonymous', 'category_id',
        'municipality_id', 'citizen_id', 'created_at'
      ],
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'color'] },
        { model: User, as: 'citizen', attributes: ['id', 'full_name'], required: false },
        {
          model: ReportPhoto,
          as: 'photos',
          attributes: ['id', 'photo_url', 'upload_order'],
          required: false,
          separate: true,
          order: [['upload_order', 'ASC']],
          limit: 1
        }
      ]
    }
  ];
}

/**
 * Formate une intervention pour la réponse agent : nettoie le nom citoyen si
 * anonyme, ajoute une miniature photo si disponible.
 */
function formatIntervention(intervention) {
  const data = intervention.toJSON ? intervention.toJSON() : intervention;
  if (data.report) {
    if (data.report.is_anonymous) {
      data.report.citizen = null;
      data.report.citizen_display_name = null;
    } else if (data.report.citizen) {
      data.report.citizen_display_name = data.report.citizen.full_name || null;
    } else {
      data.report.citizen_display_name = null;
    }
    const photos = Array.isArray(data.report.photos) ? data.report.photos : [];
    data.report.thumbnail_url = photos.length > 0 ? photos[0].photo_url : null;
  }
  return data;
}

/**
 * GET /api/agent/dashboard
 * Métriques pour l'écran d'accueil de l'agent connecté.
 */
exports.getDashboard = async (req, res) => {
  try {
    const agentId = req.userId;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [workloadRaw, completed30dRaw, upcoming, recentCompleted] = await Promise.all([
      Intervention.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        where: { agent_id: agentId },
        group: ['status']
      }),
      Intervention.findAll({
        attributes: ['started_at', 'completed_at'],
        where: {
          agent_id: agentId,
          status: 'completed',
          completed_at: { [Op.gte]: thirtyDaysAgo }
        },
        raw: true
      }),
      Intervention.findAll({
        where: {
          agent_id: agentId,
          status: { [Op.in]: ACTIVE_STATUSES }
        },
        include: buildAgentInclude(),
        order: [
          [sequelize.literal('scheduled_at IS NULL'), 'ASC'],
          ['scheduled_at', 'ASC'],
          ['created_at', 'DESC']
        ],
        limit: 5
      }),
      Intervention.findAll({
        where: { agent_id: agentId, status: 'completed' },
        include: buildAgentInclude(),
        order: [['completed_at', 'DESC']],
        limit: 5
      })
    ]);

    const workload = {};
    ALLOWED_STATUSES.forEach((s) => { workload[s] = 0; });
    workloadRaw.forEach((row) => {
      workload[row.get('status')] = parseInt(row.get('count'), 10) || 0;
    });

    const totalAttempted30d = await Intervention.count({
      where: {
        agent_id: agentId,
        [Op.or]: [
          { status: 'completed', completed_at: { [Op.gte]: thirtyDaysAgo } },
          { status: { [Op.in]: ['pending', 'scheduled', 'in_progress'] }, created_at: { [Op.gte]: thirtyDaysAgo } }
        ]
      }
    });
    const completed30dCount = completed30dRaw.length;
    const completionRate30d = totalAttempted30d > 0
      ? Math.round((completed30dCount / totalAttempted30d) * 100)
      : 0;

    const durations = completed30dRaw
      .filter((r) => r.started_at && r.completed_at)
      .map((r) => (new Date(r.completed_at) - new Date(r.started_at)) / (1000 * 60 * 60));
    const avgResolutionHours30d = durations.length > 0
      ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
      : null;

    res.json({
      success: true,
      data: {
        workload,
        active_total: workload.pending + workload.scheduled + workload.in_progress,
        completion_rate_30d: completionRate30d,
        completed_30d: completed30dCount,
        avg_resolution_hours_30d: avgResolutionHours30d,
        upcoming: upcoming.map(formatIntervention),
        recent_completed: recentCompleted.map(formatIntervention)
      }
    });
  } catch (error) {
    logger.error(`Erreur getDashboard agent: ${error.message}`, { error });
    res.status(500).json({ success: false, message: 'Erreur lors du chargement du dashboard' });
  }
};

/**
 * GET /api/agent/interventions
 * Liste les interventions de l'agent connecté.
 */
exports.listMyInterventions = async (req, res) => {
  try {
    const where = { agent_id: req.userId };

    if (req.query.status) {
      if (!ALLOWED_STATUSES.includes(req.query.status)) {
        return res.status(400).json({ success: false, message: 'Statut invalide' });
      }
      where.status = req.query.status;
    }

    const rows = await Intervention.findAll({
      where,
      include: buildAgentInclude(),
      order: [['created_at', 'DESC']]
    });

    const data = rows.map(formatIntervention);

    res.json({ success: true, data });
  } catch (error) {
    logger.error(`Erreur listMyInterventions: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des interventions'
    });
  }
};

/**
 * Include plus détaillé pour la vue d'une intervention (toutes les photos).
 */
function buildAgentDetailInclude() {
  return [
    {
      model: Report,
      as: 'report',
      attributes: [
        'id', 'title', 'description', 'status', 'address',
        'latitude', 'longitude', 'is_anonymous', 'category_id',
        'municipality_id', 'citizen_id', 'created_at'
      ],
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'color'] },
        { model: User, as: 'citizen', attributes: ['id', 'full_name'], required: false },
        {
          model: ReportPhoto,
          as: 'photos',
          attributes: ['id', 'photo_url', 'upload_order'],
          required: false,
          separate: true,
          order: [['upload_order', 'ASC']]
        }
      ]
    }
  ];
}

/**
 * GET /api/agent/interventions/:id
 * Détail d'une intervention assignée à l'agent.
 */
exports.getMyIntervention = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const intervention = await Intervention.findByPk(id, {
      include: buildAgentDetailInclude()
    });

    if (!intervention || intervention.agent_id !== req.userId) {
      return res.status(404).json({ success: false, message: 'Intervention introuvable' });
    }

    const data = intervention.toJSON();
    if (data.report) {
      if (data.report.is_anonymous) {
        data.report.citizen = null;
        data.report.citizen_display_name = null;
      } else if (data.report.citizen) {
        data.report.citizen_display_name = data.report.citizen.full_name || null;
      } else {
        data.report.citizen_display_name = null;
      }
      const photos = Array.isArray(data.report.photos) ? data.report.photos : [];
      data.report.thumbnail_url = photos.length > 0 ? photos[0].photo_url : null;
    }

    res.json({ success: true, data });
  } catch (error) {
    logger.error(`Erreur getMyIntervention: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'intervention'
    });
  }
};

/**
 * POST /api/agent/interventions/:id/photos
 * Upload d'une photo liée au rapport de l'intervention.
 * Multer middleware pose req.file ; ce handler se contente d'insérer en base.
 */
exports.uploadInterventionPhoto = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) {
      if (req.file) {
        await uploadService.deleteFile(uploadService.getPhotoUrl(req.file.filename)).catch(() => {});
      }
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const intervention = await Intervention.findByPk(id);
    if (!intervention || intervention.agent_id !== req.userId) {
      if (req.file) {
        await uploadService.deleteFile(uploadService.getPhotoUrl(req.file.filename)).catch(() => {});
      }
      return res.status(404).json({ success: false, message: 'Intervention introuvable' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucun fichier uploadé' });
    }

    const photoUrl = uploadService.getPhotoUrl(req.file.filename);

    const photo = await ReportPhoto.create({
      report_id: intervention.report_id,
      photo_url: photoUrl
    });

    res.status(201).json({
      success: true,
      message: 'Photo uploadée avec succès',
      url: photoUrl,
      photo: {
        id: photo.id,
        photo_url: photo.photo_url,
        upload_order: photo.upload_order
      }
    });
  } catch (error) {
    if (req.file) {
      await uploadService.deleteFile(uploadService.getPhotoUrl(req.file.filename)).catch(() => {});
    }
    logger.error(`Erreur uploadInterventionPhoto: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload de la photo'
    });
  }
};

/**
 * PATCH /api/agent/interventions/:id
 * Met à jour le status et/ou les notes d'une intervention dont l'agent est propriétaire.
 */
exports.updateMyIntervention = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const intervention = await Intervention.findByPk(id);
    if (!intervention || intervention.agent_id !== req.userId) {
      return res.status(404).json({ success: false, message: 'Intervention introuvable' });
    }

    if (intervention.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cette intervention a été annulée et ne peut plus être modifiée'
      });
    }

    const { status, notes, cost, started_at, completed_at } = req.body;
    const updates = {};

    if (status !== undefined) {
      if (!AGENT_ALLOWED_TARGETS.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Statut non autorisé pour un agent'
        });
      }
      updates.status = status;
      if (status === 'in_progress' && !intervention.started_at) {
        updates.started_at = new Date();
      }
      if (status === 'completed' && !intervention.completed_at) {
        updates.completed_at = new Date();
      }
    }

    if (notes !== undefined) updates.notes = notes;

    if (started_at !== undefined) {
      const d = started_at ? new Date(started_at) : null;
      if (started_at && isNaN(d.getTime())) {
        return res.status(400).json({ success: false, message: 'started_at invalide' });
      }
      updates.started_at = d;
    }
    if (completed_at !== undefined) {
      const d = completed_at ? new Date(completed_at) : null;
      if (completed_at && isNaN(d.getTime())) {
        return res.status(400).json({ success: false, message: 'completed_at invalide' });
      }
      updates.completed_at = d;
    }
    if (cost !== undefined) {
      const n = cost === null || cost === '' ? null : Number(cost);
      if (n !== null && (Number.isNaN(n) || n < 0)) {
        return res.status(400).json({ success: false, message: 'cost invalide' });
      }
      updates.cost = n;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun champ à modifier' });
    }

    await intervention.update(updates);
    // Le statut du signalement est dérivé par le hook Intervention.afterUpdate.

    const full = await Intervention.findByPk(intervention.id, {
      include: buildAgentInclude()
    });

    res.json({
      success: true,
      message: 'Intervention mise à jour avec succès',
      data: formatIntervention(full)
    });
  } catch (error) {
    logger.error(`Erreur updateMyIntervention: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'intervention'
    });
  }
};
