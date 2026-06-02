'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Closure reason sur reports
    await queryInterface.addColumn('reports', 'closure_reason', {
      type: Sequelize.ENUM(
        'resolved_completed',
        'resolved_duplicate',
        'resolved_no_action_needed',
        'rejected_invalid',
        'rejected_out_of_scope',
        'rejected_duplicate'
      ),
      allowNull: true
    });

    await queryInterface.addColumn('reports', 'closure_reason_details', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    // SLA configurable par catégorie
    await queryInterface.addColumn('categories', 'sla_hours', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 72
    });

    // SLA tracking sur report
    await queryInterface.addColumn('reports', 'sla_due_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('reports', 'escalated_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addIndex('reports', ['sla_due_at'], { name: 'idx_report_sla_due' });
    await queryInterface.addIndex('reports', ['escalated_at'], { name: 'idx_report_escalated' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('reports', 'idx_report_escalated');
    await queryInterface.removeIndex('reports', 'idx_report_sla_due');
    await queryInterface.removeColumn('reports', 'escalated_at');
    await queryInterface.removeColumn('reports', 'sla_due_at');
    await queryInterface.removeColumn('categories', 'sla_hours');
    await queryInterface.removeColumn('reports', 'closure_reason_details');
    await queryInterface.removeColumn('reports', 'closure_reason');
  }
};
