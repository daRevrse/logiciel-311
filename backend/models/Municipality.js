module.exports = (sequelize, DataTypes) => {
  const Municipality = sequelize.define('Municipality', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    license_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
      field: 'license_id',
      references: {
        model: 'licenses',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Le nom de la commune est requis' }
      }
    },
    slug: {
      type: DataTypes.STRING(120),
      allowNull: false,
      unique: true,
      validate: {
        is: {
          args: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          msg: 'Slug invalide (minuscules, chiffres, tirets)'
        }
      }
    },
    region: {
      type: DataTypes.STRING(100)
    },
    country: {
      type: DataTypes.STRING(100)
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    logo_url: {
      type: DataTypes.STRING(500),
      field: 'logo_url',
      validate: {
        isUrl: { msg: 'URL du logo invalide' }
      }
    },
    contact_email: {
      type: DataTypes.STRING(255),
      field: 'contact_email',
      validate: {
        isEmail: { msg: 'Email invalide' }
      }
    },
    contact_phone: {
      type: DataTypes.STRING(20),
      field: 'contact_phone'
    },
    address: {
      type: DataTypes.TEXT
    },
    settings: {
      type: DataTypes.JSON,
      defaultValue: {
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981'
        },
        notifications: {
          emailEnabled: true,
          smsEnabled: false
        },
        map: {
          defaultZoom: 13,
          center: {
            lat: 6.1319, // Lomé par défaut
            lng: 1.2228
          }
        }
      }
    }
  }, {
    tableName: 'municipalities',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['license_id'], unique: true },
      { fields: ['name'] },
      { fields: ['slug'], unique: true }
    ]
  });

  // ============================================
  // MÉTHODES D'INSTANCE
  // ============================================

  /**
   * Récupère la configuration d'une fonctionnalité
   * @param {string} key - Clé de configuration (ex: 'theme.primaryColor')
   * @returns {any}
   */
  Municipality.prototype.getSetting = function(key) {
    const keys = key.split('.');
    let value = this.settings;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }

    return value;
  };

  /**
   * Met à jour une configuration
   * @param {string} key
   * @param {any} value
   */
  Municipality.prototype.updateSetting = function(key, value) {
    const keys = key.split('.');
    let settings = { ...this.settings };
    let current = settings;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    current[keys[keys.length - 1]] = value;
    this.settings = settings;
  };

  return Municipality;
};
