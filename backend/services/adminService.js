/**
 * Service de Gestion Admin
 * Gère les fonctionnalités réservées aux administrateurs
 *
 * Fonctionnalités :
 * - Changer le statut des signalements
 * - Ajouter des notes internes
 * - Voir l'historique des changements
 * - Assigner des signalements
 * - Statistiques admin avancées
 */

const { Report, StatusHistory, User, Category, Support, ReportPhoto, Municipality } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const notificationService = require('./notificationService');

class AdminService {
  /**
   * Changer le statut d'un signalement
   * Crée automatiquement une entrée dans l'historique
   *
   * @param {Number} reportId - ID du signalement
   * @param {String} newStatus - Nouveau statut
   * @param {Number} adminId - ID de l'admin
   * @param {Number} municipalityId - ID de la municipalité
   * @param {String} comment - Commentaire optionnel
   * @returns {Object} - Signalement mis à jour
   */
  async changeReportStatus(reportId, newStatus, adminId, municipalityId, comment = null) {
    try {
      // 1. Vérifier que le signalement existe et appartient à la municipalité
      const report = await Report.findOne({
        where: {
          id: reportId,
          municipality_id: municipalityId
        }
      });

      if (!report) {
        logger.warn(`Tentative changement status sur signalement inexistant: ${reportId}`);
        return {
          success: false,
          message: 'Signalement introuvable'
        };
      }

      // 2. Vérifier que le nouveau statut est valide
      const validStatuses = ['pending', 'in_progress', 'resolved', 'rejected'];
      if (!validStatuses.includes(newStatus)) {
        return {
          success: false,
          message: 'Statut invalide'
        };
      }

      // 3. Vérifier que le statut change réellement
      if (report.status === newStatus) {
        return {
          success: false,
          message: 'Le signalement a déjà ce statut'
        };
      }

      const oldStatus = report.status;

      // 4. Créer une entrée dans l'historique AVANT de changer le statut
      await StatusHistory.create({
        report_id: reportId,
        old_status: oldStatus,
        new_status: newStatus,
        changed_by_admin_id: adminId,
        comment: comment
      });

      // 5. Mettre à jour le statut du signalement
      report.status = newStatus;
      await report.save();

      logger.info(`✅ Status changé: Signalement ${reportId} (${oldStatus} → ${newStatus}) par admin ${adminId}`);

      // 6. Envoyer notification au citoyen
      try {
        await notificationService.notifyStatusChange(reportId, newStatus, comment);
      } catch (notifError) {
        logger.warn(`Erreur notification: ${notifError.message}`);
        // Ne pas bloquer le changement de statut si notification échoue
      }

      // 7. Recharger avec relations
      await report.reload({
        include: [
          {
            model: User,
            as: 'citizen',
            attributes: ['id', 'full_name', 'phone', 'email']
          },
          {
            model: Category,
            as: 'category'
          }
        ]
      });

      return {
        success: true,
        message: 'Statut mis à jour avec succès',
        data: {
          report,
          oldStatus,
          newStatus
        }
      };

    } catch (error) {
      logger.error(`Erreur changeReportStatus: ${error.message}`, { error, reportId });
      throw error;
    }
  }

  /**
   * Ajouter une note interne admin sur un signalement
   * Les notes sont stockées dans StatusHistory avec old_status = new_status
   *
   * @param {Number} reportId - ID du signalement
   * @param {Number} adminId - ID de l'admin
   * @param {Number} municipalityId - ID de la municipalité
   * @param {String} note - Contenu de la note
   * @returns {Object} - Note créée
   */
  async addAdminNote(reportId, adminId, municipalityId, note) {
    try {
      // 1. Vérifier que le signalement existe
      const report = await Report.findOne({
        where: {
          id: reportId,
          municipality_id: municipalityId
        }
      });

      if (!report) {
        return {
          success: false,
          message: 'Signalement introuvable'
        };
      }

      // 2. Créer une entrée avec old_status = new_status (indique une note)
      const noteEntry = await StatusHistory.create({
        report_id: reportId,
        old_status: report.status,
        new_status: report.status,
        changed_by_admin_id: adminId,
        comment: note
      });

      logger.info(`✅ Note admin ajoutée: Signalement ${reportId} par admin ${adminId}`);

      // 3. Recharger avec détails admin
      await noteEntry.reload({
        include: [
          {
            model: User,
            as: 'admin',
            attributes: ['id', 'full_name', 'role']
          }
        ]
      });

      return {
        success: true,
        message: 'Note ajoutée avec succès',
        data: noteEntry
      };

    } catch (error) {
      logger.error(`Erreur addAdminNote: ${error.message}`, { error, reportId });
      throw error;
    }
  }

  /**
   * Obtenir l'historique complet d'un signalement
   * Inclut changements de statut et notes admin
   *
   * @param {Number} reportId - ID du signalement
   * @param {Number} municipalityId - ID de la municipalité
   * @returns {Object} - Historique complet
   */
  async getReportHistory(reportId, municipalityId) {
    try {
      // 1. Vérifier que le signalement existe
      const report = await Report.findOne({
        where: {
          id: reportId,
          municipality_id: municipalityId
        }
      });

      if (!report) {
        return {
          success: false,
          message: 'Signalement introuvable'
        };
      }

      // 2. Récupérer tout l'historique
      const history = await StatusHistory.findAll({
        where: {
          report_id: reportId
        },
        include: [
          {
            model: User,
            as: 'admin',
            attributes: ['id', 'full_name', 'role']
          }
        ],
        order: [['created_at', 'ASC']]
      });

      // 3. Séparer changements de statut et notes
      const statusChanges = history.filter(h => h.old_status !== h.new_status);
      const notes = history.filter(h => h.old_status === h.new_status && h.comment);

      logger.info(`Historique signalement ${reportId}: ${statusChanges.length} changements, ${notes.length} notes`);

      return {
        success: true,
        data: {
          report: {
            id: report.id,
            title: report.title,
            current_status: report.status,
            created_at: report.created_at
          },
          timeline: history,
          statusChanges,
          notes
        }
      };

    } catch (error) {
      logger.error(`Erreur getReportHistory: ${error.message}`, { error, reportId });
      throw error;
    }
  }

  /**
   * Assigner un signalement à un admin spécifique
   * Utilise le champ assigned_to_admin_id
   *
   * @param {Number} reportId - ID du signalement
   * @param {Number} assignedAdminId - ID de l'admin assigné
   * @param {Number} currentAdminId - ID de l'admin qui assigne
   * @param {Number} municipalityId - ID de la municipalité
   * @returns {Object} - Signalement assigné
   */
  async assignReport(reportId, assignedAdminId, currentAdminId, municipalityId) {
    try {
      // 1. Vérifier que le signalement existe
      const report = await Report.findOne({
        where: {
          id: reportId,
          municipality_id: municipalityId
        }
      });

      if (!report) {
        return {
          success: false,
          message: 'Signalement introuvable'
        };
      }

      // 2. Vérifier que l'admin assigné existe et appartient à la même municipalité
      const assignedAdmin = await User.findOne({
        where: {
          id: assignedAdminId,
          municipality_id: municipalityId,
          role: {
            [Op.in]: ['admin', 'super_admin']
          },
          is_active: true
        }
      });

      if (!assignedAdmin) {
        return {
          success: false,
          message: 'Administrateur introuvable ou inactif'
        };
      }

      // 3. Assigner le signalement
      const previousAssignedId = report.assigned_to_admin_id;
      report.assigned_to_admin_id = assignedAdminId;
      await report.save();

      // 4. Ajouter une note dans l'historique
      const noteText = previousAssignedId
        ? `Réassigné à ${assignedAdmin.full_name}`
        : `Assigné à ${assignedAdmin.full_name}`;

      await StatusHistory.create({
        report_id: reportId,
        old_status: report.status,
        new_status: report.status,
        changed_by_admin_id: currentAdminId,
        comment: noteText
      });

      logger.info(`✅ Signalement ${reportId} assigné à admin ${assignedAdminId} par admin ${currentAdminId}`);

      // 5. Envoyer notification à l'admin assigné
      try {
        await notificationService.notifyAdminAssignment(reportId, assignedAdminId);
      } catch (notifError) {
        logger.warn(`Erreur notification assignation: ${notifError.message}`);
      }

      // 6. Recharger avec relations
      await report.reload({
        include: [
          {
            model: User,
            as: 'assignedAdmin',
            attributes: ['id', 'full_name', 'phone', 'email']
          }
        ]
      });

      return {
        success: true,
        message: 'Signalement assigné avec succès',
        data: {
          report,
          assignedTo: assignedAdmin.full_name
        }
      };

    } catch (error) {
      logger.error(`Erreur assignReport: ${error.message}`, { error, reportId });
      throw error;
    }
  }

  /**
   * Retirer l'assignation d'un signalement
   *
   * @param {Number} reportId - ID du signalement
   * @param {Number} adminId - ID de l'admin
   * @param {Number} municipalityId - ID de la municipalité
   * @returns {Object} - Résultat
   */
  async unassignReport(reportId, adminId, municipalityId) {
    try {
      const report = await Report.findOne({
        where: {
          id: reportId,
          municipality_id: municipalityId
        }
      });

      if (!report) {
        return {
          success: false,
          message: 'Signalement introuvable'
        };
      }

      if (!report.assigned_to_admin_id) {
        return {
          success: false,
          message: 'Le signalement n\'est pas assigné'
        };
      }

      report.assigned_to_admin_id = null;
      await report.save();

      await StatusHistory.create({
        report_id: reportId,
        old_status: report.status,
        new_status: report.status,
        changed_by_admin_id: adminId,
        comment: 'Assignation retirée'
      });

      logger.info(`✅ Assignation retirée: Signalement ${reportId} par admin ${adminId}`);

      return {
        success: true,
        message: 'Assignation retirée avec succès'
      };

    } catch (error) {
      logger.error(`Erreur unassignReport: ${error.message}`, { error, reportId });
      throw error;
    }
  }

  /**
   * Obtenir les statistiques du dashboard admin
   *
   * @param {Number} municipalityId - ID de la municipalité
   * @param {Object} filters - Filtres optionnels (dateFrom, dateTo)
   * @returns {Object} - Statistiques complètes
   */
  async getDashboardStats(municipalityId, filters = {}) {
    try {
      const { dateFrom, dateTo } = filters;

      const whereClause = {
        municipality_id: municipalityId
      };

      // Filtre par date si fourni
      if (dateFrom || dateTo) {
        whereClause.created_at = {};
        if (dateFrom) whereClause.created_at[Op.gte] = new Date(dateFrom);
        if (dateTo) whereClause.created_at[Op.lte] = new Date(dateTo);
      }

      // 1. Statistiques globales
      const totalReports = await Report.count({ where: whereClause });

      const reportsByStatus = await Report.findAll({
        where: whereClause,
        attributes: [
          'status',
          [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['status'],
        raw: true
      });

      // 2. Signalements par catégorie
      const reportsByCategory = await Report.findAll({
        where: whereClause,
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name', 'icon']
          }
        ],
        attributes: [
          'category_id',
          [require('sequelize').fn('COUNT', require('sequelize').col('Report.id')), 'count']
        ],
        group: ['category_id', 'category.id', 'category.name', 'category.icon'],
        raw: false
      });

      // 3. Signalements assignés vs non-assignés
      const assignedCount = await Report.count({
        where: {
          ...whereClause,
          assigned_to_admin_id: {
            [Op.ne]: null
          }
        }
      });

      const unassignedCount = totalReports - assignedCount;

      // 4. Top 10 signalements les plus appuyés
      const topSupported = await Report.findAll({
        where: whereClause,
        include: [
          {
            model: Support,
            as: 'supports',
            attributes: []
          },
          {
            model: Category,
            as: 'category',
            attributes: ['name', 'icon']
          }
        ],
        attributes: {
          include: [
            [
              require('sequelize').fn('COUNT', require('sequelize').col('supports.id')),
              'supports_count'
            ]
          ]
        },
        group: ['Report.id', 'category.id'],
        order: [[require('sequelize').literal('supports_count'), 'DESC']],
        limit: 10,
        subQuery: false
      });

      // 5. Activité récente (changements statut des 7 derniers jours)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentActivity = await StatusHistory.count({
        where: {
          created_at: {
            [Op.gte]: sevenDaysAgo
          }
        },
        include: [
          {
            model: Report,
            as: 'report',
            where: {
              municipality_id: municipalityId
            },
            attributes: []
          }
        ]
      });

      // 6. Taux de résolution
      const resolvedCount = reportsByStatus.find(s => s.status === 'resolved')?.count || 0;
      const resolutionRate = totalReports > 0 ? ((resolvedCount / totalReports) * 100).toFixed(2) : 0;

      // 7. Temps moyen de résolution (signalements résolus)
      const resolvedReports = await Report.findAll({
        where: {
          ...whereClause,
          status: 'resolved'
        },
        attributes: ['id', 'created_at', 'updated_at']
      });

      let avgResolutionTime = 0;
      if (resolvedReports.length > 0) {
        const totalTime = resolvedReports.reduce((sum, report) => {
          const timeInDays = Math.floor(
            (new Date(report.updated_at) - new Date(report.created_at)) / (1000 * 60 * 60 * 24)
          );
          return sum + timeInDays;
        }, 0);
        avgResolutionTime = (totalTime / resolvedReports.length).toFixed(1);
      }

      logger.info(`Stats dashboard municipalité ${municipalityId}: ${totalReports} signalements`);

      return {
        success: true,
        data: {
          overview: {
            totalReports,
            reportsByStatus: reportsByStatus.reduce((acc, curr) => {
              acc[curr.status] = parseInt(curr.count);
              return acc;
            }, {}),
            resolutionRate: parseFloat(resolutionRate),
            avgResolutionTimeDays: parseFloat(avgResolutionTime),
            assignedCount,
            unassignedCount
          },
          reportsByCategory,
          topSupported,
          recentActivityCount: recentActivity
        }
      };

    } catch (error) {
      logger.error(`Erreur getDashboardStats: ${error.message}`, { error, municipalityId });
      throw error;
    }
  }

  /**
   * Obtenir les signalements assignés à un admin
   *
   * @param {Number} adminId - ID de l'admin
   * @param {Number} municipalityId - ID de la municipalité
   * @param {Object} options - Options de filtrage
   * @returns {Object} - Liste des signalements
   */
  async getMyAssignedReports(adminId, municipalityId, options = {}) {
    try {
      const {
        status = null,
        page = 1,
        limit = 20
      } = options;

      const offset = (page - 1) * limit;

      const where = {
        municipality_id: municipalityId,
        assigned_to_admin_id: adminId
      };

      if (status) {
        where.status = status;
      }

      const { count, rows: reports } = await Report.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'citizen',
            attributes: ['id', 'full_name', 'phone']
          },
          {
            model: Category,
            as: 'category'
          },
          {
            model: ReportPhoto,
            as: 'photos',
            limit: 1
          }
        ],
        order: [['priority_score', 'DESC'], ['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      logger.info(`Signalements assignés à admin ${adminId}: ${count} total`);

      return {
        success: true,
        data: {
          reports,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages
          }
        }
      };

    } catch (error) {
      logger.error(`Erreur getMyAssignedReports: ${error.message}`, { error, adminId });
      throw error;
    }
  }

  /**
   * Obtenir la liste de tous les admins de la municipalité
   * Pour l'assignation de signalements
   *
   * @param {Number} municipalityId - ID de la municipalité
   * @returns {Object} - Liste des admins
   */
  async getMunicipalityAdmins(municipalityId) {
    try {
      const admins = await User.findAll({
        where: {
          municipality_id: municipalityId,
          role: {
            [Op.in]: ['admin', 'super_admin']
          },
          is_active: true
        },
        attributes: ['id', 'full_name', 'phone', 'email', 'role', 'created_at'],
        order: [['full_name', 'ASC']]
      });

      logger.info(`Admins municipalité ${municipalityId}: ${admins.length} trouvés`);

      return {
        success: true,
        data: admins
      };

    } catch (error) {
      logger.error(`Erreur getMunicipalityAdmins: ${error.message}`, { error, municipalityId });
      throw error;
    }
  }
}

module.exports = new AdminService();
