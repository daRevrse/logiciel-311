'use strict';

/**
 * Super admins n'appartiennent à aucune municipalité : rendre FK nullable.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('users', 'municipality_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'municipalities', key: 'id' }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('users', 'municipality_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'municipalities', key: 'id' }
    });
  }
};
