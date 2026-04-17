const reportService = require('../services/reportService');
const uploadService = require('../services/uploadService');
const logger = require('../utils/logger');
const { body, query, validationResult } = require('express-validator');

/**
 * Contrôleur de gestion des signalements
 * CRUD complet + upload photos
 */

class ReportController {
  /**
   * Créer un nouveau signalement
   * POST /api/reports
   * Authentifié (citoyen)
   */
  async createReport(req, res) {
    try {
      const citizenId = req.userId || null;
      const municipalityId = req.municipalityId || req.body.municipalityId;

      const {
        categoryId,
        title,
        description,
        address,
        latitude,
        longitude,
        is_anonymous // Extraire is_anonymous du body
      } = req.body;

      logger.info('📥 Création signalement - Données reçues:', {
        categoryId,
        title: title?.substring(0, 50),
        address: address?.substring(0, 50),
        latitude,
        longitude,
        citizenId,
        municipalityId,
        is_anonymous
      });

      const report = await reportService.createReport(citizenId, municipalityId, {
        categoryId,
        title,
        description,
        address,
        latitude,
        longitude,
        is_anonymous: is_anonymous || (citizenId === null) // Forcer true si pas de citizenId
      });

      res.status(201).json({
        success: true,
        message: 'Signalement créé avec succès',
        data: {
          id: report.id,
          title: report.title,
          status: report.status,
          priorityScore: report.priority_score,
          createdAt: report.created_at
        }
      });
    } catch (error) {
      logger.error('Erreur création signalement:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de la création du signalement'
      });
    }
  }

  /**
   * Récupérer un signalement par ID
   * GET /api/reports/:id
   * Authentifié
   */
  async getReport(req, res) {
    try {
      const reportId = req.params.id;
      const municipalityId = req.municipalityId;

      const report = await reportService.getReportById(reportId, municipalityId);

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      logger.error('Erreur récupération signalement:', error);
      res.status(404).json({
        success: false,
        message: error.message || 'Signalement non trouvé'
      });
    }
  }

  /**
   * Lister les signalements avec filtres
   * GET /api/reports
   * Authentifié
   */
  async listReports(req, res) {
    try {
      const municipalityId = req.municipalityId;

      const filters = {
        status: req.query.status,
        categoryId: req.query.categoryId,
        search: req.query.search,
        sortBy: req.query.sortBy || 'priority',
        order: req.query.order || 'DESC',
        page: req.query.page || 1,
        limit: req.query.limit || 20
      };

      const result = await reportService.listReports(municipalityId, filters);

      res.json({
        success: true,
        data: result.reports,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Erreur listage signalements:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des signalements'
      });
    }
  }

  /**
   * Récupérer mes signalements
   * GET /api/reports/my-reports
   * Authentifié (citoyen)
   */
  async getMyReports(req, res) {
    try {
      const citizenId = req.userId;
      const municipalityId = req.municipalityId;
      const { status, page = 1, limit = 10 } = req.query;

      // Construire les filtres
      const filters = {
        status,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await reportService.getMyReports(citizenId, municipalityId, filters);

      res.json({
        success: true,
        reports: result.reports,
        pagination: {
          currentPage: result.currentPage,
          totalPages: result.totalPages,
          totalReports: result.totalReports,
          limit: result.limit
        }
      });
    } catch (error) {
      logger.error('Erreur récupération mes signalements:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de vos signalements'
      });
    }
  }

  /**
   * Mettre à jour un signalement
   * PUT /api/reports/:id
   * Authentifié (créateur uniquement)
   */
  async updateReport(req, res) {
    try {
      const reportId = req.params.id;
      const citizenId = req.userId;
      const municipalityId = req.municipalityId;

      const updates = {
        title: req.body.title,
        description: req.body.description,
        address: req.body.address,
        latitude: req.body.latitude,
        longitude: req.body.longitude
      };

      const report = await reportService.updateReport(
        reportId,
        citizenId,
        municipalityId,
        updates
      );

      res.json({
        success: true,
        message: 'Signalement mis à jour',
        data: {
          id: report.id,
          title: report.title,
          description: report.description,
          address: report.address,
          updatedAt: report.updated_at
        }
      });
    } catch (error) {
      logger.error('Erreur mise à jour signalement:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de la mise à jour'
      });
    }
  }

  /**
   * Supprimer un signalement
   * DELETE /api/reports/:id
   * Authentifié (créateur uniquement, status=pending)
   */
  async deleteReport(req, res) {
    try {
      const reportId = req.params.id;
      const citizenId = req.userId;
      const municipalityId = req.municipalityId;

      await reportService.deleteReport(reportId, citizenId, municipalityId);

      res.json({
        success: true,
        message: 'Signalement supprimé avec succès'
      });
    } catch (error) {
      logger.error('Erreur suppression signalement:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de la suppression'
      });
    }
  }

  /**
   * Upload une photo pour un signalement
   * POST /api/reports/:reportId/photos
   * Authentifié + Multer middleware
   */
  async uploadPhoto(req, res) {
    try {
      const reportId = req.params.reportId;
      const citizenId = req.userId;
      const municipalityId = req.municipalityId;

      logger.info(`📸 Upload photo - reportId: ${reportId}, file présent: ${!!req.file}`);

      if (!req.file) {
        logger.warn('Aucun fichier dans req.file');
        return res.status(400).json({
          success: false,
          message: 'Aucun fichier uploadé'
        });
      }

      // Générer l'URL de la photo
      const photoUrl = uploadService.getPhotoUrl(req.file.filename);

      // Ajouter à la base de données
      const photo = await reportService.addPhoto(
        reportId,
        citizenId,
        municipalityId,
        photoUrl
      );

      res.status(201).json({
        success: true,
        message: 'Photo uploadée avec succès',
        data: {
          id: photo.id,
          photoUrl: photo.photo_url,
          uploadOrder: photo.upload_order
        }
      });
    } catch (error) {
      // Si erreur, supprimer le fichier uploadé
      if (req.file) {
        const photoUrl = uploadService.getPhotoUrl(req.file.filename);
        await uploadService.deleteFile(photoUrl).catch(() => {});
      }

      logger.error('Erreur upload photo:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de l\'upload de la photo'
      });
    }
  }

  /**
   * Supprimer une photo
   * DELETE /api/reports/photos/:photoId
   * Authentifié (propriétaire uniquement)
   */
  async deletePhoto(req, res) {
    try {
      const photoId = req.params.photoId;
      const citizenId = req.userId;
      const municipalityId = req.municipalityId;

      await reportService.deletePhoto(photoId, citizenId, municipalityId);

      res.json({
        success: true,
        message: 'Photo supprimée avec succès'
      });
    } catch (error) {
      logger.error('Erreur suppression photo:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de la suppression'
      });
    }
  }

  /**
   * Récupérer les catégories
   * GET /api/reports/categories
   * Authentifié
   */
  async getCategories(req, res) {
    try {
      const municipalityId = req.municipalityId || req.query.municipalityId;

      if (!municipalityId) {
        return res.status(400).json({
          success: false,
          message: 'L\'ID de la municipalité est requis pour lister les catégories.'
        });
      }

      const categories = await reportService.getCategories(municipalityId);

      res.json({
        success: true,
        count: categories.length,
        data: categories
      });
    } catch (error) {
      logger.error('Erreur récupération catégories:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des catégories'
      });
    }
  }

  /**
   * Récupérer les statistiques
   * GET /api/reports/statistics
   * Authentifié
   */
  async getStatistics(req, res) {
    try {
      const municipalityId = req.municipalityId;

      const stats = await reportService.getStatistics(municipalityId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      logger.error('Erreur récupération statistiques:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }

  /**
   * Récupérer les municipalités publiques
   * GET /api/reports/public/municipalities
   */
  async getPublicMunicipalities(req, res) {
    try {
      const municipalities = await reportService.getPublicMunicipalities();

      res.json({
        success: true,
        count: municipalities.length,
        data: municipalities
      });
    } catch (error) {
      logger.error('Erreur récupération municipalités:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des municipalités'
      });
    }
  }

  /**
   * Rechercher des signalements à proximité
   * GET /api/reports/nearby
   */
  async getNearbyReports(req, res) {
    try {
      const { latitude, longitude, radius } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitude et longitude sont requises'
        });
      }

      const reports = await reportService.searchByLocation(
        latitude,
        longitude,
        radius ? parseInt(radius) : 5
      );

      res.json({
        success: true,
        count: reports.length,
        data: reports
      });
    } catch (error) {
      logger.error('Erreur recherche proximité:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la recherche à proximité'
      });
    }
  }

  /**
   * Validation rules
   */
  static validationRules = {
    createReport: [
      body('municipalityId')
        .notEmpty()
        .withMessage('La municipalité est requise')
        .isInt()
        .withMessage('ID municipalité invalide'),
      body('categoryId').isInt().withMessage('ID catégorie invalide'),
      body('title')
        .trim()
        .isLength({ min: 5, max: 255 })
        .withMessage('Le titre doit contenir entre 5 et 255 caractères'),
      body('description')
        .trim()
        .isLength({ min: 10, max: 5000 })
        .withMessage('La description doit contenir entre 10 et 5000 caractères'),
      body('address')
        .trim()
        .notEmpty()
        .withMessage('L\'adresse est requise'),
      body('latitude')
        .optional({ nullable: true, checkFalsy: true })
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude invalide'),
      body('longitude')
        .optional({ nullable: true, checkFalsy: true })
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude invalide')
    ],

    updateReport: [
      body('title')
        .optional()
        .trim()
        .isLength({ min: 5, max: 255 }),
      body('description')
        .optional()
        .trim()
        .isLength({ min: 10, max: 5000 }),
      body('address')
        .optional()
        .trim()
        .notEmpty(),
      body('latitude')
        .optional()
        .isFloat({ min: -90, max: 90 }),
      body('longitude')
        .optional()
        .isFloat({ min: -180, max: 180 })
    ],

    listReports: [
      query('status')
        .optional()
        .isIn(['pending', 'in_progress', 'resolved', 'rejected']),
      query('categoryId')
        .optional()
        .isInt(),
      query('sortBy')
        .optional()
        .isIn(['priority', 'date', 'updated', 'created_at']),
      query('order')
        .optional()
        .isIn(['ASC', 'DESC']),
      query('page')
        .optional()
        .isInt({ min: 1 }),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
    ]
  };
}

/**
 * Middleware de validation
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de validation',
      errors: errors.array()
    });
  }
  next();
};

const controller = new ReportController();

module.exports = {
  createReport: controller.createReport.bind(controller),
  getReport: controller.getReport.bind(controller),
  listReports: controller.listReports.bind(controller),
  getMyReports: controller.getMyReports.bind(controller),
  updateReport: controller.updateReport.bind(controller),
  deleteReport: controller.deleteReport.bind(controller),
  uploadPhoto: controller.uploadPhoto.bind(controller),
  deletePhoto: controller.deletePhoto.bind(controller),
  getCategories: controller.getCategories.bind(controller),
  getStatistics: controller.getStatistics.bind(controller),
  getPublicMunicipalities: controller.getPublicMunicipalities.bind(controller),
  getNearbyReports: controller.getNearbyReports.bind(controller),
  validate,
  validationRules: ReportController.validationRules
};
