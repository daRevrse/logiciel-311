'use strict';

/**
 * Extend municipalities table with branding and public page fields.
 *
 * Note: `logo_url`, `address`, `contact_phone` and `contact_email`
 * already exist on the `municipalities` table (added in
 * 20250101000002-create-municipalities.js) and are therefore not
 * re-added here. The model still declares them, and contact info is
 * consolidated on the pre-existing `contact_phone` / `contact_email`
 * columns (no separate `phone` / `email`).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('municipalities', 'banner_url', {
      type: Sequelize.STRING(500),
      allowNull: true
    });

    await queryInterface.addColumn('municipalities', 'primary_color', {
      type: Sequelize.STRING(7),
      allowNull: true,
      defaultValue: '#1E40AF'
    });

    await queryInterface.addColumn('municipalities', 'secondary_color', {
      type: Sequelize.STRING(7),
      allowNull: true,
      defaultValue: '#64748B'
    });

    await queryInterface.addColumn('municipalities', 'display_name', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('municipalities', 'public_description', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('municipalities', 'public_hours', {
      type: Sequelize.JSON,
      allowNull: true
    });

    await queryInterface.addColumn('municipalities', 'priority_support_threshold', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 10
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('municipalities', 'priority_support_threshold');
    await queryInterface.removeColumn('municipalities', 'public_hours');
    await queryInterface.removeColumn('municipalities', 'public_description');
    await queryInterface.removeColumn('municipalities', 'display_name');
    await queryInterface.removeColumn('municipalities', 'secondary_color');
    await queryInterface.removeColumn('municipalities', 'primary_color');
    await queryInterface.removeColumn('municipalities', 'banner_url');
  }
};
