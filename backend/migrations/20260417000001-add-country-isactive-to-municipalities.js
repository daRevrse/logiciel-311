'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('municipalities');

    if (!table.country) {
      await queryInterface.addColumn('municipalities', 'country', {
        type: Sequelize.STRING(100),
        allowNull: true
      });
    }

    if (!table.is_active) {
      await queryInterface.addColumn('municipalities', 'is_active', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      });
    }
  },

  down: async (queryInterface) => {
    const table = await queryInterface.describeTable('municipalities');
    if (table.country) await queryInterface.removeColumn('municipalities', 'country');
    if (table.is_active) await queryInterface.removeColumn('municipalities', 'is_active');
  }
};
