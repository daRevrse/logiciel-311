module.exports = (sequelize, DataTypes) => {
  const ReportComment = sequelize.define('ReportComment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    report_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'report_id',
      references: { model: 'reports', key: 'id' }
    },
    author_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'author_id',
      references: { model: 'users', key: 'id' }
    },
    author_role: {
      type: DataTypes.ENUM('citizen', 'agent', 'admin', 'super_admin'),
      allowNull: false,
      field: 'author_role'
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Le commentaire est requis' },
        len: { args: [1, 5000], msg: 'Commentaire entre 1 et 5000 caractères' }
      }
    },
    is_internal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_internal'
    },
    deleted_at: {
      type: DataTypes.DATE,
      field: 'deleted_at'
    }
  }, {
    tableName: 'report_comments',
    timestamps: true,
    underscored: true,
    paranoid: true,
    deletedAt: 'deleted_at',
    indexes: [
      { fields: ['report_id'] },
      { fields: ['author_id'] },
      { fields: ['created_at'] }
    ]
  });

  return ReportComment;
};
