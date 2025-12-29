const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    municipality_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'municipality_id',
      references: {
        model: 'municipalities',
        key: 'id'
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      validate: {
        isValidPhone(value) {
          if (value && !/^\+?[0-9]{8,15}$/.test(value)) {
            throw new Error('Numéro de téléphone invalide');
          }
        }
      }
    },
    device_fingerprint: {
      type: DataTypes.STRING(255),
      field: 'device_fingerprint'
    },
    email: {
      type: DataTypes.STRING(255),
      validate: {
        isEmail: { msg: 'Email invalide' }
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      field: 'password_hash'
    },
    full_name: {
      type: DataTypes.STRING(255),
      field: 'full_name'
    },
    role: {
      type: DataTypes.ENUM('citizen', 'admin', 'super_admin'),
      defaultValue: 'citizen',
      validate: {
        isIn: {
          args: [['citizen', 'admin', 'super_admin']],
          msg: 'Rôle invalide'
        }
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    last_login: {
      type: DataTypes.DATE,
      field: 'last_login'
    },
    verification_code: {
      type: DataTypes.STRING(10),
      field: 'verification_code'
    },
    verification_expires_at: {
      type: DataTypes.DATE,
      field: 'verification_expires_at'
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['municipality_id'] },
      { fields: ['phone'] },
      { fields: ['device_fingerprint'] },
      { fields: ['role'] }
    ]
  });

  // ============================================
  // MÉTHODES D'INSTANCE
  // ============================================

  /**
   * Vérifie si l'utilisateur est un citoyen
   * @returns {boolean}
   */
  User.prototype.isCitizen = function() {
    return this.role === 'citizen';
  };

  /**
   * Vérifie si l'utilisateur est un administrateur
   * @returns {boolean}
   */
  User.prototype.isAdmin = function() {
    return this.role === 'admin' || this.role === 'super_admin';
  };

  /**
   * Vérifie si l'utilisateur est un super administrateur
   * @returns {boolean}
   */
  User.prototype.isSuperAdmin = function() {
    return this.role === 'super_admin';
  };

  /**
   * Vérifie si l'utilisateur peut accéder à une municipalité
   * @param {number} municipalityId
   * @returns {boolean}
   */
  User.prototype.canAccessMunicipality = function(municipalityId) {
    return this.municipality_id === municipalityId;
  };

  /**
   * Génère un code de vérification à 6 chiffres
   * @returns {string}
   */
  User.prototype.generateVerificationCode = function() {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.verification_code = code;

    // Expire dans 10 minutes
    this.verification_expires_at = new Date(Date.now() + 10 * 60 * 1000);

    return code;
  };

  /**
   * Vérifie si le code de vérification est valide
   * @param {string} code
   * @returns {boolean}
   */
  User.prototype.verifyCode = function(code) {
    if (!this.verification_code || !this.verification_expires_at) {
      return false;
    }

    const isExpired = new Date() > new Date(this.verification_expires_at);
    const isMatch = this.verification_code === code;

    return !isExpired && isMatch;
  };

  /**
   * Met à jour la date de dernière connexion
   */
  User.prototype.updateLastLogin = async function() {
    this.last_login = new Date();
    await this.save();
  };

  /**
   * Définit le mot de passe (hash automatiquement)
   * @param {string} password
   */
  User.prototype.setPassword = async function(password) {
    const salt = await bcrypt.genSalt(10);
    this.password_hash = await bcrypt.hash(password, salt);
  };

  /**
   * Vérifie si le mot de passe est correct
   * @param {string} password
   * @returns {Promise<boolean>}
   */
  User.prototype.comparePassword = async function(password) {
    if (!this.password_hash) {
      return false;
    }
    return bcrypt.compare(password, this.password_hash);
  };

  // ============================================
  // MÉTHODES STATIQUES
  // ============================================

  /**
   * Trouve ou crée un utilisateur par téléphone
   * @param {number} municipalityId
   * @param {string} phone
   * @returns {Promise<User>}
   */
  User.findOrCreateByPhone = async function(municipalityId, phone) {
    const [user, created] = await User.findOrCreate({
      where: {
        municipality_id: municipalityId,
        phone: phone
      },
      defaults: {
        municipality_id: municipalityId,
        phone: phone,
        role: 'citizen'
      }
    });

    return { user, created };
  };

  /**
   * Trouve ou crée un utilisateur par empreinte d'appareil
   * @param {number} municipalityId
   * @param {string} fingerprint
   * @returns {Promise<User>}
   */
  User.findOrCreateByFingerprint = async function(municipalityId, fingerprint) {
    const [user, created] = await User.findOrCreate({
      where: {
        municipality_id: municipalityId,
        device_fingerprint: fingerprint
      },
      defaults: {
        municipality_id: municipalityId,
        device_fingerprint: fingerprint,
        role: 'citizen'
      }
    });

    return { user, created };
  };

  // ============================================
  // HOOKS
  // ============================================

  // Avant validation : au moins phone OU device_fingerprint OU email+password requis
  User.beforeValidate((user) => {
    const hasPhoneOrFingerprint = user.phone || user.device_fingerprint;
    const hasEmailAndPassword = user.email && user.password_hash;

    if (!hasPhoneOrFingerprint && !hasEmailAndPassword) {
      throw new Error('Le téléphone, l\'empreinte d\'appareil, ou l\'email+mot de passe est requis');
    }
  });

  return User;
};
