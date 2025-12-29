'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('status_history', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      report_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'reports',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      old_status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'resolved', 'rejected')
      },
      new_status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'resolved', 'rejected'),
        allowNull: false
      },
      changed_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      comment: {
        type: Sequelize.TEXT
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Index
    await queryInterface.addIndex('status_history', ['report_id'], {
      name: 'idx_history_report'
    });

    await queryInterface.addIndex('status_history', ['created_at'], {
      name: 'idx_history_created'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('status_history');
  }
};
