module.exports = (sequelize, DataTypes) => {
  const StatusHistory = sequelize.define('StatusHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    report_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'report_id',
      references: {
        model: 'reports',
        key: 'id'
      }
    },
    old_status: {
      type: DataTypes.ENUM('pending', 'assigned', 'in_progress', 'resolved', 'rejected'),
      field: 'old_status'
    },
    new_status: {
      type: DataTypes.ENUM('pending', 'assigned', 'in_progress', 'resolved', 'rejected'),
      allowNull: false,
      field: 'new_status',
      validate: {
        isIn: {
          args: [['pending', 'assigned', 'in_progress', 'resolved', 'rejected']],
          msg: 'Statut invalide'
        }
      }
    },
    changed_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'changed_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    comment: {
      type: DataTypes.TEXT
    }
  }, {
    tableName: 'status_history',
    timestamps: true,
    underscored: true,
    updatedAt: false, // Pas de updated_at pour l'historique
    indexes: [
      { fields: ['report_id'] },
      { fields: ['created_at'] }
    ]
  });

  // ============================================
  // MÉTHODES STATIQUES
  // ============================================

  /**
   * Récupère l'historique complet d'un signalement
   * @param {number} reportId
   * @returns {Promise<Array>}
   */
  StatusHistory.getReportHistory = async function(reportId) {
    return await StatusHistory.findAll({
      where: { report_id: reportId },
      include: [
        {
          model: sequelize.models.User,
          as: 'admin',
          attributes: ['id', 'full_name', 'role']
        }
      ],
      order: [['created_at', 'ASC']]
    });
  };

  return StatusHistory;
};
