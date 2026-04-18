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
  ReportPhoto
} = require('../models');
const logger = require('../utils/logger');
const uploadService = require('../services/uploadService');

const ALLOWED_STATUSES = ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'];
// Transitions autorisées pour l'agent (il ne peut pas annuler).
const AGENT_ALLOWED_TARGETS = ['pending', 'in_progress', 'completed'];

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

    const { status, notes } = req.body;
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

    if (notes !== undefined) {
      updates.notes = notes;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun champ à modifier' });
    }

    await intervention.update(updates);

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
