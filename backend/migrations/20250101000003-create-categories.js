'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('categories', {
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
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      icon: {
        type: Sequelize.STRING(50),
        defaultValue: 'default'
      },
      color: {
        type: Sequelize.STRING(7),
        defaultValue: '#3B82F6'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
    await queryInterface.addIndex('categories', ['municipality_id'], {
      name: 'idx_category_municipality'
    });

    await queryInterface.addIndex('categories', ['is_active'], {
      name: 'idx_category_active'
    });

    await queryInterface.addIndex('categories', ['municipality_id', 'name'], {
      unique: true,
      name: 'unique_category_per_municipality'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('categories');
  }
};
