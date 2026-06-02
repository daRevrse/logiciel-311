'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'home_latitude', {
      type: Sequelize.DECIMAL(10, 8),
      allowNull: true
    });
    await queryInterface.addColumn('users', 'home_longitude', {
      type: Sequelize.DECIMAL(11, 8),
      allowNull: true
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'home_longitude');
    await queryInterface.removeColumn('users', 'home_latitude');
  }
};
