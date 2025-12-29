module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
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
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    report_id: {
      type: DataTypes.INTEGER,
      field: 'report_id',
      references: {
        model: 'reports',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('status_change', 'new_support', 'resolution', 'system'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['status_change', 'new_support', 'resolution', 'system']],
          msg: 'Type de notification invalide'
        }
      }
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Le titre est requis' }
      }
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Le message est requis' }
      }
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_read'
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    updatedAt: false, // Pas de updated_at
    indexes: [
      { fields: ['municipality_id'] },
      { fields: ['user_id'] },
      { fields: ['is_read'] },
      { fields: ['created_at'] }
    ]
  });

  // ============================================
  // MÉTHODES STATIQUES
  // ============================================

  /**
   * Crée une notification de changement de statut
   * @param {number} userId
   * @param {number} municipalityId
   * @param {number} reportId
   * @param {string} newStatus
   */
  Notification.createStatusChange = async function(userId, municipalityId, reportId, newStatus) {
    const statusMessages = {
      'pending': 'Votre signalement est en attente de traitement',
      'in_progress': 'Votre signalement est en cours de traitement',
      'resolved': 'Votre signalement a été résolu',
      'rejected': 'Votre signalement a été rejeté'
    };

    return await Notification.create({
      municipality_id: municipalityId,
      user_id: userId,
      report_id: reportId,
      type: 'status_change',
      title: 'Changement de statut',
      message: statusMessages[newStatus] || 'Le statut de votre signalement a changé'
    });
  };

  /**
   * Marque toutes les notifications d'un utilisateur comme lues
   * @param {number} userId
   */
  Notification.markAllAsRead = async function(userId) {
    return await Notification.update(
      { is_read: true },
      { where: { user_id: userId, is_read: false } }
    );
  };

  /**
   * Récupère les notifications non lues d'un utilisateur
   * @param {number} userId
   * @returns {Promise<Array>}
   */
  Notification.getUnread = async function(userId) {
    return await Notification.findAll({
      where: {
        user_id: userId,
        is_read: false
      },
      order: [['created_at', 'DESC']]
    });
  };

  return Notification;
};
