'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('report_comments', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      report_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'reports', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      author_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      author_role: {
        type: Sequelize.ENUM('citizen', 'agent', 'admin', 'super_admin'),
        allowNull: false
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      is_internal: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    await queryInterface.addIndex('report_comments', ['report_id'], { name: 'idx_comment_report' });
    await queryInterface.addIndex('report_comments', ['author_id'], { name: 'idx_comment_author' });
    await queryInterface.addIndex('report_comments', ['created_at'], { name: 'idx_comment_created' });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('report_comments');
  }
};
