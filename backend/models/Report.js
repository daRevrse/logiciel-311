module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define('Report', {
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
    citizen_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'citizen_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    is_anonymous: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_anonymous'
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'category_id',
      references: {
        model: 'categories',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Le titre est requis' },
        len: {
          args: [5, 255],
          msg: 'Le titre doit contenir entre 5 et 255 caractères'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'La description est requise' },
        len: {
          args: [10, 5000],
          msg: 'La description doit contenir entre 10 et 5000 caractères'
        }
      }
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'L\'adresse est requise' }
      }
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      validate: {
        min: { args: [-90], msg: 'Latitude invalide' },
        max: { args: [90], msg: 'Latitude invalide' }
      }
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      validate: {
        min: { args: [-180], msg: 'Longitude invalide' },
        max: { args: [180], msg: 'Longitude invalide' }
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'resolved', 'rejected'),
      defaultValue: 'pending',
      validate: {
        isIn: {
          args: [['pending', 'in_progress', 'resolved', 'rejected']],
          msg: 'Statut invalide'
        }
      }
    },
    priority_score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'priority_score'
    },
    admin_notes: {
      type: DataTypes.TEXT,
      field: 'admin_notes'
    },
    resolution_notes: {
      type: DataTypes.TEXT,
      field: 'resolution_notes'
    },
    resolved_at: {
      type: DataTypes.DATE,
      field: 'resolved_at'
    },
    resolved_by: {
      type: DataTypes.INTEGER,
      field: 'resolved_by',
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'reports',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['municipality_id'] },
      { fields: ['citizen_id'] },
      { fields: ['category_id'] },
      { fields: ['status'] },
      { fields: ['priority_score'] },
      { fields: ['created_at'] },
      { fields: ['latitude', 'longitude'] }
    ]
  });

  // ============================================
  // MÉTHODES D'INSTANCE
  // ============================================

  /**
   * Calcule le score de priorité
   * Formule: nombre_supports + (ancienneté_en_jours * 0.5)
   * @returns {Promise<number>}
   */
  Report.prototype.calculatePriorityScore = async function() {
    // Récupérer le nombre de supports
    const Support = sequelize.models.Support;
    const supportsCount = await Support.count({
      where: { report_id: this.id }
    });

    // Calculer l'ancienneté en jours
    const createdAt = new Date(this.created_at);
    const now = new Date();
    const ageInDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));

    // Appliquer la formule
    // Bonus de +10 si le signalement n'est pas anonyme (vient d'un compte citoyen)
    let score = supportsCount + (ageInDays * 0.5);
    
    if (!this.is_anonymous) {
      score += 10;
    }

    return Math.round(score);
  };

  /**
   * Met à jour le score de priorité
   * @returns {Promise<void>}
   */
  Report.prototype.updatePriorityScore = async function() {
    const newScore = await this.calculatePriorityScore();
    this.priority_score = newScore;
    // Utiliser { hooks: false } pour éviter de déclencher beforeUpdate
    await this.save({ hooks: false });
  };

  /**
   * Vérifie si le signalement est résolu
   * @returns {boolean}
   */
  Report.prototype.isResolved = function() {
    return this.status === 'resolved';
  };

  /**
   * Vérifie si le signalement est rejeté
   * @returns {boolean}
   */
  Report.prototype.isRejected = function() {
    return this.status === 'rejected';
  };

  /**
   * Vérifie si le signalement est en cours
   * @returns {boolean}
   */
  Report.prototype.isInProgress = function() {
    return this.status === 'in_progress';
  };

  /**
   * Vérifie si le signalement est en attente
   * @returns {boolean}
   */
  Report.prototype.isPending = function() {
    return this.status === 'pending';
  };

  /**
   * Calcule le nombre de jours depuis la création
   * @returns {number}
   */
  Report.prototype.getAgeInDays = function() {
    const createdAt = new Date(this.created_at);
    const now = new Date();
    return Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
  };

  // ============================================
  // HOOKS
  // ============================================

  // Après création : initialiser le score de priorité
  Report.afterCreate(async (report) => {
    await report.updatePriorityScore();
  });

  // Avant mise à jour du statut : enregistrer dans l'historique
  Report.beforeUpdate(async (report) => {
    if (report.changed('status')) {
      const StatusHistory = sequelize.models.StatusHistory;
      await StatusHistory.create({
        report_id: report.id,
        old_status: report._previousDataValues.status,
        new_status: report.status,
        // Utiliser resolved_by si disponible, sinon citizen_id
        changed_by: report.resolved_by || report.citizen_id,
        comment: report.resolution_notes || null
      });
    }

    // Si résolu, enregistrer la date
    if (report.status === 'resolved' && !report.resolved_at) {
      report.resolved_at = new Date();
    }
  });

  return Report;
};
