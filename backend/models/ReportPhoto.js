module.exports = (sequelize, DataTypes) => {
  const ReportPhoto = sequelize.define('ReportPhoto', {
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
    photo_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'photo_url',
      validate: {
        notEmpty: { msg: 'L\'URL de la photo est requise' }
      }
    },
    upload_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'upload_order',
      validate: {
        min: { args: [0], msg: 'L\'ordre doit être positif' }
      }
    }
  }, {
    tableName: 'report_photos',
    timestamps: true,
    updatedAt: false, // Pas de updated_at pour les photos
    underscored: true,
    indexes: [
      { fields: ['report_id'] }
    ]
  });

  // ============================================
  // HOOKS
  // ============================================

  // Avant création : définir automatiquement l'ordre
  ReportPhoto.beforeCreate(async (photo) => {
    if (photo.upload_order === 0) {
      const maxOrder = await ReportPhoto.max('upload_order', {
        where: { report_id: photo.report_id }
      });

      photo.upload_order = (maxOrder || 0) + 1;
    }
  });

  return ReportPhoto;
};
