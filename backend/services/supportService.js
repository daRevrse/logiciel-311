/**
 * Service de Gestion des Appuis Citoyens
 * Gère l'ajout/retrait d'appuis (supports) sur les signalements
 *
 * Fonctionnalités :
 * - Ajouter un appui (1 par citoyen par signalement)
 * - Retirer son appui
 * - Lister les appuis d'un signalement
 * - Auto-update du priority_score
 */

const { Support, Report, User } = require('../models');
const logger = require('../utils/logger');

class SupportService {
  /**
   * Ajouter un appui à un signalement
   * Règles :
   * - 1 citoyen ne peut appuyer qu'une seule fois par signalement
   * - Le créateur du signalement ne peut pas l'appuyer
   * - Uniquement les signalements actifs (pending, in_progress)
   * - Auto-update du priority_score du signalement
   *
   * @param {Number} reportId - ID du signalement
   * @param {Number} citizenId - ID du citoyen
   * @param {Number} municipalityId - ID de la municipalité
   * @returns {Object} - Support créé
   */
  async addSupport(reportId, citizenId, municipalityId) {
    try {
      // 1. Vérifier que le signalement existe et appartient à la municipalité
      const report = await Report.findOne({
        where: {
          id: reportId,
          municipality_id: municipalityId
        }
      });

      if (!report) {
        logger.warn(`Tentative d'appui sur signalement inexistant: ${reportId}`);
        return {
          success: false,
          message: 'Signalement introuvable'
        };
      }

      // 2. Vérifier que le signalement n'est pas résolu/rejeté
      if (report.status === 'resolved' || report.status === 'rejected') {
        logger.warn(`Tentative d'appui sur signalement fermé: ${reportId} (status: ${report.status})`);
        return {
          success: false,
          message: 'Impossible d\'appuyer un signalement résolu ou rejeté'
        };
      }

      // 3. Vérifier que le citoyen n'est pas le créateur du signalement
      if (report.citizen_id === citizenId) {
        logger.warn(`Citoyen ${citizenId} tente d'appuyer son propre signalement ${reportId}`);
        return {
          success: false,
          message: 'Vous ne pouvez pas appuyer votre propre signalement'
        };
      }

      // 4. Vérifier que le citoyen n'a pas déjà appuyé ce signalement
      const existingSupport = await Support.findOne({
        where: {
          report_id: reportId,
          citizen_id: citizenId
        }
      });

      if (existingSupport) {
        logger.info(`Citoyen ${citizenId} a déjà appuyé le signalement ${reportId}`);
        return {
          success: false,
          message: 'Vous avez déjà appuyé ce signalement'
        };
      }

      // 5. Créer l'appui
      const support = await Support.create({
        report_id: reportId,
        citizen_id: citizenId
      });

      logger.info(`✅ Appui créé: Citoyen ${citizenId} appuie signalement ${reportId}`);

      // 6. Mettre à jour le priority_score du signalement
      await report.updatePriorityScore();

      // 7. Recharger le signalement avec le nouveau score
      await report.reload();

      return {
        success: true,
        message: 'Appui ajouté avec succès',
        data: {
          support,
          newPriorityScore: report.priority_score
        }
      };

    } catch (error) {
      logger.error(`Erreur addSupport: ${error.message}`, { error, reportId, citizenId });
      throw error;
    }
  }

  /**
   * Retirer son appui d'un signalement
   *
   * @param {Number} reportId - ID du signalement
   * @param {Number} citizenId - ID du citoyen
   * @param {Number} municipalityId - ID de la municipalité
   * @returns {Object} - Résultat de la suppression
   */
  async removeSupport(reportId, citizenId, municipalityId) {
    try {
      // 1. Vérifier que le signalement existe et appartient à la municipalité
      const report = await Report.findOne({
        where: {
          id: reportId,
          municipality_id: municipalityId
        }
      });

      if (!report) {
        logger.warn(`Tentative de retrait d'appui sur signalement inexistant: ${reportId}`);
        return {
          success: false,
          message: 'Signalement introuvable'
        };
      }

      // 2. Vérifier que l'appui existe
      const support = await Support.findOne({
        where: {
          report_id: reportId,
          citizen_id: citizenId
        }
      });

      if (!support) {
        logger.warn(`Citoyen ${citizenId} tente de retirer un appui inexistant sur ${reportId}`);
        return {
          success: false,
          message: 'Vous n\'avez pas appuyé ce signalement'
        };
      }

      // 3. Supprimer l'appui
      await support.destroy();

      logger.info(`✅ Appui retiré: Citoyen ${citizenId} retire son appui du signalement ${reportId}`);

      // 4. Mettre à jour le priority_score du signalement
      await report.updatePriorityScore();

      // 5. Recharger le signalement avec le nouveau score
      await report.reload();

      return {
        success: true,
        message: 'Appui retiré avec succès',
        data: {
          newPriorityScore: report.priority_score
        }
      };

    } catch (error) {
      logger.error(`Erreur removeSupport: ${error.message}`, { error, reportId, citizenId });
      throw error;
    }
  }

  /**
   * Vérifier si un citoyen a appuyé un signalement
   *
   * @param {Number} reportId - ID du signalement
   * @param {Number} citizenId - ID du citoyen
   * @returns {Boolean} - true si le citoyen a appuyé
   */
  async hasSupported(reportId, citizenId) {
    try {
      const support = await Support.findOne({
        where: {
          report_id: reportId,
          citizen_id: citizenId
        }
      });

      return !!support;

    } catch (error) {
      logger.error(`Erreur hasSupported: ${error.message}`, { error, reportId, citizenId });
      throw error;
    }
  }

  /**
   * Obtenir le nombre total d'appuis d'un signalement
   *
   * @param {Number} reportId - ID du signalement
   * @returns {Number} - Nombre d'appuis
   */
  async getSupportCount(reportId) {
    try {
      const count = await Support.count({
        where: {
          report_id: reportId
        }
      });

      return count;

    } catch (error) {
      logger.error(`Erreur getSupportCount: ${error.message}`, { error, reportId });
      throw error;
    }
  }

  /**
   * Lister les appuis d'un signalement
   * Visible uniquement par les admins
   *
   * @param {Number} reportId - ID du signalement
   * @param {Number} municipalityId - ID de la municipalité
   * @param {Object} options - Options de pagination
   * @returns {Object} - Liste des appuis avec info citoyen
   */
  async listSupports(reportId, municipalityId, options = {}) {
    try {
      const {
        page = 1,
        limit = 50
      } = options;

      const offset = (page - 1) * limit;

      // 1. Vérifier que le signalement existe et appartient à la municipalité
      const report = await Report.findOne({
        where: {
          id: reportId,
          municipality_id: municipalityId
        }
      });

      if (!report) {
        logger.warn(`Tentative de lister appuis sur signalement inexistant: ${reportId}`);
        return {
          success: false,
          message: 'Signalement introuvable'
        };
      }

      // 2. Récupérer les appuis avec info citoyen
      const { count, rows: supports } = await Support.findAndCountAll({
        where: {
          report_id: reportId
        },
        include: [
          {
            model: User,
            as: 'citizen',
            attributes: ['id', 'full_name', 'email', 'created_at']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      logger.info(`Liste appuis signalement ${reportId}: ${count} total`);

      return {
        success: true,
        data: {
          supports,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages
          }
        }
      };

    } catch (error) {
      logger.error(`Erreur listSupports: ${error.message}`, { error, reportId });
      throw error;
    }
  }

  /**
   * Obtenir les statistiques d'appuis pour un signalement
   *
   * @param {Number} reportId - ID du signalement
   * @returns {Object} - Statistiques
   */
  async getSupportStats(reportId) {
    try {
      const count = await this.getSupportCount(reportId);

      const report = await Report.findByPk(reportId);

      if (!report) {
        return {
          success: false,
          message: 'Signalement introuvable'
        };
      }

      // Calculer la moyenne d'appuis par jour depuis création
      const now = new Date();
      const createdAt = new Date(report.created_at);
      const ageInDays = Math.max(1, Math.floor((now - createdAt) / (1000 * 60 * 60 * 24)));
      const supportsPerDay = (count / ageInDays).toFixed(2);

      return {
        success: true,
        data: {
          totalSupports: count,
          priorityScore: report.priority_score,
          ageInDays,
          supportsPerDay: parseFloat(supportsPerDay)
        }
      };

    } catch (error) {
      logger.error(`Erreur getSupportStats: ${error.message}`, { error, reportId });
      throw error;
    }
  }

  /**
   * Obtenir les signalements les plus appuyés d'une municipalité
   *
   * @param {Number} municipalityId - ID de la municipalité
   * @param {Object} options - Options de filtrage
   * @returns {Object} - Top signalements
   */
  async getTopSupportedReports(municipalityId, options = {}) {
    try {
      const {
        limit = 10,
        status = null
      } = options;

      const where = {
        municipality_id: municipalityId
      };

      if (status) {
        where.status = status;
      }

      const reports = await Report.findAll({
        where,
        include: [
          {
            model: Support,
            as: 'supports',
            attributes: []
          },
          {
            model: User,
            as: 'citizen',
            attributes: ['id', 'full_name']
          }
        ],
        attributes: {
          include: [
            [
              // Compter les appuis directement dans la requête
              require('sequelize').fn('COUNT', require('sequelize').col('supports.id')),
              'supports_count'
            ]
          ]
        },
        group: ['Report.id', 'citizen.id'],
        order: [
          [require('sequelize').literal('supports_count'), 'DESC'],
          ['priority_score', 'DESC']
        ],
        limit: parseInt(limit),
        subQuery: false
      });

      logger.info(`Top ${limit} signalements appuyés pour municipalité ${municipalityId}`);

      return {
        success: true,
        data: reports
      };

    } catch (error) {
      logger.error(`Erreur getTopSupportedReports: ${error.message}`, { error, municipalityId });
      throw error;
    }
  }

  /**
   * Obtenir les signalements appuyés par un citoyen
   *
   * @param {Number} citizenId - ID du citoyen
   * @param {Number} municipalityId - ID de la municipalité
   * @param {Object} options - Options de pagination
   * @returns {Object} - Liste des signalements appuyés
   */
  async getMySupportedReports(citizenId, municipalityId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20
      } = options;

      const offset = (page - 1) * limit;

      // Récupérer les IDs des signalements appuyés
      const supports = await Support.findAll({
        where: {
          citizen_id: citizenId
        },
        attributes: ['report_id', 'created_at'],
        include: [
          {
            model: Report,
            as: 'report',
            where: {
              municipality_id: municipalityId
            },
            include: [
              {
                model: User,
                as: 'citizen',
                attributes: ['id', 'full_name']
              }
            ]
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const count = await Support.count({
        where: {
          citizen_id: citizenId
        },
        include: [
          {
            model: Report,
            as: 'report',
            where: {
              municipality_id: municipalityId
            }
          }
        ]
      });

      const totalPages = Math.ceil(count / limit);

      logger.info(`Signalements appuyés par citoyen ${citizenId}: ${count} total`);

      return {
        success: true,
        data: {
          supports,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages
          }
        }
      };

    } catch (error) {
      logger.error(`Erreur getMySupportedReports: ${error.message}`, { error, citizenId });
      throw error;
    }
  }
}

module.exports = new SupportService();
