/**
 * Service de Notifications
 * Gère l'envoi de notifications par email, SMS et push
 *
 * Fonctionnalités :
 * - Email (Nodemailer)
 * - SMS (à intégrer avec provider)
 * - Notifications automatiques changement statut
 * - Préférences notifications citoyens
 * - Templates emails personnalisables
 * - Logs historique envois
 */

const nodemailer = require('nodemailer');
const { Notification, User, Report, Municipality } = require('../models');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class NotificationService {
  constructor() {
    // Configuration transporteur email (Nodemailer)
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Vérifier la configuration au démarrage
    this.verifyEmailConfig();
  }

  /**
   * Vérifier la configuration email
   */
  async verifyEmailConfig() {
    try {
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        await this.transporter.verify();
        logger.info('✅ Configuration email vérifiée');
      } else {
        logger.warn('⚠️ Configuration email manquante (SMTP_USER, SMTP_PASS)');
      }
    } catch (error) {
      logger.warn(`⚠️ Erreur vérification email: ${error.message}`);
    }
  }

  /**
   * Envoyer un email
   *
   * @param {Object} options - Options email
   * @param {String} options.to - Destinataire
   * @param {String} options.subject - Sujet
   * @param {String} options.html - Contenu HTML
   * @param {String} options.text - Contenu texte (optionnel)
   * @returns {Object} - Résultat envoi
   */
  async sendEmail({ to, subject, html, text = null }) {
    try {
      // Vérifier configuration
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.warn('Email non envoyé: configuration manquante');
        return {
          success: false,
          message: 'Configuration email manquante'
        };
      }

      const mailOptions = {
        from: `"${process.env.APP_NAME || 'Logiciel 311'}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '') // Fallback texte brut
      };

      const info = await this.transporter.sendMail(mailOptions);

      logger.info(`✅ Email envoyé: ${to} - ${subject}`);

      return {
        success: true,
        messageId: info.messageId
      };

    } catch (error) {
      logger.error(`Erreur sendEmail: ${error.message}`, { error, to, subject });
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Envoyer un SMS
   * TODO: Intégrer avec provider SMS (Twilio, AfricasTalking, etc.)
   *
   * @param {String} phone - Numéro téléphone
   * @param {String} message - Message SMS
   * @returns {Object} - Résultat envoi
   */
  async sendSMS(phone, message) {
    try {
      // Pour l'instant, juste logger (à intégrer avec provider SMS)
      logger.info(`📱 SMS à envoyer: ${phone} - ${message}`);

      // TODO: Intégrer AfricasTalking ou Twilio
      // const response = await africasTalking.sms.send({ to: phone, message });

      return {
        success: true,
        message: 'SMS envoyé (mode simulation)'
      };

    } catch (error) {
      logger.error(`Erreur sendSMS: ${error.message}`, { error, phone });
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Charger un template email
   *
   * @param {String} templateName - Nom du template
   * @param {Object} variables - Variables à remplacer
   * @returns {String} - HTML du template
   */
  async loadEmailTemplate(templateName, variables = {}) {
    try {
      const templatePath = path.join(
        __dirname,
        '..',
        'templates',
        'emails',
        `${templateName}.html`
      );

      let html = await fs.readFile(templatePath, 'utf8');

      // Remplacer les variables {{variable}}
      Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, variables[key]);
      });

      return html;

    } catch (error) {
      logger.error(`Erreur loadEmailTemplate: ${error.message}`, { templateName });
      // Fallback simple
      return this.getDefaultTemplate(templateName, variables);
    }
  }

  /**
   * Template par défaut si fichier non trouvé
   */
  getDefaultTemplate(templateName, variables) {
    const { municipalityName, reportTitle, reportId, status, comment } = variables;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${municipalityName || 'Logiciel 311'}</h1>
          </div>
          <div class="content">
            <h2>Mise à jour de votre signalement #${reportId}</h2>
            <p><strong>Titre :</strong> ${reportTitle}</p>
            <p><strong>Nouveau statut :</strong> ${status}</p>
            ${comment ? `<p><strong>Commentaire :</strong> ${comment}</p>` : ''}
            <p>Merci d'avoir utilisé notre service de signalement citoyen.</p>
          </div>
          <div class="footer">
            <p>&copy; 2025 ${municipalityName || 'Logiciel 311'}. Tous droits réservés.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Notifier citoyen du changement de statut
   *
   * @param {Number} reportId - ID du signalement
   * @param {String} newStatus - Nouveau statut
   * @param {String} comment - Commentaire admin (optionnel)
   * @returns {Object} - Résultat envoi
   */
  async notifyStatusChange(reportId, newStatus, comment = null) {
    try {
      // Charger le signalement avec relations
      const report = await Report.findByPk(reportId, {
        include: [
          {
            model: User,
            as: 'citizen',
            attributes: ['id', 'full_name', 'email', 'phone'],
            required: false
          },
          {
            model: Municipality,
            as: 'municipality',
            attributes: ['name']
          }
        ]
      });

      if (!report || !report.citizen) {
        logger.warn(`Notification impossible: signalement ${reportId} ou citoyen introuvable`);
        return { success: false, message: 'Signalement ou citoyen introuvable' };
      }

      const citizen = report.citizen;
      const statusLabels = {
        pending: 'En attente',
        in_progress: 'En cours de traitement',
        resolved: 'Résolu',
        rejected: 'Rejeté'
      };

      const statusLabel = statusLabels[newStatus] || newStatus;

      // Préparer variables template
      const variables = {
        citizenName: citizen.full_name,
        municipalityName: report.municipality.name,
        reportId: report.id,
        reportTitle: report.title,
        status: statusLabel,
        comment: comment || '',
        viewUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reports/${report.id}`
      };

      const results = {
        email: { success: false },
        sms: { success: false }
      };

      // Envoyer email si disponible
      if (citizen.email) {
        const subject = `[Signalement #${report.id}] ${statusLabel}`;
        const html = await this.loadEmailTemplate('status-change', variables);

        results.email = await this.sendEmail({
          to: citizen.email,
          subject,
          html
        });
      }

      // Envoyer SMS si résolu et téléphone disponible
      if (newStatus === 'resolved' && citizen.phone) {
        const smsMessage = `Votre signalement #${report.id} "${report.title}" a été résolu. Merci! - ${report.municipality.name}`;
        results.sms = await this.sendSMS(citizen.phone, smsMessage);
      }

      // Enregistrer dans notifications table
      await Notification.create({
        user_id: citizen.id,
        type: 'status_change',
        title: `Signalement #${report.id} - ${statusLabel}`,
        message: comment || `Votre signalement est maintenant ${statusLabel.toLowerCase()}`,
        related_report_id: report.id,
        is_read: false
      });

      logger.info(`✅ Notification envoyée: Signalement ${reportId} → ${newStatus} pour citoyen ${citizen.id}`);

      return {
        success: true,
        data: {
          emailSent: results.email.success,
          smsSent: results.sms.success
        }
      };

    } catch (error) {
      logger.error(`Erreur notifyStatusChange: ${error.message}`, { error, reportId });
      throw error;
    }
  }

  /**
   * Notifier admin d'un nouveau signalement
   *
   * @param {Number} reportId - ID du signalement
   * @returns {Object} - Résultat envoi
   */
  async notifyAdminNewReport(reportId) {
    try {
      const report = await Report.findByPk(reportId, {
        include: [
          {
            model: User,
            as: 'citizen',
            attributes: ['full_name'],
            required: false
          },
          {
            model: Municipality,
            as: 'municipality',
            attributes: ['name']
          }
        ]
      });

      if (!report) {
        return { success: false, message: 'Signalement introuvable' };
      }

      // Trouver tous les admins actifs de la municipalité
      const admins = await User.findAll({
        where: {
          municipality_id: report.municipality_id,
          role: ['admin', 'super_admin'],
          is_active: true
        },
        attributes: ['id', 'full_name', 'email']
      });

      const emailPromises = admins
        .filter(admin => admin.email)
        .map(admin => {
          const variables = {
            adminName: admin.full_name,
            municipalityName: report.municipality.name,
            reportId: report.id,
            reportTitle: report.title,
            citizenName: report.citizen ? report.citizen.full_name : 'Citoyen Anonyme',
            reportDescription: report.description,
            reportAddress: report.address,
            viewUrl: `${process.env.ADMIN_URL || 'http://localhost:5173/admin'}/reports/${report.id}`
          };

          return this.loadEmailTemplate('new-report-admin', variables)
            .then(html => this.sendEmail({
              to: admin.email,
              subject: `[Nouveau] Signalement #${report.id} - ${report.title}`,
              html
            }));
        });

      await Promise.all(emailPromises);

      logger.info(`✅ Notification admins: Nouveau signalement ${reportId}`);

      return {
        success: true,
        data: {
          adminCount: admins.length,
          emailsSent: admins.filter(a => a.email).length
        }
      };

    } catch (error) {
      logger.error(`Erreur notifyAdminNewReport: ${error.message}`, { error, reportId });
      throw error;
    }
  }

  /**
   * Notifier admin qu'un signalement lui a été assigné
   *
   * @param {Number} reportId - ID du signalement
   * @param {Number} adminId - ID de l'admin assigné
   * @returns {Object} - Résultat envoi
   */
  async notifyAdminAssignment(reportId, adminId) {
    try {
      const report = await Report.findByPk(reportId, {
        include: [
          {
            model: Municipality,
            as: 'municipality',
            attributes: ['name']
          }
        ]
      });

      const admin = await User.findByPk(adminId, {
        attributes: ['id', 'full_name', 'email']
      });

      if (!report || !admin || !admin.email) {
        return { success: false, message: 'Signalement ou admin introuvable' };
      }

      const variables = {
        adminName: admin.full_name,
        municipalityName: report.municipality.name,
        reportId: report.id,
        reportTitle: report.title,
        reportAddress: report.address,
        viewUrl: `${process.env.ADMIN_URL || 'http://localhost:5173/admin'}/reports/${report.id}`
      };

      const html = await this.loadEmailTemplate('assignment-admin', variables);

      await this.sendEmail({
        to: admin.email,
        subject: `[Assigné] Signalement #${report.id} vous a été assigné`,
        html
      });

      // Créer notification
      await Notification.create({
        user_id: admin.id,
        type: 'assignment',
        title: `Signalement #${report.id} assigné`,
        message: `Le signalement "${report.title}" vous a été assigné`,
        related_report_id: report.id,
        is_read: false
      });

      logger.info(`✅ Notification assignation: Signalement ${reportId} → Admin ${adminId}`);

      return { success: true };

    } catch (error) {
      logger.error(`Erreur notifyAdminAssignment: ${error.message}`, { error, reportId, adminId });
      throw error;
    }
  }

  /**
   * Obtenir les préférences de notification d'un utilisateur
   *
   * @param {Number} userId - ID de l'utilisateur
   * @returns {Object} - Préférences
   */
  async getUserPreferences(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'phone', 'notification_preferences']
      });

      if (!user) {
        return { success: false, message: 'Utilisateur introuvable' };
      }

      // Préférences par défaut si non définies
      const defaultPreferences = {
        email_status_change: true,
        email_new_support: false,
        sms_resolved: true,
        push_enabled: false
      };

      const preferences = user.notification_preferences
        ? JSON.parse(user.notification_preferences)
        : defaultPreferences;

      return {
        success: true,
        data: {
          hasEmail: !!user.email,
          hasPhone: !!user.phone,
          preferences
        }
      };

    } catch (error) {
      logger.error(`Erreur getUserPreferences: ${error.message}`, { error, userId });
      throw error;
    }
  }

  /**
   * Mettre à jour les préférences de notification
   *
   * @param {Number} userId - ID de l'utilisateur
   * @param {Object} preferences - Nouvelles préférences
   * @returns {Object} - Résultat mise à jour
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        return { success: false, message: 'Utilisateur introuvable' };
      }

      user.notification_preferences = JSON.stringify(preferences);
      await user.save();

      logger.info(`✅ Préférences notifications mises à jour: User ${userId}`);

      return {
        success: true,
        data: { preferences }
      };

    } catch (error) {
      logger.error(`Erreur updateUserPreferences: ${error.message}`, { error, userId });
      throw error;
    }
  }

  /**
   * Obtenir l'historique des notifications d'un utilisateur
   *
   * @param {Number} userId - ID de l'utilisateur
   * @param {Object} options - Options de pagination
   * @returns {Object} - Historique notifications
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        unreadOnly = false
      } = options;

      const offset = (page - 1) * limit;

      const where = { user_id: userId };
      if (unreadOnly) {
        where.is_read = false;
      }

      const { count, rows: notifications } = await Notification.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const totalPages = Math.ceil(count / limit);

      return {
        success: true,
        data: {
          notifications,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages
          }
        }
      };

    } catch (error) {
      logger.error(`Erreur getUserNotifications: ${error.message}`, { error, userId });
      throw error;
    }
  }

  /**
   * Marquer une notification comme lue
   *
   * @param {Number} notificationId - ID de la notification
   * @param {Number} userId - ID de l'utilisateur (vérification ownership)
   * @returns {Object} - Résultat
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        where: {
          id: notificationId,
          user_id: userId
        }
      });

      if (!notification) {
        return { success: false, message: 'Notification introuvable' };
      }

      notification.is_read = true;
      await notification.save();

      return { success: true };

    } catch (error) {
      logger.error(`Erreur markAsRead: ${error.message}`, { error, notificationId });
      throw error;
    }
  }

  /**
   * Marquer toutes les notifications comme lues
   *
   * @param {Number} userId - ID de l'utilisateur
   * @returns {Object} - Résultat
   */
  async markAllAsRead(userId) {
    try {
      const updated = await Notification.update(
        { is_read: true },
        {
          where: {
            user_id: userId,
            is_read: false
          }
        }
      );

      return {
        success: true,
        data: {
          updated: updated[0]
        }
      };

    } catch (error) {
      logger.error(`Erreur markAllAsRead: ${error.message}`, { error, userId });
      throw error;
    }
  }
}

module.exports = new NotificationService();
