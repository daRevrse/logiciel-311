/**
 * Contrôleur Admin
 * Gère les endpoints réservés aux administrateurs
 *
 * Endpoints :
 * - PUT /api/admin/reports/:id/status - Changer statut
 * - POST /api/admin/reports/:id/notes - Ajouter note
 * - GET /api/admin/reports/:id/history - Voir historique
 * - POST /api/admin/reports/:id/assign - Assigner signalement
 * - DELETE /api/admin/reports/:id/assign - Retirer assignation
 * - GET /api/admin/dashboard/stats - Statistiques dashboard
 * - GET /api/admin/reports/assigned - Mes signalements assignés
 * - GET /api/admin/users/admins - Liste admins municipalité
 * - GET /api/admin/categories - Liste catégories
 * - POST /api/admin/categories - Créer catégorie
 * - PUT /api/admin/categories/:id - Modifier catégorie
 * - DELETE /api/admin/categories/:id - Supprimer catégorie
 * - POST /api/admin/users - Créer utilisateur admin
 * - PUT /api/admin/users/:id - Modifier utilisateur
 * - DELETE /api/admin/users/:id - Désactiver utilisateur
 */

const adminService = require('../services/adminService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const { Category, User, Municipality } = require('../models');

/**
 * Champs autorisés pour la mise à jour des settings municipalité (admin)
 */
const MUNICIPALITY_SETTINGS_FIELDS = [
  'logo_url',
  'banner_url',
  'primary_color',
  'secondary_color',
  'display_name',
  'public_description',
  'address',
  'contact_phone',
  'contact_email',
  'public_hours',
  'priority_support_threshold'
];

/**
 * Changer le statut d'un signalement
 * PUT /api/admin/reports/:id/status
 *
 * Authentification : Requise (admin/super_admin)
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.changeStatus = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: errors.array()
      });
    }

    const reportId = parseInt(req.params.id);
    const { status, comment } = req.body;
    const adminId = req.userId;
    const municipalityId = req.municipalityId;

    const result = await adminService.changeReportStatus(
      reportId,
      status,
      adminId,
      municipalityId,
      comment
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(`✅ Status changé par admin ${adminId}: Signalement ${reportId} → ${status}`);

    res.json(result);

  } catch (error) {
    logger.error(`Erreur changeStatus controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du changement de statut'
    });
  }
};

/**
 * Ajouter une note interne admin
 * POST /api/admin/reports/:id/notes
 *
 * Authentification : Requise (admin/super_admin)
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.addNote = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: errors.array()
      });
    }

    const reportId = parseInt(req.params.id);
    const { note } = req.body;
    const adminId = req.userId;
    const municipalityId = req.municipalityId;

    const result = await adminService.addAdminNote(
      reportId,
      adminId,
      municipalityId,
      note
    );

    if (!result.success) {
      return res.status(404).json(result);
    }

    logger.info(`✅ Note ajoutée par admin ${adminId} sur signalement ${reportId}`);

    res.status(201).json(result);

  } catch (error) {
    logger.error(`Erreur addNote controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'ajout de la note'
    });
  }
};

/**
 * Obtenir l'historique complet d'un signalement
 * GET /api/admin/reports/:id/history
 *
 * Authentification : Requise (admin/super_admin)
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.getHistory = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const municipalityId = req.municipalityId;

    const result = await adminService.getReportHistory(reportId, municipalityId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);

  } catch (error) {
    logger.error(`Erreur getHistory controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération de l\'historique'
    });
  }
};

/**
 * Assigner un signalement à un admin
 * POST /api/admin/reports/:id/assign
 *
 * Authentification : Requise (admin/super_admin)
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.assignReport = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: errors.array()
      });
    }

    const reportId = parseInt(req.params.id);
    const { adminId: assignedAdminId } = req.body;
    const currentAdminId = req.userId;
    const municipalityId = req.municipalityId;

    const result = await adminService.assignReport(
      reportId,
      assignedAdminId,
      currentAdminId,
      municipalityId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(`✅ Signalement ${reportId} assigné à admin ${assignedAdminId} par admin ${currentAdminId}`);

    res.json(result);

  } catch (error) {
    logger.error(`Erreur assignReport controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'assignation'
    });
  }
};

/**
 * Retirer l'assignation d'un signalement
 * DELETE /api/admin/reports/:id/assign
 *
 * Authentification : Requise (admin/super_admin)
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.unassignReport = async (req, res) => {
  try {
    const reportId = parseInt(req.params.id);
    const adminId = req.userId;
    const municipalityId = req.municipalityId;

    const result = await adminService.unassignReport(
      reportId,
      adminId,
      municipalityId
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    logger.info(`✅ Assignation retirée: Signalement ${reportId} par admin ${adminId}`);

    res.json(result);

  } catch (error) {
    logger.error(`Erreur unassignReport controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors du retrait de l\'assignation'
    });
  }
};

/**
 * Obtenir les statistiques du dashboard admin
 * GET /api/admin/dashboard/stats
 *
 * Authentification : Requise (admin/super_admin)
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const municipalityId = req.municipalityId;

    const filters = {
      dateFrom: req.query.dateFrom || null,
      dateTo: req.query.dateTo || null
    };

    const result = await adminService.getDashboardStats(municipalityId, filters);

    res.json(result);

  } catch (error) {
    logger.error(`Erreur getDashboardStats controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des statistiques'
    });
  }
};

/**
 * Obtenir les signalements assignés à l'admin connecté
 * GET /api/admin/reports/assigned
 *
 * Authentification : Requise (admin/super_admin)
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.getMyAssignedReports = async (req, res) => {
  try {
    const adminId = req.userId;
    const municipalityId = req.municipalityId;

    const options = {
      status: req.query.status || null,
      page: parseInt(req.query.page) || 1,
      limit: Math.min(parseInt(req.query.limit) || 20, 100)
    };

    const result = await adminService.getMyAssignedReports(
      adminId,
      municipalityId,
      options
    );

    res.json(result);

  } catch (error) {
    logger.error(`Erreur getMyAssignedReports controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des signalements'
    });
  }
};

/**
 * Obtenir la liste des admins de la municipalité
 * GET /api/admin/users/admins
 *
 * Authentification : Requise (admin/super_admin)
 * Validation licence : Requise
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.getMunicipalityAdmins = async (req, res) => {
  try {
    const municipalityId = req.municipalityId;

    const result = await adminService.getMunicipalityAdmins(municipalityId);

    res.json(result);

  } catch (error) {
    logger.error(`Erreur getMunicipalityAdmins controller: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la récupération des administrateurs'
    });
  }
};

// ============================================
// GESTION DES CATÉGORIES
// ============================================

/**
 * Obtenir toutes les catégories de la municipalité
 * GET /api/admin/categories
 */
exports.getCategories = async (req, res) => {
  try {
    const municipalityId = req.municipalityId;

    const categories = await Category.findAll({
      where: { municipality_id: municipalityId },
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    logger.error(`Erreur getCategories: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories'
    });
  }
};

/**
 * Créer une nouvelle catégorie
 * POST /api/admin/categories
 */
exports.createCategory = async (req, res) => {
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
    const { name, description, icon, color, active } = req.body;

    const category = await Category.create({
      municipality_id: municipalityId,
      name,
      description,
      icon: icon || 'map-pin',
      color: color || '#3B82F6',
      active: active !== undefined ? active : true
    });

    logger.info(`✅ Catégorie créée: ${category.name} (ID: ${category.id})`);

    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès',
      data: category
    });

  } catch (error) {
    logger.error(`Erreur createCategory: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la catégorie'
    });
  }
};

/**
 * Modifier une catégorie
 * PUT /api/admin/categories/:id
 */
exports.updateCategory = async (req, res) => {
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
    const categoryId = parseInt(req.params.id);
    const { name, description, icon, color, active } = req.body;

    const category = await Category.findOne({
      where: {
        id: categoryId,
        municipality_id: municipalityId
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie introuvable'
      });
    }

    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description,
      icon: icon || category.icon,
      color: color || category.color,
      active: active !== undefined ? active : category.active
    });

    logger.info(`✅ Catégorie modifiée: ${category.name} (ID: ${category.id})`);

    res.json({
      success: true,
      message: 'Catégorie modifiée avec succès',
      data: category
    });

  } catch (error) {
    logger.error(`Erreur updateCategory: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de la catégorie'
    });
  }
};

/**
 * Supprimer une catégorie
 * DELETE /api/admin/categories/:id
 */
exports.deleteCategory = async (req, res) => {
  try {
    const municipalityId = req.municipalityId;
    const categoryId = parseInt(req.params.id);

    const category = await Category.findOne({
      where: {
        id: categoryId,
        municipality_id: municipalityId
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie introuvable'
      });
    }

    // Désactiver plutôt que supprimer
    await category.update({ active: false });

    logger.info(`✅ Catégorie désactivée: ${category.name} (ID: ${category.id})`);

    res.json({
      success: true,
      message: 'Catégorie désactivée avec succès'
    });

  } catch (error) {
    logger.error(`Erreur deleteCategory: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la catégorie'
    });
  }
};

// ============================================
// GESTION DES UTILISATEURS
// ============================================

/**
 * Créer un nouvel utilisateur admin
 * POST /api/admin/users
 */
exports.createUser = async (req, res) => {
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
    const { email, phone, full_name, role } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      where: { phone, municipality_id: municipalityId }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec ce numéro de téléphone existe déjà'
      });
    }

    const user = await User.create({
      municipality_id: municipalityId,
      email,
      phone,
      full_name,
      role: role || 'admin',
      is_active: true
    });

    logger.info(`✅ Utilisateur créé: ${user.full_name} (${user.role})`);

    // Ne pas retourner les données sensibles
    const userResponse = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at
    };

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: userResponse
    });

  } catch (error) {
    logger.error(`Erreur createUser: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur'
    });
  }
};

/**
 * Modifier un utilisateur
 * PUT /api/admin/users/:id
 */
exports.updateUser = async (req, res) => {
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
    const userId = parseInt(req.params.id);
    const { email, full_name, role, is_active } = req.body;

    const user = await User.findOne({
      where: {
        id: userId,
        municipality_id: municipalityId
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    await user.update({
      email: email || user.email,
      full_name: full_name || user.full_name,
      role: role || user.role,
      is_active: is_active !== undefined ? is_active : user.is_active
    });

    logger.info(`✅ Utilisateur modifié: ${user.full_name} (ID: ${user.id})`);

    const userResponse = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at
    };

    res.json({
      success: true,
      message: 'Utilisateur modifié avec succès',
      data: userResponse
    });

  } catch (error) {
    logger.error(`Erreur updateUser: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de l\'utilisateur'
    });
  }
};

/**
 * Désactiver un utilisateur
 * DELETE /api/admin/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const municipalityId = req.municipalityId;
    const userId = parseInt(req.params.id);

    // Ne pas permettre de se désactiver soi-même
    if (userId === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'Vous ne pouvez pas désactiver votre propre compte'
      });
    }

    const user = await User.findOne({
      where: {
        id: userId,
        municipality_id: municipalityId
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur introuvable'
      });
    }

    await user.update({ is_active: false });

    logger.info(`✅ Utilisateur désactivé: ${user.full_name} (ID: ${user.id})`);

    res.json({
      success: true,
      message: 'Utilisateur désactivé avec succès'
    });

  } catch (error) {
    logger.error(`Erreur deleteUser: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation de l\'utilisateur'
    });
  }
};

/**
 * Obtenir tous les utilisateurs de la municipalité
 * GET /api/admin/users
 */
exports.getUsers = async (req, res) => {
  try {
    const municipalityId = req.municipalityId;

    const users = await User.findAll({
      where: { municipality_id: municipalityId },
      attributes: ['id', 'email', 'phone', 'full_name', 'role', 'is_active', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    logger.error(`Erreur getUsers: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    });
  }
};

// ============================================
// GESTION DES MUNICIPALITÉS (SUPER ADMIN)
// ============================================

/**
 * Obtenir toutes les municipalités
 * GET /api/admin/municipalities
 *
 * Authentification : Requise (super_admin uniquement)
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.getMunicipalities = async (req, res) => {
  try {
    const { Municipality, License } = require('../models');

    const municipalities = await Municipality.findAll({
      include: [
        {
          model: License,
          as: 'license',
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: municipalities,
      count: municipalities.length
    });

  } catch (error) {
    logger.error(`Erreur getMunicipalities: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des municipalités'
    });
  }
};

/**
 * Créer une nouvelle municipalité
 * POST /api/admin/municipalities
 *
 * Authentification : Requise (super_admin uniquement)
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.createMunicipality = async (req, res) => {
  const crypto = require('crypto');
  const bcrypt = require('bcrypt');
  const { sequelize, Municipality, License, User } = require('../models');
  const { sanitizeFeatures } = require('../config/modules');
  const mailService = require('../services/mailService');
  const { generateUniqueSlug } = require('../utils/slug');

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: errors.array()
      });
    }

    const {
      name,
      region,
      country,
      contact_email,
      contact_phone,
      address,
      is_active,
      license_duration_years,
      max_users,
      max_admins,
      modules,
      admin_user
    } = req.body;

    if (!admin_user || !admin_user.email || !admin_user.full_name || !admin_user.phone) {
      return res.status(400).json({
        success: false,
        message: 'Les informations du premier administrateur (full_name, email, phone) sont requises'
      });
    }

    const existing = await User.findOne({ where: { email: admin_user.email } });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Un utilisateur avec l'email ${admin_user.email} existe déjà`
      });
    }

    const licenseYears = license_duration_years || 1;
    const issuedAt = new Date();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + licenseYears);

    const features = sanitizeFeatures(modules || {});

    const tempPassword = crypto.randomBytes(9).toString('base64').replace(/[+/=]/g, '').slice(0, 12);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    let licenseKey;
    for (let i = 0; i < 5; i++) {
      const candidate = License.generateKey();
      const found = await License.findOne({ where: { license_key: candidate } });
      if (!found) { licenseKey = candidate; break; }
    }

    const result = await sequelize.transaction(async (t) => {
      const license = await License.create({
        license_key: licenseKey,
        municipality_name: name,
        contact_email,
        contact_phone,
        issued_at: issuedAt,
        expires_at: expiresAt,
        max_users: max_users || 1000,
        max_admins: max_admins || 50,
        is_active: true,
        features
      }, { transaction: t });

      const slug = await generateUniqueSlug(Municipality, name);

      const municipality = await Municipality.create({
        license_id: license.id,
        name,
        slug,
        region,
        country,
        contact_email,
        contact_phone,
        address,
        is_active: is_active !== undefined ? is_active : true
      }, { transaction: t });

      const admin = await User.create({
        municipality_id: municipality.id,
        role: 'admin',
        full_name: admin_user.full_name,
        email: admin_user.email,
        phone: admin_user.phone,
        password_hash: passwordHash,
        is_active: true
      }, { transaction: t });

      return { license, municipality, admin };
    });

    const { license, municipality, admin } = result;

    const emailResult = await mailService.sendMail({
      to: admin.email,
      subject: `[Muno] Accès administrateur pour ${municipality.name}`,
      text:
        `Bonjour ${admin.full_name},\n\n` +
        `Un compte administrateur a été créé pour la mairie ${municipality.name} sur la plateforme Muno.\n\n` +
        `Email : ${admin.email}\n` +
        `Mot de passe temporaire : ${tempPassword}\n\n` +
        `Clé de licence : ${license.license_key}\n` +
        `Licence valable jusqu'au : ${new Date(license.expires_at).toLocaleDateString('fr-FR')}\n\n` +
        `Connectez-vous et changez votre mot de passe dès que possible.\n`,
      html:
        `<p>Bonjour <strong>${admin.full_name}</strong>,</p>` +
        `<p>Un compte administrateur a été créé pour la mairie <strong>${municipality.name}</strong> sur la plateforme Muno.</p>` +
        `<ul>` +
        `<li>Email : <code>${admin.email}</code></li>` +
        `<li>Mot de passe temporaire : <code>${tempPassword}</code></li>` +
        `<li>Clé de licence : <code>${license.license_key}</code></li>` +
        `<li>Licence valable jusqu'au : <strong>${new Date(license.expires_at).toLocaleDateString('fr-FR')}</strong></li>` +
        `</ul>` +
        `<p>Connectez-vous et changez votre mot de passe dès que possible.</p>`
    });

    logger.info(`Municipalité créée: ${municipality.name} (ID: ${municipality.id}) + admin ${admin.email}`);

    res.status(201).json({
      success: true,
      message: 'Municipalité, licence et administrateur créés avec succès',
      data: {
        municipality,
        license,
        admin: {
          id: admin.id,
          email: admin.email,
          full_name: admin.full_name,
          phone: admin.phone,
          temp_password: tempPassword
        },
        email_sent: emailResult.sent
      }
    });
  } catch (error) {
    logger.error(`Erreur createMunicipality: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la municipalité',
      error: error.message
    });
  }
};

/**
 * Modifier une municipalité
 * PUT /api/admin/municipalities/:id
 *
 * Authentification : Requise (super_admin uniquement)
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.updateMunicipality = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: errors.array()
      });
    }

    const { Municipality } = require('../models');
    const { generateUniqueSlug, slugify } = require('../utils/slug');
    const municipalityId = parseInt(req.params.id);
    const {
      name,
      slug: slugInput,
      region,
      country,
      contact_email,
      contact_phone,
      address,
      is_active
    } = req.body;

    const municipality = await Municipality.findByPk(municipalityId);

    if (!municipality) {
      return res.status(404).json({
        success: false,
        message: 'Municipalité non trouvée'
      });
    }

    let newSlug = municipality.slug;
    if (slugInput && slugify(slugInput) !== municipality.slug) {
      newSlug = await generateUniqueSlug(Municipality, slugInput, municipalityId);
    }

    await municipality.update({
      name: name || municipality.name,
      slug: newSlug,
      region: region || municipality.region,
      country: country || municipality.country,
      contact_email: contact_email || municipality.contact_email,
      contact_phone: contact_phone || municipality.contact_phone,
      address: address || municipality.address,
      is_active: is_active !== undefined ? is_active : municipality.is_active
    });

    logger.info(`Municipalité modifiée: ${municipality.name} (ID: ${municipality.id})`);

    res.json({
      success: true,
      message: 'Municipalité modifiée avec succès',
      data: municipality
    });

  } catch (error) {
    logger.error(`Erreur updateMunicipality: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la modification de la municipalité'
    });
  }
};

/**
 * Désactiver une municipalité
 * DELETE /api/admin/municipalities/:id
 *
 * Authentification : Requise (super_admin uniquement)
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.deleteMunicipality = async (req, res) => {
  try {
    const { Municipality } = require('../models');
    const municipalityId = parseInt(req.params.id);

    const municipality = await Municipality.findByPk(municipalityId);

    if (!municipality) {
      return res.status(404).json({
        success: false,
        message: 'Municipalité non trouvée'
      });
    }

    // Soft delete - désactivation uniquement
    await municipality.update({ is_active: false });

    logger.info(`Municipalité désactivée: ${municipality.name} (ID: ${municipality.id})`);

    res.json({
      success: true,
      message: 'Municipalité désactivée avec succès'
    });

  } catch (error) {
    logger.error(`Erreur deleteMunicipality: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation de la municipalité'
    });
  }
};

/**
 * Créer ou renouveler la licence d'une municipalité
 * POST /api/admin/municipalities/:id/license
 *
 * Authentification : Requise (super_admin uniquement)
 *
 * @param {Request} req - Requête Express
 * @param {Response} res - Réponse Express
 */
exports.createMunicipalityLicense = async (req, res) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: errors.array()
      });
    }

    const { Municipality, License } = require('../models');
    const municipalityId = parseInt(req.params.id);
    const {
      valid_until,
      max_users,
      max_reports_per_month,
      features
    } = req.body;

    const municipality = await Municipality.findByPk(municipalityId);

    if (!municipality) {
      return res.status(404).json({
        success: false,
        message: 'Municipalité non trouvée'
      });
    }

    // Désactiver l'ancienne licence si elle existe
    if (municipality.license_id) {
      await License.update(
        { is_active: false },
        { where: { id: municipality.license_id } }
      );
    }

    // Créer la nouvelle licence
    const license = await License.create({
      municipality_name: municipality.name,
      contact_email: municipality.contact_email,
      contact_phone: municipality.contact_phone,
      issued_at: new Date(),
      expires_at: valid_until,
      max_users: max_users || 1000,
      max_admins: 50,
      is_active: true,
      features: features || {
        notifications: true,
        map: true,
        statistics: true,
        export: true
      }
    });

    // Mettre à jour la municipalité avec la nouvelle licence
    await municipality.update({ license_id: license.id });

    logger.info(`Licence créée pour municipalité: ${municipality.name} (ID: ${municipality.id})`);

    res.status(201).json({
      success: true,
      message: 'Licence créée avec succès',
      data: license
    });

  } catch (error) {
    logger.error(`Erreur createMunicipalityLicense: ${error.message}`, { error });
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la licence'
    });
  }
};

/**
 * Statistiques globales (super admin uniquement) — vue cross-mairies.
 * GET /api/admin/global/stats
 */
exports.getGlobalStats = async (req, res) => {
  try {
    const { Municipality, License, Report, User, sequelize } = require('../models');

    const [
      municipalitiesTotal,
      municipalitiesActive,
      reportsTotal,
      reportsByStatusRaw,
      usersByRoleRaw,
      licensesActive,
      licensesExpiringSoon,
      topMunicipalitiesRaw
    ] = await Promise.all([
      Municipality.count(),
      Municipality.count({ where: { is_active: true } }),
      Report.count(),
      Report.findAll({
        attributes: ['status', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['status'],
        raw: true
      }),
      User.findAll({
        attributes: ['role', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['role'],
        raw: true
      }),
      License.count({ where: { is_active: true } }),
      License.count({
        where: {
          is_active: true,
          expires_at: {
            [require('sequelize').Op.between]: [
              new Date(),
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            ]
          }
        }
      }),
      Report.findAll({
        attributes: [
          'municipality_id',
          [sequelize.fn('COUNT', sequelize.col('Report.id')), 'count']
        ],
        include: [{ model: Municipality, as: 'municipality', attributes: ['id', 'name', 'slug'] }],
        group: ['municipality_id', 'municipality.id'],
        order: [[sequelize.literal('count'), 'DESC']],
        limit: 5,
        raw: false
      })
    ]);

    const reportsByStatus = Object.fromEntries(
      reportsByStatusRaw.map((r) => [r.status, parseInt(r.count, 10)])
    );
    const usersByRole = Object.fromEntries(
      usersByRoleRaw.map((r) => [r.role, parseInt(r.count, 10)])
    );

    res.json({
      success: true,
      data: {
        municipalities: { total: municipalitiesTotal, active: municipalitiesActive },
        reports: { total: reportsTotal, byStatus: reportsByStatus },
        users: { byRole: usersByRole },
        licenses: { active: licensesActive, expiringSoon: licensesExpiringSoon },
        topMunicipalities: topMunicipalitiesRaw.map((r) => ({
          id: r.municipality?.id,
          name: r.municipality?.name,
          slug: r.municipality?.slug,
          count: parseInt(r.get('count'), 10)
        }))
      }
    });
  } catch (error) {
    logger.error(`Erreur getGlobalStats: ${error.message}`, { error });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * Liste globale des signalements (super admin uniquement).
 * GET /api/admin/global/reports
 */
exports.getGlobalReports = async (req, res) => {
  try {
    const { Report, Municipality, User, Category } = require('../models');
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const { count, rows } = await Report.findAndCountAll({
      include: [
        { model: Municipality, as: 'municipality', attributes: ['id', 'name', 'slug'] },
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: User, as: 'citizen', attributes: ['id', 'full_name'] }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      success: true,
      data: {
        reports: rows,
        pagination: { page, limit, total: count, pages: Math.ceil(count / limit) }
      }
    });
  } catch (error) {
    logger.error(`Erreur getGlobalReports: ${error.message}`, { error });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};


// ============================================
// MUNICIPALITY SETTINGS (ADMIN, SCOPED)
// ============================================

/**
 * GET /api/admin/municipality/settings
 * Retourne la municipalité de l'admin connecté avec tous les champs
 * de branding / page publique.
 */
exports.getMunicipalitySettings = async (req, res) => {
  try {
    const municipalityId = req.municipalityId;
    if (!municipalityId) {
      return res.status(400).json({ success: false, message: 'Municipalité introuvable pour cet utilisateur' });
    }

    const municipality = await Municipality.findByPk(municipalityId);
    if (!municipality) {
      return res.status(404).json({ success: false, message: 'Municipalité introuvable' });
    }

    res.json({ success: true, data: { municipality } });
  } catch (error) {
    logger.error(`Erreur getMunicipalitySettings: ${error.message}`, { error });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/**
 * PATCH /api/admin/municipality/settings
 * Met à jour uniquement les champs fournis parmi la liste autorisée.
 */
exports.updateMunicipalitySettings = async (req, res) => {
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
    if (!municipalityId) {
      return res.status(400).json({ success: false, message: 'Municipalité introuvable pour cet utilisateur' });
    }

    const municipality = await Municipality.findByPk(municipalityId);
    if (!municipality) {
      return res.status(404).json({ success: false, message: 'Municipalité introuvable' });
    }

    const updates = {};
    for (const field of MUNICIPALITY_SETTINGS_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updates[field] = req.body[field];
      }
    }

    await municipality.update(updates);

    logger.info(`Municipality settings updated by admin ${req.userId} (municipality ${municipalityId})`);

    res.json({ success: true, data: { municipality } });
  } catch (error) {
    logger.error(`Erreur updateMunicipalitySettings: ${error.message}`, { error });
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
