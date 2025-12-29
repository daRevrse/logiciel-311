module.exports = (sequelize, DataTypes) => {
  const Support = sequelize.define('Support', {
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
    citizen_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'citizen_id',
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'supports',
    timestamps: true,
    underscored: true,
    updatedAt: false, // Pas de updated_at pour les supports
    indexes: [
      { fields: ['report_id'] },
      { fields: ['citizen_id'] },
      {
        fields: ['report_id', 'citizen_id'],
        unique: true,
        name: 'unique_support_per_citizen'
      }
    ]
  });

  // ============================================
  // MÉTHODES STATIQUES
  // ============================================

  /**
   * Vérifie si un citoyen a déjà appuyé un signalement
   * @param {number} reportId
   * @param {number} citizenId
   * @returns {Promise<boolean>}
   */
  Support.hasSupported = async function(reportId, citizenId) {
    const support = await Support.findOne({
      where: {
        report_id: reportId,
        citizen_id: citizenId
      }
    });

    return !!support;
  };

  /**
   * Compte le nombre de supports pour un signalement
   * @param {number} reportId
   * @returns {Promise<number>}
   */
  Support.countForReport = async function(reportId) {
    return await Support.count({
      where: { report_id: reportId }
    });
  };

  // ============================================
  // HOOKS
  // ============================================

  // Après création : mettre à jour le score de priorité du signalement
  Support.afterCreate(async (support) => {
    const Report = sequelize.models.Report;
    const report = await Report.findByPk(support.report_id);

    if (report) {
      await report.updatePriorityScore();
    }
  });

  // Après suppression : mettre à jour le score de priorité du signalement
  Support.afterDestroy(async (support) => {
    const Report = sequelize.models.Report;
    const report = await Report.findByPk(support.report_id);

    if (report) {
      await report.updatePriorityScore();
    }
  });

  // Avant création : vérifier que le citoyen n'a pas déjà appuyé
  Support.beforeCreate(async (support) => {
    const exists = await Support.hasSupported(support.report_id, support.citizen_id);

    if (exists) {
      throw new Error('Vous avez déjà appuyé ce signalement');
    }
  });

  return Support;
};
