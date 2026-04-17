'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('municipalities', 'slug', {
      type: Sequelize.STRING(120),
      allowNull: true,
      unique: true
    });

    const [rows] = await queryInterface.sequelize.query(
      'SELECT id, name FROM municipalities WHERE slug IS NULL'
    );

    const slugify = (s) => String(s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 100);

    const used = new Set();
    for (const row of rows) {
      let base = slugify(row.name) || `mairie-${row.id}`;
      let slug = base;
      let i = 2;
      while (used.has(slug)) {
        slug = `${base}-${i++}`;
      }
      used.add(slug);
      await queryInterface.sequelize.query(
        'UPDATE municipalities SET slug = ? WHERE id = ?',
        { replacements: [slug, row.id] }
      );
    }

    await queryInterface.changeColumn('municipalities', 'slug', {
      type: Sequelize.STRING(120),
      allowNull: false,
      unique: true
    });

    await queryInterface.addIndex('municipalities', ['slug'], {
      unique: true,
      name: 'municipalities_slug_unique'
    }).catch(() => {});
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('municipalities', 'municipalities_slug_unique').catch(() => {});
    await queryInterface.removeColumn('municipalities', 'slug');
  }
};
