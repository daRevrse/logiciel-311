'use strict';

/**
 * Ajoute le statut 'completed' à reports.status (travail terminé par l'agent,
 * en attente de clôture par l'admin) et garde status_history en phase.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const ENUM = Sequelize.ENUM('pending', 'assigned', 'in_progress', 'completed', 'resolved', 'rejected');

    await queryInterface.changeColumn('reports', 'status', {
      type: ENUM,
      defaultValue: 'pending',
      allowNull: false
    });
    await queryInterface.changeColumn('status_history', 'old_status', {
      type: Sequelize.ENUM('pending', 'assigned', 'in_progress', 'completed', 'resolved', 'rejected'),
      allowNull: true
    });
    await queryInterface.changeColumn('status_history', 'new_status', {
      type: Sequelize.ENUM('pending', 'assigned', 'in_progress', 'completed', 'resolved', 'rejected'),
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Replier 'completed' vers 'in_progress' avant de réduire l'ENUM
    await queryInterface.sequelize.query("UPDATE reports SET status = 'in_progress' WHERE status = 'completed'");
    await queryInterface.sequelize.query("UPDATE status_history SET old_status = 'in_progress' WHERE old_status = 'completed'");
    await queryInterface.sequelize.query("UPDATE status_history SET new_status = 'in_progress' WHERE new_status = 'completed'");

    await queryInterface.changeColumn('reports', 'status', {
      type: Sequelize.ENUM('pending', 'assigned', 'in_progress', 'resolved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false
    });
    await queryInterface.changeColumn('status_history', 'old_status', {
      type: Sequelize.ENUM('pending', 'assigned', 'in_progress', 'resolved', 'rejected'),
      allowNull: true
    });
    await queryInterface.changeColumn('status_history', 'new_status', {
      type: Sequelize.ENUM('pending', 'assigned', 'in_progress', 'resolved', 'rejected'),
      allowNull: false
    });
  }
};
