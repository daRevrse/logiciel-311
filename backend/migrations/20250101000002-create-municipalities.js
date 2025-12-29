'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('municipalities', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      license_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'licenses',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      region: {
        type: Sequelize.STRING(100)
      },
      logo_url: {
        type: Sequelize.STRING(500)
      },
      contact_email: {
        type: Sequelize.STRING(255)
      },
      contact_phone: {
        type: Sequelize.STRING(20)
      },
      address: {
        type: Sequelize.TEXT
      },
      settings: {
        type: Sequelize.JSON,
        defaultValue: null
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
    await queryInterface.addIndex('municipalities', ['license_id'], {
      unique: true,
      name: 'idx_municipality_license'
    });

    await queryInterface.addIndex('municipalities', ['name'], {
      name: 'idx_municipality_name'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('municipalities');
  }
};
