const crypto = require('crypto');

module.exports = (sequelize, DataTypes) => {
  const License = sequelize.define('License', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    license_key: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: 'license_key'
    },
    municipality_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'municipality_name',
      validate: {
        notEmpty: { msg: 'Le nom de la municipalité est requis' }
      }
    },
    contact_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'contact_email',
      validate: {
        isEmail: { msg: 'Email invalide' }
      }
    },
    contact_phone: {
      type: DataTypes.STRING(20),
      field: 'contact_phone'
    },
    issued_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'issued_at'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
      validate: {
        isAfterIssued(value) {
          if (value <= this.issued_at) {
            throw new Error('La date d\'expiration doit être après la date d\'émission');
          }
        }
      }
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    max_users: {
      type: DataTypes.INTEGER,
      defaultValue: 1000,
      field: 'max_users',
      validate: {
        min: { args: [1], msg: 'Le nombre maximum d\'utilisateurs doit être au moins 1' }
      }
    },
    max_admins: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      field: 'max_admins',
      validate: {
        min: { args: [1], msg: 'Le nombre maximum d\'administrateurs doit être au moins 1' }
      }
    },
    features: {
      type: DataTypes.JSON,
      defaultValue: {
        notifications: true,
        map: true,
        statistics: true,
        export: false
      }
    }
  }, {
    tableName: 'licenses',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['license_key'], unique: true },
      { fields: ['is_active'] }
    ]
  });

  // ============================================
  // MÉTHODES D'INSTANCE
  // ============================================

  /**
   * Vérifie si la licence est expirée
   * @returns {boolean}
   */
  License.prototype.isExpired = function() {
    return new Date() > new Date(this.expires_at);
  };

  /**
   * Vérifie si la licence est valide (active ET non expirée)
   * @returns {boolean}
   */
  License.prototype.isValid = function() {
    return this.is_active && !this.isExpired();
  };

  /**
   * Calcule le nombre de jours restants
   * @returns {number}
   */
  License.prototype.daysRemaining = function() {
    const now = new Date();
    const expiry = new Date(this.expires_at);
    const diff = expiry - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // ============================================
  // MÉTHODES STATIQUES
  // ============================================

  /**
   * Génère une clé de licence unique
   * Format: XXXX-XXXX-XXXX-XXXX
   * @returns {string}
   */
  License.generateKey = function() {
    const segments = [];
    for (let i = 0; i < 4; i++) {
      const segment = crypto.randomBytes(2).toString('hex').toUpperCase();
      segments.push(segment);
    }
    return segments.join('-');
  };

  /**
   * Valide le format d'une clé de licence
   * @param {string} key
   * @returns {boolean}
   */
  License.isValidKeyFormat = function(key) {
    const regex = /^[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/;
    return regex.test(key);
  };

  // ============================================
  // HOOKS
  // ============================================

  // Avant création : générer la clé si non fournie
  License.beforeCreate(async (license) => {
    if (!license.license_key) {
      let key;
      let exists = true;

      // Générer une clé unique
      while (exists) {
        key = License.generateKey();
        const found = await License.findOne({ where: { license_key: key } });
        exists = !!found;
      }

      license.license_key = key;
    }
  });

  return License;
};
