'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
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
      phone: {
        type: Sequelize.STRING(20)
      },
      device_fingerprint: {
        type: Sequelize.STRING(255)
      },
      email: {
        type: Sequelize.STRING(255)
      },
      full_name: {
        type: Sequelize.STRING(255)
      },
      role: {
        type: Sequelize.ENUM('citizen', 'admin', 'super_admin'),
        defaultValue: 'citizen',
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_login: {
        type: Sequelize.DATE
      },
      verification_code: {
        type: Sequelize.STRING(10)
      },
      verification_expires_at: {
        type: Sequelize.DATE
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
    await queryInterface.addIndex('users', ['municipality_id'], {
      name: 'idx_user_municipality'
    });

    await queryInterface.addIndex('users', ['phone'], {
      name: 'idx_user_phone'
    });

    await queryInterface.addIndex('users', ['device_fingerprint'], {
      name: 'idx_user_device'
    });

    await queryInterface.addIndex('users', ['role'], {
      name: 'idx_user_role'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
