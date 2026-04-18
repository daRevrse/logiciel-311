const jwt = require('jsonwebtoken');
const { User, Municipality, License } = require('../models');
const logger = require('../utils/logger');

/**
 * Service d'authentification
 * Supporte 2 méthodes :
 * 1. Device Fingerprinting (MVP)
 * 2. Téléphone + SMS (à implémenter)
 */

class AuthService {
  /**
   * Génère un token JWT pour un utilisateur
   * @param {Object} user - Instance User Sequelize
   * @returns {string} Token JWT
   */
  generateToken(user) {
    const payload = {
      userId: user.id,
      municipalityId: user.municipality_id,
      role: user.role
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return token;
  }

  /**
   * Vérifie qu'une municipalité a une licence valide
   * @param {number} municipalityId
   * @returns {Promise<boolean>}
   */
  async checkMunicipalityLicense(municipalityId) {
    const municipality = await Municipality.findByPk(municipalityId, {
      include: [{
        model: License,
        as: 'license',
        required: true
      }]
    });

    if (!municipality || !municipality.license) {
      return false;
    }

    const license = municipality.license;
    return license.isValid(); // Active ET non expirée
  }

  /**
   * MÉTHODE 1 : Authentification par Device Fingerprint
   * Utilisée pour MVP - Simple et rapide
   * @param {number} municipalityId
   * @param {string} deviceFingerprint
   * @param {string} fullName - Optionnel pour première connexion
   * @returns {Promise<Object>}
   */
  async loginByFingerprint(municipalityId, deviceFingerprint, fullName = null) {
    try {
      // Vérifier la licence
      const hasValidLicense = await this.checkMunicipalityLicense(municipalityId);
      if (!hasValidLicense) {
        throw new Error('Licence invalide ou expirée pour cette municipalité');
      }

      // Chercher ou créer l'utilisateur
      const { user, created } = await User.findOrCreateByFingerprint(
        municipalityId,
        deviceFingerprint
      );

      // Si nouvel utilisateur et nom fourni, l'ajouter
      if (created && fullName) {
        user.full_name = fullName;
        await user.save();
      }

      // Mettre à jour la dernière connexion
      await user.updateLastLogin();

      // Générer le token
      const token = this.generateToken(user);

      logger.info(`Connexion par fingerprint: User ${user.id} (${created ? 'nouveau' : 'existant'})`);

      return {
        success: true,
        isNewUser: created,
        user: {
          id: user.id,
          fullName: user.full_name,
          role: user.role,
          municipalityId: user.municipality_id
        },
        token
      };
    } catch (error) {
      logger.error('Erreur login fingerprint:', error);
      throw error;
    }
  }

  /**
   * MÉTHODE 2 : Authentification par Téléphone + SMS
   * Étape 1 : Demander un code de vérification
   * @param {number} municipalityId
   * @param {string} phone
   * @returns {Promise<Object>}
   */
  async requestVerificationCode(municipalityId, phone) {
    try {
      // Vérifier la licence
      const hasValidLicense = await this.checkMunicipalityLicense(municipalityId);
      if (!hasValidLicense) {
        throw new Error('Licence invalide ou expirée pour cette municipalité');
      }

      // Valider format téléphone (simple)
      const phoneRegex = /^\+?[0-9]{8,15}$/;
      if (!phoneRegex.test(phone)) {
        throw new Error('Format de téléphone invalide');
      }

      // Chercher ou créer l'utilisateur
      const { user, created } = await User.findOrCreateByPhone(
        municipalityId,
        phone
      );

      // Générer le code à 6 chiffres
      const verificationCode = user.generateVerificationCode();
      await user.save();

      // TODO: Envoyer le SMS avec le code
      // Pour MVP, on log le code (NE PAS FAIRE EN PRODUCTION!)
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`📱 CODE SMS pour ${phone}: ${verificationCode}`);
      }

      // Envoyer SMS (à implémenter)
      // await this.sendSMS(phone, verificationCode);

      logger.info(`Code de vérification demandé: ${phone} (User ${user.id})`);

      return {
        success: true,
        isNewUser: created,
        message: `Code de vérification envoyé au ${phone}`,
        // En développement seulement
        ...(process.env.NODE_ENV !== 'production' && { devCode: verificationCode })
      };
    } catch (error) {
      logger.error('Erreur demande code:', error);
      throw error;
    }
  }

  /**
   * MÉTHODE 2 : Authentification par Téléphone + SMS
   * Étape 2 : Vérifier le code et connecter
   * @param {number} municipalityId
   * @param {string} phone
   * @param {string} code
   * @param {string} fullName - Optionnel pour première connexion
   * @returns {Promise<Object>}
   */
  async verifyCodeAndLogin(municipalityId, phone, code, fullName = null) {
    try {
      // Trouver l'utilisateur
      const user = await User.findOne({
        where: {
          municipality_id: municipalityId,
          phone: phone
        }
      });

      if (!user) {
        throw new Error('Utilisateur non trouvé. Demandez d\'abord un code.');
      }

      // Vérifier le code
      const isValid = user.verifyCode(code);
      if (!isValid) {
        throw new Error('Code invalide ou expiré');
      }

      // Si nouveau et nom fourni
      const isNewUser = !user.full_name;
      if (isNewUser && fullName) {
        user.full_name = fullName;
      }

      // Effacer le code de vérification
      user.verification_code = null;
      user.verification_expires_at = null;
      await user.save();

      // Mettre à jour dernière connexion
      await user.updateLastLogin();

      // Générer le token
      const token = this.generateToken(user);

      logger.info(`Connexion par SMS réussie: User ${user.id}`);

      return {
        success: true,
        isNewUser,
        user: {
          id: user.id,
          fullName: user.full_name,
          phone: user.phone,
          role: user.role,
          municipalityId: user.municipality_id
        },
        token
      };
    } catch (error) {
      logger.error('Erreur vérification code:', error);
      throw error;
    }
  }

  /**
   * ADMIN : Authentification par email et mot de passe
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>}
   */
  async loginAdmin(email, password, expectedMunicipalitySlug = null) {
    try {
      const user = await User.findOne({
        where: {
          email: email,
          role: ['admin', 'super_admin']
        },
        include: [{
          model: Municipality,
          as: 'municipality',
          attributes: ['id', 'name', 'slug', 'logo_url', 'region', 'settings'],
          include: [{
            model: License,
            as: 'license',
            attributes: ['id', 'license_key', 'is_active', 'expires_at']
          }]
        }]
      });

      if (!user) {
        throw new Error('Email ou mot de passe invalide');
      }

      if (!user.is_active) {
        throw new Error('Compte désactivé');
      }

      // Vérifier le mot de passe
      console.log(`[AUTH DEBUG] Tentative pour: ${user.email}`);
      const isPasswordValid = await user.comparePassword(password);
      console.log(`[AUTH DEBUG] Résultat comparaison: ${isPasswordValid}`);
      
      if (!isPasswordValid) {
        throw new Error('Email ou mot de passe invalide');
      }

      // Si la connexion se fait via un lien mairie-spécifique, vérifier
      // que l'admin appartient bien à cette mairie (super_admin exempté).
      if (expectedMunicipalitySlug && user.role !== 'super_admin') {
        if (!user.municipality || user.municipality.slug !== expectedMunicipalitySlug) {
          throw new Error('Accès refusé pour cette mairie');
        }
      }

      // Mettre à jour dernière connexion
      await user.updateLastLogin();

      // Générer token
      const token = this.generateToken(user);

      logger.info(`Connexion admin: User ${user.id} (${user.role})`);

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone,
          role: user.role,
          municipalityId: user.municipality_id,
          municipality: user.municipality ? {
            id: user.municipality.id,
            name: user.municipality.name,
            slug: user.municipality.slug,
            logo_url: user.municipality.logo_url,
            region: user.municipality.region,
            settings: user.municipality.settings,
            license: user.municipality.license
          } : null
        },
        token
      };
    } catch (error) {
      logger.error('Erreur login admin:', error);
      throw error;
    }
  }

  /**
   * Récupère les informations de l'utilisateur connecté
   * @param {number} userId
   * @returns {Promise<Object>}
   */
  async getProfile(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [{
          model: Municipality,
          as: 'municipality',
          attributes: ['id', 'name', 'region', 'logo_url', 'slug', 'settings'],
          include: [{
            model: License,
            as: 'license',
            attributes: ['id', 'license_key', 'is_active', 'expires_at']
          }]
        }],
        attributes: { exclude: ['verification_code', 'verification_expires_at'] }
      });

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      return {
        success: true,
        user: {
          id: user.id,
          fullName: user.full_name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          isActive: user.is_active,
          lastLogin: user.last_login,
          municipality: user.municipality ? {
            id: user.municipality.id,
            name: user.municipality.name,
            slug: user.municipality.slug,
            region: user.municipality.region,
            logo_url: user.municipality.logo_url,
            settings: user.municipality.settings,
            license: user.municipality.license
          } : null,
          createdAt: user.created_at
        }
      };
    } catch (error) {
      logger.error('Erreur récupération profil:', error);
      throw error;
    }
  }

  /**
   * Met à jour le profil utilisateur
   * @param {number} userId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateProfile(userId, updates) {
    try {
      const user = await User.findByPk(userId);

      if (!user) {
        throw new Error('Utilisateur non trouvé');
      }

      // Champs modifiables
      const allowedFields = ['full_name', 'email'];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          user[field] = updates[field];
        }
      }

      await user.save();

      logger.info(`Profil mis à jour: User ${userId}`);

      return {
        success: true,
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email
        }
      };
    } catch (error) {
      logger.error('Erreur mise à jour profil:', error);
      throw error;
    }
  }

  /**
   * Envoie un SMS (à implémenter avec provider togolais)
   * @param {string} phone
   * @param {string} code
   * @private
   */
  async sendSMS(phone, code) {
    // TODO: Intégrer avec un provider SMS togolais
    // Exemples: Twilio, AfricasTalking, ou provider local

    const message = `Votre code de vérification 311 est: ${code}. Valide 10 minutes.`;

    logger.info(`SMS à envoyer à ${phone}: ${message}`);

    // Exemple d'intégration future:
    /*
    const smsProvider = require('./smsProvider');
    await smsProvider.send({
      to: phone,
      message: message,
      senderId: process.env.SMS_SENDER_ID
    });
    */
  }
}

module.exports = new AuthService();
