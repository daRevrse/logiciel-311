'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('activity_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      municipality_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'municipalities',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      action: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      entity_type: {
        type: Sequelize.STRING(50)
      },
      entity_id: {
        type: Sequelize.INTEGER
      },
      details: {
        type: Sequelize.JSON
      },
      ip_address: {
        type: Sequelize.STRING(45)
      },
      user_agent: {
        type: Sequelize.TEXT
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Index
    await queryInterface.addIndex('activity_logs', ['municipality_id'], {
      name: 'idx_log_municipality'
    });

    await queryInterface.addIndex('activity_logs', ['user_id'], {
      name: 'idx_log_user'
    });

    await queryInterface.addIndex('activity_logs', ['action'], {
      name: 'idx_log_action'
    });

    await queryInterface.addIndex('activity_logs', ['created_at'], {
      name: 'idx_log_created'
    });

    await queryInterface.addIndex('activity_logs', ['entity_type', 'entity_id'], {
      name: 'idx_log_entity'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('activity_logs');
  }
};
