'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Code de suivi unique sur reports
    await queryInterface.addColumn('reports', 'tracking_code', {
      type: Sequelize.STRING(12),
      allowNull: true
    });
    await queryInterface.addIndex('reports', ['tracking_code'], {
      unique: true,
      name: 'unique_report_tracking_code'
    });

    // Champs onboarding email/password sur users
    await queryInterface.addColumn('users', 'email_verified_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'email_verification_token', {
      type: Sequelize.STRING(64),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'password_reset_token', {
      type: Sequelize.STRING(64),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'password_reset_expires_at', {
      type: Sequelize.DATE,
      allowNull: true
    });
    await queryInterface.addColumn('users', 'notification_preferences', {
      type: Sequelize.JSON,
      allowNull: true
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'notification_preferences');
    await queryInterface.removeColumn('users', 'password_reset_expires_at');
    await queryInterface.removeColumn('users', 'password_reset_token');
    await queryInterface.removeColumn('users', 'email_verification_token');
    await queryInterface.removeColumn('users', 'email_verified_at');
    await queryInterface.removeIndex('reports', 'unique_report_tracking_code');
    await queryInterface.removeColumn('reports', 'tracking_code');
  }
};
