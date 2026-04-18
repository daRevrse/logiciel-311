/**
 * Contrôleur Agent Admin
 * CRUD des agents (role='agent') scopé à la municipalité de l'admin connecté.
 *
 * Endpoints :
 * - GET    /api/admin/agents        - Liste paginée des agents
 * - POST   /api/admin/agents        - Créer un agent (mot de passe temporaire)
 * - PATCH  /api/admin/agents/:id    - Mettre à jour nom / specializations
 * - DELETE /api/admin/agents/:id    - Désactiver (soft delete via is_active)
 */

const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { User, Category } = require('../models');
const logger = require('../utils/logger');
const mailService = require('../services/mailService');

const AGENT_ATTRIBUTES = [
  'id',
  'email',
  'phone',
  'full_name',
  'role',
  'specializations',
  'is_active',
  'last_login',
  'municipality_id',
  'created_at',
  'updated_at'
];

/**
 * Échappe les caractères HTML sensibles pour interpolation sûre dans un body HTML.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Génère un mot de passe temporaire (16 chars, alphanum URL-safe).
 */
function generateTempPassword() {
  return crypto.randomBytes(12).toString('base64').replace(/[+/=]/g, '').slice(0, 16);
}

/**
 * Charge les catégories de la municipalité correspondant aux IDs fournis.
 * Retourne { valid: bool, categories: [] }. Invalide si un ID n'appartient
 * pas à la municipalité.
 */
async function validateSpecializations(specializations, municipalityId) {
  if (!Array.isArray(specializations)) {
    return { valid: false, message: 'specializations doit être un tableau' };
  }
  if (specializations.length === 0) {
    return { valid: true, categories: [] };
  }
  if (!specializations.every((v) => Number.isInteger(v) && v > 0)) {
    return { valid: false, message: 'specializations doit contenir uniquement des entiers positifs' };
  }

  const categories = await Category.findAll({
    where: {
      id: { [Op.in]: specializations },
      municipality_id: municipalityId
    }
  });

  if (categories.length !== specializations.length) {
    return {
      valid: false,
      message: 'Une ou plusieurs catégories sont introuvables dans cette municipalité'
    };
  }

  return { valid: true, categories };
}

/**
 * Formate un agent pour la réponse (sans password_hash, avec specialization_details).
 */
function formatAgent(agent, categoriesById) {
  const specializations = agent.specializations || [];
  const details = categoriesById
    ? specializations.map((id) => {
        const cat = categoriesById.get(id);
        return cat
          ? { id: cat.id, name: cat.name, icon: cat.icon, color: cat.color }
          : { id, name: null };
      })
    : undefined;

  const out = {
    id: agent.id,
    email: agent.email,
    phone: agent.phone,
    full_name: agent.full_name,
    role: agent.role,
    specializations,
    is_active: agent.is_active,
    last_login: agent.last_login,
    municipality_id: agent.municipality_id,
    created_at: agent.created_at,
    updated_at: agent.updated_at
  };
  if (details) out.specialization_details = details;
  return out;
}

/**
 * GET /api/admin/agents
 */
exports.listAgents = async (req, res) => {
  try {
    const municipalityId = req.municipalityId;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const { rows, count } = await User.findAndCountAll({
      where: { role: 'agent', municipality_id: municipalityId },
      attributes: AGENT_ATTRIBUTES,
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    // Collecte des IDs de catégories pour résolution en un seul SELECT
    const categoryIds = new Set();
    rows.forEach((agent) => {
      (agent.specializations || []).forEach((id) => categoryIds.add(id));
    });

    const categoriesById = new Map();
    if (categoryIds.size > 0) {
      const categories = await Category.findAll({
        where: {
          id: { [Op.in]: Array.from(categoryIds) },
          municipality_id: municipalityId
        },
        attributes: ['id', 'name', 'icon', 'color']
      });
      categories.forEach((c) => categoriesById.set(c.id, c));
    }

    res.json({
      success: true,
      data: rows.map((agent) => formatAgent(agent, categoriesById)),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    logger.error(`Erreur listAgents: ${error.message}`, { error });
    res.status(500).json({ success: false, message: 'Erreur lors de la récupération des agents' });
  }
};

/**
 * POST /api/admin/agents
 * Body: { email, full_name, specializations: [categoryId], phone? }
 */
exports.createAgent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: errors.array()
      });
    }

    const municipalityId = req.municipalityId;
    const { email, phone, specializations = [] } = req.body;
    // Accepte `full_name` ou `name` (fallback)
    const full_name = req.body.full_name || req.body.name;

    if (!full_name) {
      return res.status(400).json({
        success: false,
        message: 'full_name (ou name) requis'
      });
    }

    // Unicité email (global — la colonne email n'est pas scoped)
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Validation specializations
    const specCheck = await validateSpecializations(specializations, municipalityId);
    if (!specCheck.valid) {
      return res.status(400).json({ success: false, message: specCheck.message });
    }

    // Création
    const tempPassword = generateTempPassword();
    const agent = User.build({
      municipality_id: municipalityId,
      email,
      phone: phone || null,
      full_name,
      role: 'agent',
      specializations,
      is_active: true
    });
    await agent.setPassword(tempPassword);
    try {
      await agent.save();
    } catch (saveErr) {
      if (saveErr && saveErr.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ success: false, message: 'Email déjà utilisé' });
      }
      throw saveErr;
    }

    logger.info(`Agent créé: ${agent.full_name} (id=${agent.id}) municipalité=${municipalityId}`);

    // Envoi email d'invitation
    const mailResult = await mailService.sendMail({
      to: email,
      subject: 'Invitation à rejoindre la plateforme (agent)',
      text: `Bonjour ${full_name},\n\nUn compte agent a été créé pour vous.\nEmail: ${email}\nMot de passe temporaire: ${tempPassword}\n\nMerci de le changer dès votre première connexion.`,
      html: `<p>Bonjour <strong>${escapeHtml(full_name)}</strong>,</p>
<p>Un compte agent a été créé pour vous.</p>
<ul>
  <li>Email: <strong>${escapeHtml(email)}</strong></li>
  <li>Mot de passe temporaire: <code>${tempPassword}</code></li>
</ul>
<p>Merci de le changer dès votre première connexion.</p>`
    });

    // Catégories pour réponse
    const categoriesById = new Map();
    specCheck.categories.forEach((c) => categoriesById.set(c.id, c));

    const response = {
      success: true,
      message: 'Agent créé avec succès',
      data: formatAgent(agent, categoriesById)
    };

    // TODO: retirer ce fallback une fois SMTP configuré en prod. Si l'email
    // n'a pas pu être envoyé (SMTP non configuré), on retourne le mot de
    // passe temporaire pour ne pas bloquer le dev/onboarding.
    if (!mailResult.sent) {
      logger.warn(`[agents] invitation non envoyée à ${email}: ${mailResult.reason}`);
      if (process.env.NODE_ENV !== 'production') {
        response.temp_password = tempPassword;
        response.mail_warning = `Email non envoyé (${mailResult.reason}). Mot de passe temporaire retourné pour usage manuel.`;
      } else {
        response.mail_warning = `Email non envoyé (${mailResult.reason}). Veuillez déclencher une réinitialisation de mot de passe pour cet agent.`;
      }
    }

    res.status(201).json(response);
  } catch (error) {
    logger.error(`Erreur createAgent: ${error.message}`, { error });
    res.status(500).json({ success: false, message: 'Erreur lors de la création de l\'agent' });
  }
};

/**
 * PATCH /api/admin/agents/:id
 */
exports.updateAgent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: errors.array()
      });
    }

    const municipalityId = req.municipalityId;
    const agentId = parseInt(req.params.id, 10);

    const agent = await User.findOne({
      where: { id: agentId, role: 'agent', municipality_id: municipalityId }
    });

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent introuvable' });
    }

    const { specializations } = req.body;
    const full_name = req.body.full_name || req.body.name;
    const updates = {};

    if (full_name !== undefined) updates.full_name = full_name;

    let categoriesById;
    if (specializations !== undefined) {
      const specCheck = await validateSpecializations(specializations, municipalityId);
      if (!specCheck.valid) {
        return res.status(400).json({ success: false, message: specCheck.message });
      }
      updates.specializations = specializations;
      categoriesById = new Map();
      specCheck.categories.forEach((c) => categoriesById.set(c.id, c));
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun champ à modifier' });
    }

    await agent.update(updates);
    logger.info(`Agent mis à jour: id=${agent.id} municipalité=${municipalityId}`);

    // Si specializations non touchées, résoudre quand même pour la réponse
    if (!categoriesById) {
      const ids = agent.specializations || [];
      categoriesById = new Map();
      if (ids.length > 0) {
        const cats = await Category.findAll({
          where: { id: { [Op.in]: ids }, municipality_id: municipalityId },
          attributes: ['id', 'name', 'icon', 'color']
        });
        cats.forEach((c) => categoriesById.set(c.id, c));
      }
    }

    res.json({
      success: true,
      message: 'Agent mis à jour avec succès',
      data: formatAgent(agent, categoriesById)
    });
  } catch (error) {
    logger.error(`Erreur updateAgent: ${error.message}`, { error });
    res.status(500).json({ success: false, message: 'Erreur lors de la mise à jour de l\'agent' });
  }
};

/**
 * DELETE /api/admin/agents/:id
 * Soft delete via is_active=false (le modèle User n'est pas paranoid).
 */
exports.deleteAgent = async (req, res) => {
  try {
    const municipalityId = req.municipalityId;
    const agentId = parseInt(req.params.id, 10);

    if (agentId === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas désactiver votre propre compte'
      });
    }

    const agent = await User.findOne({
      where: { id: agentId, role: 'agent', municipality_id: municipalityId }
    });

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent introuvable' });
    }

    await agent.update({ is_active: false });
    logger.info(`Agent désactivé: id=${agent.id} municipalité=${municipalityId}`);

    res.json({ success: true, message: 'Agent désactivé avec succès' });
  } catch (error) {
    logger.error(`Erreur deleteAgent: ${error.message}`, { error });
    res.status(500).json({ success: false, message: 'Erreur lors de la désactivation de l\'agent' });
  }
};
