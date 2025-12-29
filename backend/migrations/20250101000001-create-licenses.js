'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('licenses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      license_key: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      municipality_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      contact_email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      contact_phone: {
        type: Sequelize.STRING(20)
      },
      issued_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      max_users: {
        type: Sequelize.INTEGER,
        defaultValue: 1000
      },
      max_admins: {
        type: Sequelize.INTEGER,
        defaultValue: 50
      },
      features: {
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
    await queryInterface.addIndex('licenses', ['license_key'], {
      unique: true,
      name: 'idx_license_key'
    });

    await queryInterface.addIndex('licenses', ['is_active'], {
      name: 'idx_is_active'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('licenses');
  }
};
