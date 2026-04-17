'use strict';

/**
 * Follow-up cleanup: drop the duplicate `phone` and `email` columns
 * that were added in 20260417100001-extend-municipality-branding.js.
 *
 * The `municipalities` table already had `contact_phone` and
 * `contact_email` (from 20250101000002-create-municipalities.js), so
 * we consolidate on those and remove the duplicates here. This
 * migration makes the branch idempotent for anyone who already ran
 * the previous version of 20260417100001.
 */
module.exports = {
  async up(queryInterface) {
    const table = await queryInterface.describeTable('municipalities');
    if (table.phone) {
      await queryInterface.removeColumn('municipalities', 'phone');
    }
    if (table.email) {
      await queryInterface.removeColumn('municipalities', 'email');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('municipalities', 'phone', {
      type: Sequelize.STRING(30),
      allowNull: true
    });
    await queryInterface.addColumn('municipalities', 'email', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
};
