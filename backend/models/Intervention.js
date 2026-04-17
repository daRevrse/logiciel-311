module.exports = (sequelize, DataTypes) => {
  const Intervention = sequelize.define('Intervention', {
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
    agent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'agent_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    assigned_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'assigned_by',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'scheduled', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
      validate: {
        isIn: {
          args: [['pending', 'scheduled', 'in_progress', 'completed', 'cancelled']],
          msg: 'Statut d\'intervention invalide'
        }
      }
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'scheduled_at'
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'started_at'
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    }
  }, {
    tableName: 'interventions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['report_id'] },
      { fields: ['agent_id'] },
      { fields: ['status'] }
    ]
  });

  return Intervention;
};
