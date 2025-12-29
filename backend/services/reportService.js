const { Report, ReportPhoto, User, Category, Support, Municipality, StatusHistory } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const notificationService = require('./notificationService');

/**
 * Service de gestion des signalements
 * CRUD complet + logique métier
 */

class ReportService {
  /**
   * Créer un nouveau signalement
   * @param {number} citizenId
   * @param {number} municipalityId
   * @param {Object} reportData
   * @returns {Promise<Report>}
   */
  async createReport(citizenId, municipalityId, reportData) {
    try {
      const {
        categoryId,
        title,
        description,
        address,
        latitude,
        longitude
      } = reportData;

      // Vérifier que la catégorie existe et appartient à la municipalité
      const category = await Category.findOne({
        where: {
          id: categoryId,
          municipality_id: municipalityId,
          is_active: true
        }
      });

      if (!category) {
        throw new Error('Catégorie invalide ou inactive');
      }

      // Créer le signalement
      const report = await Report.create({
        municipality_id: municipalityId,
        citizen_id: citizenId,
        category_id: categoryId,
        title,
        description,
        address,
        latitude: latitude || null,
        longitude: longitude || null,
        status: 'pending',
        priority_score: 0
      });

      // Le hook afterCreate met à jour automatiquement le priority_score

      logger.info(`Signalement créé: #${report.id} par User ${citizenId}`);

      // Envoyer notification aux admins
      try {
        await notificationService.notifyAdminNewReport(report.id);
      } catch (notifError) {
        logger.warn(`Erreur notification nouveau signalement: ${notifError.message}`);
      }

      return report;
    } catch (error) {
      logger.error('Erreur création signalement:', error);
      throw error;
    }
  }

  /**
   * Récupérer un signalement par ID
   * @param {number} reportId
   * @param {number} municipalityId
   * @returns {Promise<Report>}
   */
  async getReportById(reportId, municipalityId) {
    try {
      const report = await Report.findOne({
        where: {
          id: reportId,
          municipality_id: municipalityId
        },
        include: [
          {
            model: User,
            as: 'citizen',
            attributes: ['id', 'full_name', 'phone']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'icon', 'color']
          },
          {
            model: ReportPhoto,
            as: 'photos',
            attributes: ['id', 'photo_url', 'upload_order']
          },
          {
            model: Support,
            as: 'supports',
            attributes: ['id', 'citizen_id', 'created_at']
          },
          {
            model: User,
            as: 'resolver',
            attributes: ['id', 'full_name', 'role']
          }
        ],
        order: [
          [{ model: ReportPhoto, as: 'photos' }, 'upload_order', 'ASC']
        ]
      });

      if (!report) {
        throw new Error('Signalement non trouvé');
      }

      // Ajouter le nombre de supports
      const reportData = report.toJSON();
      reportData.supportsCount = report.supports ? report.supports.length : 0;

      return reportData;
    } catch (error) {
      logger.error('Erreur récupération signalement:', error);
      throw error;
    }
  }

  /**
   * Lister les signalements avec filtres et pagination
   * @param {number} municipalityId
   * @param {Object} filters
   * @returns {Promise<Object>}
   */
  async listReports(municipalityId, filters = {}) {
    try {
      const {
        status,
        categoryId,
        citizenId,
        search,
        sortBy = 'priority', // priority, date, supports
        order = 'DESC',
        page = 1,
        limit = 20
      } = filters;

      // Construire les conditions WHERE
      const where = {
        municipality_id: municipalityId
      };

      if (status) {
        where.status = status;
      }

      if (categoryId) {
        where.category_id = categoryId;
      }

      if (citizenId) {
        where.citizen_id = citizenId;
      }

      if (search) {
        where[Op.or] = [
          { title: { [Op.like]: `%${search}%` } },
          { description: { [Op.like]: `%${search}%` } },
          { address: { [Op.like]: `%${search}%` } }
        ];
      }

      // Définir l'ordre
      let orderClause;
      switch (sortBy) {
        case 'priority':
          orderClause = [['priority_score', order]];
          break;
        case 'date':
        case 'created_at':
          orderClause = [['created_at', order]];
          break;
        case 'updated':
          orderClause = [['updated_at', order]];
          break;
        default:
          orderClause = [['priority_score', 'DESC']];
      }

      // Calculer offset
      const offset = (page - 1) * limit;

      // Exécuter la requête
      const { count, rows } = await Report.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'citizen',
            attributes: ['id', 'full_name']
          },
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'icon', 'color']
          },
          {
            model: ReportPhoto,
            as: 'photos',
            attributes: ['id', 'photo_url'],
            limit: 1 // Première photo seulement
          }
        ],
        order: orderClause,
        limit: parseInt(limit),
        offset: offset,
        distinct: true
      });

      // Enrichir avec le nombre de supports
      const reportsWithSupports = await Promise.all(
        rows.map(async (report) => {
          const supportsCount = await Support.count({
            where: { report_id: report.id }
          });

          const reportData = report.toJSON();
          reportData.supportsCount = supportsCount;
          return reportData;
        })
      );

      return {
        reports: reportsWithSupports,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      logger.error('Erreur listage signalements:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un signalement (par le citoyen créateur)
   * @param {number} reportId
   * @param {number} citizenId
   * @param {number} municipalityId
   * @param {Object} updates
   * @returns {Promise<Report>}
   */
  async updateReport(reportId, citizenId, municipalityId, updates) {
    try {
      const report = await Report.findOne({
        where: {
          id: reportId,
          municipality_id: municipalityId,
          citizen_id: citizenId // Seul le créateur peut modifier
        }
      });

      if (!report) {
        throw new Error('Signalement non trouvé ou non autorisé');
      }

      // Seuls certains champs sont modifiables
      const allowedFields = ['title', 'description', 'address', 'latitude', 'longitude'];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          report[field] = updates[field];
        }
      }

      await report.save();

      logger.info(`Signalement #${reportId} mis à jour par User ${citizenId}`);

      return report;
    } catch (error) {
      logger.error('Erreur mise à jour signalement:', error);
      throw error;
    }
  }

  /**
   * Supprimer un signalement (par le citoyen créateur, seulement si status=pending)
   * @param {number} reportId
   * @param {number} citizenId
   * @param {number} municipalityId
   * @returns {Promise<boolean>}
   */
  async deleteReport(reportId, citizenId, municipalityId) {
    try {
      const report = await Report.findOne({
        where: {
          id: reportId,
          municipality_id: municipalityId,
          citizen_id: citizenId
        }
      });

      if (!report) {
        throw new Error('Signalement non trouvé ou non autorisé');
      }

      // Ne peut supprimer que si status = pending
      if (report.status !== 'pending') {
        throw new Error('Impossible de supprimer un signalement en cours de traitement');
      }

      await report.destroy();

      logger.info(`Signalement #${reportId} supprimé par User ${citizenId}`);

      return true;
    } catch (error) {
      logger.error('Erreur suppression signalement:', error);
      throw error;
    }
  }

  /**
   * Ajouter une photo à un signalement
   * @param {number} reportId
   * @param {number} citizenId
   * @param {number} municipalityId
   * @param {string} photoUrl
   * @returns {Promise<ReportPhoto>}
   */
  async addPhoto(reportId, citizenId, municipalityId, photoUrl) {
    try {
      // Vérifier que le signalement appartient au citoyen
      const report = await Report.findOne({
        where: {
          id: reportId,
          municipality_id: municipalityId,
          citizen_id: citizenId
        }
      });

      if (!report) {
        throw new Error('Signalement non trouvé ou non autorisé');
      }

      // Compter les photos existantes
      const photosCount = await ReportPhoto.count({
        where: { report_id: reportId }
      });

      // Limite à 5 photos
      if (photosCount >= 5) {
        throw new Error('Maximum 5 photos par signalement');
      }

      // Créer la photo
      const photo = await ReportPhoto.create({
        report_id: reportId,
        photo_url: photoUrl,
        upload_order: photosCount + 1
      });

      logger.info(`Photo ajoutée au signalement #${reportId}`);

      return photo;
    } catch (error) {
      logger.error('Erreur ajout photo:', error);
      throw error;
    }
  }

  /**
   * Supprimer une photo
   * @param {number} photoId
   * @param {number} citizenId
   * @param {number} municipalityId
   * @returns {Promise<boolean>}
   */
  async deletePhoto(photoId, citizenId, municipalityId) {
    try {
      const photo = await ReportPhoto.findByPk(photoId, {
        include: [{
          model: Report,
          as: 'report',
          where: {
            municipality_id: municipalityId,
            citizen_id: citizenId
          }
        }]
      });

      if (!photo) {
        throw new Error('Photo non trouvée ou non autorisée');
      }

      // TODO: Supprimer le fichier physique
      // const fs = require('fs');
      // fs.unlinkSync(photo.photo_url);

      await photo.destroy();

      logger.info(`Photo #${photoId} supprimée`);

      return true;
    } catch (error) {
      logger.error('Erreur suppression photo:', error);
      throw error;
    }
  }

  /**
   * Récupérer les signalements d'un citoyen
   * @param {number} citizenId
   * @param {number} municipalityId
   * @param {Object} filters - Filtres de recherche (status, page, limit)
   * @returns {Promise<Object>}
   */
  async getMyReports(citizenId, municipalityId, filters = {}) {
    try {
      const { status, page = 1, limit = 10 } = filters;
      const offset = (page - 1) * limit;

      // Construire la clause WHERE
      const where = {
        citizen_id: citizenId,
        municipality_id: municipalityId
      };

      if (status) {
        where.status = status;
      }

      // Compter le total
      const totalReports = await Report.count({ where });

      // Récupérer les signalements avec pagination
      const reports = await Report.findAll({
        where,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'icon', 'color']
          },
          {
            model: ReportPhoto,
            as: 'photos',
            attributes: ['id', 'photo_url'],
            limit: 3
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      // Enrichir avec supports
      const reportsWithSupports = await Promise.all(
        reports.map(async (report) => {
          const supportsCount = await Support.count({
            where: { report_id: report.id }
          });

          const reportData = report.toJSON();
          reportData.supports_count = supportsCount;
          return reportData;
        })
      );

      return {
        reports: reportsWithSupports,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReports / limit),
        totalReports,
        limit: parseInt(limit)
      };
    } catch (error) {
      logger.error('Erreur récupération mes signalements:', error);
      throw error;
    }
  }

  /**
   * Récupérer les catégories d'une municipalité
   * @param {number} municipalityId
   * @returns {Promise<Array>}
   */
  async getCategories(municipalityId) {
    try {
      const categories = await Category.findAll({
        where: {
          municipality_id: municipalityId,
          is_active: true
        },
        attributes: ['id', 'name', 'description', 'icon', 'color', 'display_order'],
        order: [['display_order', 'ASC'], ['name', 'ASC']]
      });

      // Ajouter le nombre de signalements par catégorie
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          const reportsCount = await Report.count({
            where: {
              category_id: category.id,
              status: ['pending', 'in_progress']
            }
          });

          const categoryData = category.toJSON();
          categoryData.activeReportsCount = reportsCount;
          return categoryData;
        })
      );

      return categoriesWithCounts;
    } catch (error) {
      logger.error('Erreur récupération catégories:', error);
      throw error;
    }
  }

  /**
   * Récupérer les statistiques des signalements
   * @param {number} municipalityId
   * @returns {Promise<Object>}
   */
  async getStatistics(municipalityId) {
    try {
      const total = await Report.count({
        where: { municipality_id: municipalityId }
      });

      const pending = await Report.count({
        where: { municipality_id: municipalityId, status: 'pending' }
      });

      const inProgress = await Report.count({
        where: { municipality_id: municipalityId, status: 'in_progress' }
      });

      const resolved = await Report.count({
        where: { municipality_id: municipalityId, status: 'resolved' }
      });

      const rejected = await Report.count({
        where: { municipality_id: municipalityId, status: 'rejected' }
      });

      return {
        total,
        byStatus: {
          pending,
          in_progress: inProgress,
          resolved,
          rejected
        },
        percentageResolved: total > 0 ? ((resolved / total) * 100).toFixed(1) : 0
      };
    } catch (error) {
      logger.error('Erreur récupération statistiques:', error);
      throw error;
    }
  }
}

module.exports = new ReportService();
