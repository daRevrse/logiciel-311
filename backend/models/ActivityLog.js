module.exports = (sequelize, DataTypes) => {
  const ActivityLog = sequelize.define('ActivityLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    municipality_id: {
      type: DataTypes.INTEGER,
      field: 'municipality_id',
      references: {
        model: 'municipalities',
        key: 'id'
      }
    },
    user_id: {
      type: DataTypes.INTEGER,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'L\'action est requise' }
      }
      // Exemples: 'create_report', 'login', 'change_status', 'add_support'
    },
    entity_type: {
      type: DataTypes.STRING(50),
      field: 'entity_type'
      // Exemples: 'report', 'user', 'category', 'license'
    },
    entity_id: {
      type: DataTypes.INTEGER,
      field: 'entity_id'
    },
    details: {
      type: DataTypes.JSON
      // Détails additionnels de l'action
    },
    ip_address: {
      type: DataTypes.STRING(45),
      field: 'ip_address'
      // Support IPv4 et IPv6
    },
    user_agent: {
      type: DataTypes.TEXT,
      field: 'user_agent'
    }
  }, {
    tableName: 'activity_logs',
    timestamps: true,
    underscored: true,
    updatedAt: false, // Pas de updated_at pour les logs
    indexes: [
      { fields: ['municipality_id'] },
      { fields: ['user_id'] },
      { fields: ['action'] },
      { fields: ['created_at'] },
      { fields: ['entity_type', 'entity_id'] }
    ]
  });

  // ============================================
  // MÉTHODES STATIQUES
  // ============================================

  /**
   * Enregistre une activité
   * @param {Object} data
   * @returns {Promise<ActivityLog>}
   */
  ActivityLog.log = async function(data) {
    return await ActivityLog.create({
      municipality_id: data.municipalityId,
      user_id: data.userId,
      action: data.action,
      entity_type: data.entityType,
      entity_id: data.entityId,
      details: data.details || {},
      ip_address: data.ipAddress,
      user_agent: data.userAgent
    });
  };

  /**
   * Récupère les logs d'une municipalité avec filtres
   * @param {number} municipalityId
   * @param {Object} filters
   * @returns {Promise<Array>}
   */
  ActivityLog.getMunicipalityLogs = async function(municipalityId, filters = {}) {
    const where = { municipality_id: municipalityId };

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.userId) {
      where.user_id = filters.userId;
    }

    if (filters.entityType) {
      where.entity_type = filters.entityType;
    }

    if (filters.startDate) {
      where.created_at = {
        [sequelize.Sequelize.Op.gte]: filters.startDate
      };
    }

    return await ActivityLog.findAll({
      where,
      include: [
        {
          model: sequelize.models.User,
          as: 'user',
          attributes: ['id', 'full_name', 'role']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: filters.limit || 100
    });
  };

  /**
   * Récupère les statistiques d'activité
   * @param {number} municipalityId
   * @param {Date} startDate
   * @param {Date} endDate
   * @returns {Promise<Object>}
   */
  ActivityLog.getStatistics = async function(municipalityId, startDate, endDate) {
    const where = {
      municipality_id: municipalityId,
      created_at: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    };

    const total = await ActivityLog.count({ where });

    const byAction = await ActivityLog.findAll({
      where,
      attributes: [
        'action',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['action'],
      raw: true
    });

    return {
      total,
      byAction: byAction.reduce((acc, item) => {
        acc[item.action] = parseInt(item.count);
        return acc;
      }, {})
    };
  };

  return ActivityLog;
};
