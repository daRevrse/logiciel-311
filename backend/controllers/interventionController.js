/**
 * Contrôleur Interventions (Admin)
 *
 * Endpoints scopés à la municipalité de l'admin connecté :
 *  - GET    /api/admin/interventions       Liste paginée + filtres
 *  - GET    /api/admin/interventions/:id   Détail
 *  - POST   /api/admin/interventions       Créer (assigner un agent à un signalement)
 *  - PATCH  /api/admin/interventions/:id   Mise à jour (statut, notes, reassign)
 *
 *  + GET /api/admin/agents/suggest?report_id=  (exposé via le controller agent-admin)
 *    — voir exports.suggestAgents ci-dessous.
 */

const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const {
  Intervention,
  Report,
  User,
  Category,
  sequelize
} = require('../models');
const logger = require('../utils/logger');

const ALLOWED_STATUSES = ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'];
const ACTIVE_STATUSES = ['pending', 'scheduled', 'in_progress'];

/**
 * Relations standard pour les réponses.
 */
function buildInclude() {
  return [
    {
      model: Report,
      as: 'report',
      attributes: ['id', 'title', 'status', 'municipality_id', 'category_id', 'citizen_id', 'address'],
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'color'] },
        { model: User, as: 'citizen', attributes: ['id', 'full_name', 'email'], required: false }
      ]
    },
    { model: User, as: 'agent', attributes: ['id', 'full_name', 'email'], required: false },
    { model: User, as: 'assigner', attributes: ['id', 'full_name', 'email'], required: false }
  ];
}

/**
 * GET /api/admin/interventions
 */
exports.listInterventions = async (req, res) => {
  try {
    const municipalityId = req.municipalityId;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const where = {};
    if (req.query.status) {
      if (!ALLOWED_STATUSES.includes(req.query.status)) {
        return res.status(400).json({ success: false, message: 'Statut invalide' });
      }
      where.status = req.query.status;
    }
    if (req.query.agent_id) {
      const agentId = parseInt(req.query.agent_id, 10);
      if (!Number.isInteger(agentId) || agentId < 1) {
        return res.status(400).json({ success: false, message: 'agent_id invalide' });
      }
      where.agent_id = agentId;
    }

    const reportWhere = { municipality_id: municipalityId };
    if (req.query.category_id) {
      const categoryId = parseInt(req.query.category_id, 10);
      if (!Number.isInteger(categoryId) || categoryId < 1) {
        return res.status(400).json({ success: false, message: 'category_id invalide' });
      }
      reportWhere.category_id = categoryId;
    }

    const include = buildInclude();
    // Contrainte de scope sur le rapport : required=true pour filtrer au niveau SQL.
    include[0].where = reportWhere;
    include[0].required = true;

    const { rows, count } = await Intervention.findAndCountAll({
      where,
      include,
      order: [['created_at', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error(`Erreur listInterventions: ${error.message}`, { error });
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des interventions' });
  }
};

/**
 * GET /api/admin/interventions/:id
 */
exports.getIntervention = async (req, res) => {
  try {
    const municipalityId = req.municipalityId;
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const intervention = await Intervention.findByPk(id, { include: buildInclude() });
    if (!intervention || !intervention.report || intervention.report.municipality_id !== municipalityId) {
      return res.status(404).json({ success: false, message: 'Intervention introuvable' });
    }

    res.json({ success: true, data: intervention });
  } catch (error) {
    logger.error(`Erreur getIntervention: ${error.message}`, { error });
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération de l\'intervention' });
  }
};

/**
 * POST /api/admin/interventions
 */
exports.createIntervention = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Erreur de validation', errors: errors.array() });
    }

    const municipalityId = req.municipalityId;
    const { report_id, agent_id, scheduled_at, notes } = req.body;

    const report = await Report.findByPk(report_id);
    if (!report || report.municipality_id !== municipalityId) {
      return res.status(404).json({ success: false, message: 'Signalement introuvable dans cette municipalité' });
    }

    const agent = await User.findByPk(agent_id);
    if (!agent || agent.role !== 'agent' || agent.municipality_id !== municipalityId) {
      return res.status(400).json({ success: false, message: 'Agent invalide pour cette municipalité' });
    }
    if (agent.is_active === false) {
      return res.status(400).json({ success: false, message: 'Agent inactif' });
    }

    const intervention = await Intervention.create({
      report_id,
      agent_id,
      assigned_by: req.userId,
      status: 'pending',
      scheduled_at: scheduled_at || null,
      notes: notes || null
    });

    const full = await Intervention.findByPk(intervention.id, { include: buildInclude() });

    res.status(201).json({
      success: true,
      message: 'Intervention créée avec succès',
      data: full
    });
  } catch (error) {
    logger.error(`Erreur createIntervention: ${error.message}`, { error });
    res.status(500).json({ success: false, message: 'Erreur lors de la création de l\'intervention' });
  }
};

/**
 * PATCH /api/admin/interventions/:id
 */
exports.updateIntervention = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Erreur de validation', errors: errors.array() });
    }

    const municipalityId = req.municipalityId;
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const intervention = await Intervention.findByPk(id, {
      include: [{ model: Report, as: 'report', attributes: ['id', 'municipality_id'] }]
    });
    if (!intervention || !intervention.report || intervention.report.municipality_id !== municipalityId) {
      return res.status(404).json({ success: false, message: 'Intervention introuvable' });
    }

    const { status, notes, scheduled_at, agent_id } = req.body;
    const updates = {};

    if (status !== undefined) {
      if (!ALLOWED_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, message: 'Statut invalide' });
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
    if (scheduled_at !== undefined) updates.scheduled_at = scheduled_at || null;

    if (agent_id !== undefined) {
      const agent = await User.findByPk(agent_id);
      if (!agent || agent.role !== 'agent' || agent.municipality_id !== municipalityId) {
        return res.status(400).json({ success: false, message: 'Agent invalide pour cette municipalité' });
      }
      if (agent.is_active === false) {
        return res.status(400).json({ success: false, message: 'Agent inactif' });
      }
      updates.agent_id = agent_id;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun champ à modifier' });
    }

    await intervention.update(updates);
    const full = await Intervention.findByPk(intervention.id, { include: buildInclude() });

    res.json({
      success: true,
      message: 'Intervention mise à jour avec succès',
      data: full
    });
  } catch (error) {
    logger.error(`Erreur updateIntervention: ${error.message}`, { error });
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de l\'intervention' });
  }
};

/**
 * GET /api/admin/agents/suggest?report_id=
 *
 * Retourne les agents de la municipalité spécialisés sur la catégorie du
 * rapport, triés ascendant par charge active.
 *
 * NOTE : monté sur `/api/admin/agents/suggest` via agent-admin.routes.js
 * (sous-chemin `agents` — plus naturel puisqu'on parle d'agents) ; voir
 * README/commit pour la décision.
 */
exports.suggestAgents = async (req, res) => {
  try {
    const municipalityId = req.municipalityId;
    const reportId = parseInt(req.query.report_id, 10);
    if (!Number.isInteger(reportId) || reportId < 1) {
      return res.status(400).json({ success: false, message: 'report_id requis' });
    }

    const report = await Report.findByPk(reportId);
    if (!report || report.municipality_id !== municipalityId) {
      return res.status(404).json({ success: false, message: 'Signalement introuvable dans cette municipalité' });
    }

    const categoryId = report.category_id;

    // Trouver les agents avec cette catégorie dans specializations (array JSONB/JSON).
    // On filtre en JS après un SELECT côté municipalité — la taille du jeu est
    // bornée par le nombre d'agents par mairie.
    const agents = await User.findAll({
      where: { role: 'agent', municipality_id: municipalityId, is_active: true },
      attributes: ['id', 'email', 'full_name', 'phone', 'specializations']
    });

    const specialized = agents.filter((a) => {
      const specs = Array.isArray(a.specializations) ? a.specializations : [];
      return specs.includes(categoryId);
    });

    if (specialized.length === 0) {
      return res.json({ success: true, data: [] });
    }

    // Calcul de la charge active pour chaque agent spécialisé.
    const ids = specialized.map((a) => a.id);
    const counts = await Intervention.findAll({
      attributes: [
        'agent_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'workload']
      ],
      where: {
        agent_id: { [Op.in]: ids },
        status: { [Op.in]: ACTIVE_STATUSES }
      },
      group: ['agent_id']
    });

    const workloadById = new Map();
    counts.forEach((c) => {
      workloadById.set(c.get('agent_id'), parseInt(c.get('workload'), 10) || 0);
    });

    const results = specialized
      .map((a) => ({
        id: a.id,
        email: a.email,
        full_name: a.full_name,
        phone: a.phone,
        specializations: a.specializations || [],
        workload: workloadById.get(a.id) || 0,
        is_specialized: true
      }))
      .sort((a, b) => a.workload - b.workload);

    res.json({ success: true, data: results });
  } catch (error) {
    logger.error(`Erreur suggestAgents: ${error.message}`, { error });
    res.status(500).json({ success: false, message: 'Erreur lors de la suggestion d\'agents' });
  }
};
