const crypto = require('crypto');
const { License, Municipality } = require('../models');
const logger = require('../utils/logger');

/**
 * Service de gestion des licences
 * PRIORITÉ #1 - Système critique pour le modèle commercial
 */

class LicenseService {
  /**
   * Génère une nouvelle licence
   * @param {Object} licenseData
   * @returns {Promise<License>}
   */
  async generateLicense(licenseData) {
    try {
      const {
        municipalityName,
        contactEmail,
        contactPhone,
        durationYears = 1,
        maxUsers = 1000,
        maxAdmins = 50,
        features = {}
      } = licenseData;

      // Valider les données
      if (!municipalityName || !contactEmail) {
        throw new Error('Nom de municipalité et email de contact requis');
      }

      // Calculer la date d'expiration
      const issuedAt = new Date();
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + durationYears);

      // Fonctionnalités par défaut
      const defaultFeatures = {
        notifications: true,
        map: true,
        statistics: true,
        export: false,
        ...features
      };

      // Créer la licence
      const license = await License.create({
        municipality_name: municipalityName,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        issued_at: issuedAt,
        expires_at: expiresAt,
        is_active: true,
        max_users: maxUsers,
        max_admins: maxAdmins,
        features: defaultFeatures
      });

      logger.info(`Nouvelle licence générée: ${license.license_key} pour ${municipalityName}`);

      return license;
    } catch (error) {
      logger.error('Erreur génération licence:', error);
      throw error;
    }
  }

  /**
   * Valide une clé de licence
   * @param {string} licenseKey
   * @returns {Promise<Object>}
   */
  async validateLicenseKey(licenseKey) {
    try {
      // Vérifier le format
      if (!License.isValidKeyFormat(licenseKey)) {
        return {
          valid: false,
          message: 'Format de clé invalide'
        };
      }

      // Chercher la licence
      const license = await License.findOne({
        where: { license_key: licenseKey },
        include: [{
          model: Municipality,
          as: 'municipality'
        }]
      });

      if (!license) {
        return {
          valid: false,
          message: 'Clé de licence non trouvée'
        };
      }

      // Vérifier si active
      if (!license.is_active) {
        return {
          valid: false,
          message: 'Licence désactivée',
          license
        };
      }

      // Vérifier si expirée
      if (license.isExpired()) {
        return {
          valid: false,
          message: 'Licence expirée',
          license,
          expiredAt: license.expires_at
        };
      }

      return {
        valid: true,
        message: 'Licence valide',
        license,
        daysRemaining: license.daysRemaining()
      };
    } catch (error) {
      logger.error('Erreur validation licence:', error);
      throw error;
    }
  }

  /**
   * Active une licence pour une municipalité
   * @param {string} licenseKey
   * @param {Object} municipalityData
   * @returns {Promise<Municipality>}
   */
  async activateLicense(licenseKey, municipalityData) {
    try {
      // Valider la clé
      const validation = await this.validateLicenseKey(licenseKey);

      if (!validation.valid) {
        throw new Error(validation.message);
      }

      const license = validation.license;

      // Vérifier que la licence n'est pas déjà utilisée
      if (license.municipality) {
        throw new Error('Cette licence est déjà activée pour une municipalité');
      }

      // Créer la municipalité
      const municipality = await Municipality.create({
        license_id: license.id,
        name: municipalityData.name || license.municipality_name,
        region: municipalityData.region,
        logo_url: municipalityData.logoUrl,
        contact_email: municipalityData.contactEmail || license.contact_email,
        contact_phone: municipalityData.contactPhone || license.contact_phone,
        address: municipalityData.address,
        settings: municipalityData.settings || {}
      });

      logger.info(`Licence ${licenseKey} activée pour municipalité ${municipality.name}`);

      return municipality;
    } catch (error) {
      logger.error('Erreur activation licence:', error);
      throw error;
    }
  }

  /**
   * Renouvelle une licence
   * @param {number} licenseId
   * @param {number} additionalYears
   * @returns {Promise<License>}
   */
  async renewLicense(licenseId, additionalYears = 1) {
    try {
      const license = await License.findByPk(licenseId);

      if (!license) {
        throw new Error('Licence non trouvée');
      }

      // Calculer la nouvelle date d'expiration
      const currentExpiry = new Date(license.expires_at);
      const now = new Date();

      // Si déjà expirée, partir d'aujourd'hui, sinon prolonger
      const baseDate = currentExpiry > now ? currentExpiry : now;

      const newExpiry = new Date(baseDate);
      newExpiry.setFullYear(newExpiry.getFullYear() + additionalYears);

      // Mettre à jour
      license.expires_at = newExpiry;
      license.is_active = true; // Réactiver si désactivée
      await license.save();

      logger.info(`Licence ${license.license_key} renouvelée jusqu'au ${newExpiry.toISOString()}`);

      return license;
    } catch (error) {
      logger.error('Erreur renouvellement licence:', error);
      throw error;
    }
  }

  /**
   * Désactive une licence
   * @param {number} licenseId
   * @returns {Promise<License>}
   */
  async deactivateLicense(licenseId) {
    try {
      const license = await License.findByPk(licenseId);

      if (!license) {
        throw new Error('Licence non trouvée');
      }

      license.is_active = false;
      await license.save();

      logger.warn(`Licence ${license.license_key} désactivée`);

      return license;
    } catch (error) {
      logger.error('Erreur désactivation licence:', error);
      throw error;
    }
  }

  /**
   * Met à jour les fonctionnalités d'une licence
   * @param {number} licenseId
   * @param {Object} features
   * @returns {Promise<License>}
   */
  async updateFeatures(licenseId, features) {
    try {
      const license = await License.findByPk(licenseId);

      if (!license) {
        throw new Error('Licence non trouvée');
      }

      license.features = {
        ...license.features,
        ...features
      };

      await license.save();

      logger.info(`Fonctionnalités mises à jour pour licence ${license.license_key}`);

      return license;
    } catch (error) {
      logger.error('Erreur mise à jour fonctionnalités:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les licences avec statistiques
   * @returns {Promise<Array>}
   */
  async getAllLicenses() {
    try {
      const licenses = await License.findAll({
        include: [{
          model: Municipality,
          as: 'municipality',
          required: false
        }],
        order: [['created_at', 'DESC']]
      });

      // Enrichir avec des statistiques
      const enrichedLicenses = licenses.map(license => {
        const licenseData = license.toJSON();

        return {
          ...licenseData,
          status: license.isValid() ? 'active' : (license.isExpired() ? 'expired' : 'inactive'),
          daysRemaining: license.daysRemaining(),
          isActivated: !!license.municipality
        };
      });

      return enrichedLicenses;
    } catch (error) {
      logger.error('Erreur récupération licences:', error);
      throw error;
    }
  }

  /**
   * Vérifie les licences expirées et envoie des alertes
   * (À exécuter via un cron job)
   */
  async checkExpiringLicenses() {
    try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const expiringLicenses = await License.findAll({
        where: {
          is_active: true,
          expires_at: {
            [License.sequelize.Sequelize.Op.lte]: thirtyDaysFromNow,
            [License.sequelize.Sequelize.Op.gte]: new Date()
          }
        },
        include: [{
          model: Municipality,
          as: 'municipality'
        }]
      });

      logger.info(`${expiringLicenses.length} licence(s) expire(nt) dans les 30 prochains jours`);

      // TODO: Envoyer des emails d'alerte
      for (const license of expiringLicenses) {
        const daysRemaining = license.daysRemaining();
        logger.warn(`Licence ${license.license_key} expire dans ${daysRemaining} jours`);
        // Implémenter l'envoi d'email ici
      }

      return expiringLicenses;
    } catch (error) {
      logger.error('Erreur vérification licences expirées:', error);
      throw error;
    }
  }
}

module.exports = new LicenseService();
