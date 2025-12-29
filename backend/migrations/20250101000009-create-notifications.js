'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      municipality_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'municipalities',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      report_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'reports',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('status_change', 'new_support', 'resolution', 'system'),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Index
    await queryInterface.addIndex('notifications', ['municipality_id'], {
      name: 'idx_notification_municipality'
    });

    await queryInterface.addIndex('notifications', ['user_id'], {
      name: 'idx_notification_user'
    });

    await queryInterface.addIndex('notifications', ['is_read'], {
      name: 'idx_notification_read'
    });

    await queryInterface.addIndex('notifications', ['created_at'], {
      name: 'idx_notification_created'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notifications');
  }
};
