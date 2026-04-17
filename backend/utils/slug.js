function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 100);
}

async function generateUniqueSlug(Municipality, name, excludeId = null) {
  const { Op } = require('sequelize');
  const base = slugify(name) || 'mairie';
  let candidate = base;
  let i = 2;
  while (true) {
    const where = { slug: candidate };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const exists = await Municipality.findOne({ where });
    if (!exists) return candidate;
    candidate = `${base}-${i++}`;
  }
}

module.exports = { slugify, generateUniqueSlug };
