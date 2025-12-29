'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('supports', {
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
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Index
    await queryInterface.addIndex('supports', ['report_id'], {
      name: 'idx_support_report'
    });

    await queryInterface.addIndex('supports', ['citizen_id'], {
      name: 'idx_support_citizen'
    });

    // Contrainte unique : un citoyen ne peut appuyer qu'une fois
    await queryInterface.addIndex('supports', ['report_id', 'citizen_id'], {
      unique: true,
      name: 'unique_support_per_citizen'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('supports');
  }
};
