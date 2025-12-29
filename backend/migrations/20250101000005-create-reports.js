'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('reports', {
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
      citizen_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'categories',
          key: 'id'
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      address: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8)
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8)
      },
      status: {
        type: Sequelize.ENUM('pending', 'in_progress', 'resolved', 'rejected'),
        defaultValue: 'pending',
        allowNull: false
      },
      priority_score: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      admin_notes: {
        type: Sequelize.TEXT
      },
      resolution_notes: {
        type: Sequelize.TEXT
      },
      resolved_at: {
        type: Sequelize.DATE
      },
      resolved_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Index
    await queryInterface.addIndex('reports', ['municipality_id'], {
      name: 'idx_report_municipality'
    });

    await queryInterface.addIndex('reports', ['citizen_id'], {
      name: 'idx_report_citizen'
    });

    await queryInterface.addIndex('reports', ['category_id'], {
      name: 'idx_report_category'
    });

    await queryInterface.addIndex('reports', ['status'], {
      name: 'idx_report_status'
    });

    await queryInterface.addIndex('reports', ['priority_score'], {
      name: 'idx_report_priority'
    });

    await queryInterface.addIndex('reports', ['created_at'], {
      name: 'idx_report_created'
    });

    await queryInterface.addIndex('reports', ['latitude', 'longitude'], {
      name: 'idx_report_location'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('reports');
  }
};
