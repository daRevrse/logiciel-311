'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Extend the reports.status ENUM to include 'assigned'
    await queryInterface.changeColumn('reports', 'status', {
      type: Sequelize.ENUM('pending', 'assigned', 'in_progress', 'resolved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    });

    // Keep status_history ENUMs in sync so inserts don't fail
    await queryInterface.changeColumn('status_history', 'old_status', {
      type: Sequelize.ENUM('pending', 'assigned', 'in_progress', 'resolved', 'rejected'),
      allowNull: true
    });
    await queryInterface.changeColumn('status_history', 'new_status', {
      type: Sequelize.ENUM('pending', 'assigned', 'in_progress', 'resolved', 'rejected'),
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert any 'assigned' rows back to 'pending' before shrinking the ENUM
    await queryInterface.sequelize.query(
      "UPDATE reports SET status = 'pending' WHERE status = 'assigned'"
    );
    await queryInterface.sequelize.query(
      "UPDATE status_history SET old_status = 'pending' WHERE old_status = 'assigned'"
    );
    await queryInterface.sequelize.query(
      "UPDATE status_history SET new_status = 'pending' WHERE new_status = 'assigned'"
    );

    await queryInterface.changeColumn('reports', 'status', {
      type: Sequelize.ENUM('pending', 'in_progress', 'resolved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    });
    await queryInterface.changeColumn('status_history', 'old_status', {
      type: Sequelize.ENUM('pending', 'in_progress', 'resolved', 'rejected'),
      allowNull: true
    });
    await queryInterface.changeColumn('status_history', 'new_status', {
      type: Sequelize.ENUM('pending', 'in_progress', 'resolved', 'rejected'),
      allowNull: false
    });
  }
};
