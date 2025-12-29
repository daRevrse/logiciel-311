const licenseService = require('../services/licenseService');
const logger = require('../utils/logger');

/**
 * Contrôleur de gestion des licences
 * PRIORITÉ #1 - Routes administration des licences
 */

class LicenseController {
  /**
   * Génère une nouvelle licence
   * POST /api/licenses/generate
   * Réservé aux super administrateurs
   */
  async generateLicense(req, res) {
    try {
      const {
        municipalityName,
        contactEmail,
        contactPhone,
        durationYears,
        maxUsers,
        maxAdmins,
        features
      } = req.body;

      // Validation
      if (!municipalityName || !contactEmail) {
        return res.status(400).json({
          success: false,
          message: 'Nom de municipalité et email requis'
        });
      }

      const license = await licenseService.generateLicense({
        municipalityName,
        contactEmail,
        contactPhone,
        durationYears: durationYears || 1,
        maxUsers: maxUsers || 1000,
        maxAdmins: maxAdmins || 50,
        features: features || {}
      });

      res.status(201).json({
        success: true,
        message: 'Licence générée avec succès',
        data: {
          id: license.id,
          licenseKey: license.license_key,
          municipalityName: license.municipality_name,
          contactEmail: license.contact_email,
          issuedAt: license.issued_at,
          expiresAt: license.expires_at,
          maxUsers: license.max_users,
          maxAdmins: license.max_admins,
          features: license.features
        }
      });
    } catch (error) {
      logger.error('Erreur génération licence:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération de la licence',
        error: error.message
      });
    }
  }

  /**
   * Valide une clé de licence
   * POST /api/licenses/validate
   * Public (pour permettre validation avant activation)
   */
  async validateLicense(req, res) {
    try {
      const { licenseKey } = req.body;

      if (!licenseKey) {
        return res.status(400).json({
          success: false,
          message: 'Clé de licence requise'
        });
      }

      const validation = await licenseService.validateLicenseKey(licenseKey);

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message
        });
      }

      res.json({
        success: true,
        message: 'Licence valide',
        data: {
          valid: true,
          municipalityName: validation.license.municipality_name,
          expiresAt: validation.license.expires_at,
          daysRemaining: validation.daysRemaining,
          features: validation.license.features
        }
      });
    } catch (error) {
      logger.error('Erreur validation licence:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la validation de la licence'
      });
    }
  }

  /**
   * Active une licence pour une municipalité
   * POST /api/licenses/activate
   * Public (première installation)
   */
  async activateLicense(req, res) {
    try {
      const {
        licenseKey,
        name,
        region,
        logoUrl,
        contactEmail,
        contactPhone,
        address,
        settings
      } = req.body;

      if (!licenseKey || !name) {
        return res.status(400).json({
          success: false,
          message: 'Clé de licence et nom de municipalité requis'
        });
      }

      const municipality = await licenseService.activateLicense(licenseKey, {
        name,
        region,
        logoUrl,
        contactEmail,
        contactPhone,
        address,
        settings
      });

      res.status(201).json({
        success: true,
        message: 'Licence activée avec succès',
        data: {
          municipalityId: municipality.id,
          name: municipality.name,
          region: municipality.region
        }
      });
    } catch (error) {
      logger.error('Erreur activation licence:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de l\'activation de la licence'
      });
    }
  }

  /**
   * Renouvelle une licence
   * PUT /api/licenses/:id/renew
   * Réservé aux super administrateurs
   */
  async renewLicense(req, res) {
    try {
      const { id } = req.params;
      const { additionalYears } = req.body;

      if (!additionalYears || additionalYears < 1) {
        return res.status(400).json({
          success: false,
          message: 'Durée de renouvellement invalide'
        });
      }

      const license = await licenseService.renewLicense(
        parseInt(id),
        parseInt(additionalYears)
      );

      res.json({
        success: true,
        message: `Licence renouvelée de ${additionalYears} an(s)`,
        data: {
          licenseKey: license.license_key,
          expiresAt: license.expires_at,
          daysRemaining: license.daysRemaining()
        }
      });
    } catch (error) {
      logger.error('Erreur renouvellement licence:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors du renouvellement'
      });
    }
  }

  /**
   * Désactive une licence
   * PUT /api/licenses/:id/deactivate
   * Réservé aux super administrateurs
   */
  async deactivateLicense(req, res) {
    try {
      const { id } = req.params;

      const license = await licenseService.deactivateLicense(parseInt(id));

      res.json({
        success: true,
        message: 'Licence désactivée',
        data: {
          licenseKey: license.license_key,
          isActive: license.is_active
        }
      });
    } catch (error) {
      logger.error('Erreur désactivation licence:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de la désactivation'
      });
    }
  }

  /**
   * Met à jour les fonctionnalités
   * PUT /api/licenses/:id/features
   * Réservé aux super administrateurs
   */
  async updateFeatures(req, res) {
    try {
      const { id } = req.params;
      const { features } = req.body;

      if (!features || typeof features !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Fonctionnalités invalides'
        });
      }

      const license = await licenseService.updateFeatures(parseInt(id), features);

      res.json({
        success: true,
        message: 'Fonctionnalités mises à jour',
        data: {
          licenseKey: license.license_key,
          features: license.features
        }
      });
    } catch (error) {
      logger.error('Erreur mise à jour fonctionnalités:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de la mise à jour'
      });
    }
  }

  /**
   * Liste toutes les licences
   * GET /api/licenses
   * Réservé aux super administrateurs
   */
  async getAllLicenses(req, res) {
    try {
      const licenses = await licenseService.getAllLicenses();

      res.json({
        success: true,
        count: licenses.length,
        data: licenses
      });
    } catch (error) {
      logger.error('Erreur récupération licences:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des licences'
      });
    }
  }

  /**
   * Récupère les détails d'une licence
   * GET /api/licenses/:id
   * Réservé aux super administrateurs
   */
  async getLicenseById(req, res) {
    try {
      const { id } = req.params;
      const { License, Municipality } = require('../models');

      const license = await License.findByPk(id, {
        include: [{
          model: Municipality,
          as: 'municipality'
        }]
      });

      if (!license) {
        return res.status(404).json({
          success: false,
          message: 'Licence non trouvée'
        });
      }

      const licenseData = license.toJSON();

      res.json({
        success: true,
        data: {
          ...licenseData,
          status: license.isValid() ? 'active' : (license.isExpired() ? 'expired' : 'inactive'),
          daysRemaining: license.daysRemaining()
        }
      });
    } catch (error) {
      logger.error('Erreur récupération licence:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la licence'
      });
    }
  }

  /**
   * Vérifie les licences qui expirent bientôt
   * GET /api/licenses/expiring
   * Réservé aux super administrateurs
   */
  async getExpiringLicenses(req, res) {
    try {
      const expiringLicenses = await licenseService.checkExpiringLicenses();

      res.json({
        success: true,
        count: expiringLicenses.length,
        data: expiringLicenses.map(license => ({
          id: license.id,
          licenseKey: license.license_key,
          municipalityName: license.municipality_name,
          expiresAt: license.expires_at,
          daysRemaining: license.daysRemaining(),
          municipality: license.municipality
        }))
      });
    } catch (error) {
      logger.error('Erreur vérification licences expirées:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification'
      });
    }
  }
}

module.exports = new LicenseController();
