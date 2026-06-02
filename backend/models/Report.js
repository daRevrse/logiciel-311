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
      type: DataTypes.ENUM('pending', 'assigned', 'in_progress', 'completed', 'resolved', 'rejected'),
      defaultValue: 'pending',
      validate: {
        isIn: {
          args: [['pending', 'assigned', 'in_progress', 'completed', 'resolved', 'rejected']],
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
    },
    closure_reason: {
      type: DataTypes.ENUM(
        'resolved_completed',
        'resolved_duplicate',
        'resolved_no_action_needed',
        'rejected_invalid',
        'rejected_out_of_scope',
        'rejected_duplicate'
      ),
      allowNull: true,
      field: 'closure_reason'
    },
    closure_reason_details: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'closure_reason_details'
    },
    sla_due_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'sla_due_at'
    },
    escalated_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'escalated_at'
    },
    tracking_code: {
      type: DataTypes.STRING(12),
      allowNull: true,
      field: 'tracking_code',
      unique: true
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

  // Avant création : générer un tracking_code unique (6 chars alphanum maj)
  Report.beforeCreate(async (report) => {
    if (!report.tracking_code) {
      const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sans O/0/I/1
      for (let attempt = 0; attempt < 6; attempt++) {
        let code = '';
        for (let i = 0; i < 6; i++) code += ALPHA[Math.floor(Math.random() * ALPHA.length)];
        const existing = await Report.findOne({ where: { tracking_code: code }, attributes: ['id'] });
        if (!existing) {
          report.tracking_code = code;
          break;
        }
      }
    }
  });

  // Après création : initialiser le score de priorité + calculer sla_due_at
  Report.afterCreate(async (report) => {
    await report.updatePriorityScore();

    try {
      const Category = sequelize.models.Category;
      const category = await Category.findByPk(report.category_id);
      if (category && category.sla_hours) {
        const created = new Date(report.created_at);
        const dueAt = new Date(created.getTime() + category.sla_hours * 3600 * 1000);
        report.sla_due_at = dueAt;
        await report.save({ hooks: false });
      }
    } catch (e) {
      // SLA calc best-effort
    }
  });

  // Validation closure_reason si statut final
  Report.beforeSave(async (report) => {
    if (report.changed('status')) {
      const FINAL_STATUSES = ['resolved', 'rejected'];
      if (FINAL_STATUSES.includes(report.status) && !report.closure_reason) {
        throw new Error('closure_reason est requis pour le statut "' + report.status + '"');
      }
      // Vérifier cohérence statut/raison
      if (report.closure_reason) {
        const prefix = report.closure_reason.startsWith('resolved_') ? 'resolved' : 'rejected';
        if (FINAL_STATUSES.includes(report.status) && report.status !== prefix) {
          throw new Error('closure_reason "' + report.closure_reason + '" incompatible avec le statut "' + report.status + '"');
        }
      }
    }
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
