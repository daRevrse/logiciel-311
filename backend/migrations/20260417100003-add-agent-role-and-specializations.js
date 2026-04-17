'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Extend the role ENUM to include 'agent'
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('citizen', 'agent', 'admin', 'super_admin'),
      defaultValue: 'citizen',
      allowNull: false
    });

    // Add specializations JSON column (array of category IDs)
    await queryInterface.addColumn('users', 'specializations', {
      type: Sequelize.JSON,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('users', 'specializations');

    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('citizen', 'admin', 'super_admin'),
      defaultValue: 'citizen',
      allowNull: false
    });
  }
};
