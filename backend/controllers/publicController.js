const { Municipality, Category, Report, Support, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

/**
 * GET /api/public/municipalities/:slug
 * Payload public complet pour la page vitrine d'une mairie.
 */
exports.getMunicipalityPublicPage = async (req, res) => {
  try {
    const { slug } = req.params;

    const municipality = await Municipality.findOne({
      where: { slug, is_active: true },
      attributes: [
        'id', 'slug', 'name', 'display_name',
        'logo_url', 'banner_url',
        'primary_color', 'secondary_color',
        'public_description', 'address',
        'contact_phone', 'contact_email', 'public_hours'
      ]
    });

    if (!municipality) {
      return res.status(404).json({ success: false, message: 'Mairie introuvable' });
    }

    const municipalityId = municipality.id;

    // Requêtes en parallèle
    const [categories, statusCounts, recentReports] = await Promise.all([
      Category.findAll({
        where: { municipality_id: municipalityId, is_active: true },
        attributes: ['id', 'name', 'icon', 'color'],
        order: [['display_order', 'ASC'], ['name', 'ASC']]
      }),

      Report.findAll({
        where: {
          municipality_id: municipalityId,
          status: { [Op.in]: ['resolved', 'in_progress', 'assigned'] }
        },
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true
      }),

      Report.findAll({
        where: {
          municipality_id: municipalityId,
          status: { [Op.ne]: 'rejected' }
        },
        attributes: [
          'id', 'title', 'status', 'priority_score', 'created_at',
          [
            literal('(SELECT COUNT(*) FROM supports AS s WHERE s.report_id = "Report".id)'),
            'supports_count'
          ]
        ],
        include: [{
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'icon', 'color']
        }],
        order: [['created_at', 'DESC']],
        limit: 5
      })
    ]);

    // Agrégation stats
    let total_resolved = 0;
    let total_in_progress = 0;
    for (const row of statusCounts) {
      const count = parseInt(row.count, 10) || 0;
      if (row.status === 'resolved') total_resolved += count;
      else if (row.status === 'in_progress' || row.status === 'assigned') total_in_progress += count;
    }

    return res.json({
      success: true,
      data: {
        id: municipality.id,
        slug: municipality.slug,
        display_name: municipality.display_name,
        name: municipality.display_name || municipality.name,
        logo_url: municipality.logo_url,
        banner_url: municipality.banner_url,
        primary_color: municipality.primary_color,
        secondary_color: municipality.secondary_color,
        public_description: municipality.public_description,
        address: municipality.address,
        contact_phone: municipality.contact_phone,
        contact_email: municipality.contact_email,
        public_hours: municipality.public_hours,
        categories: categories.map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color
        })),
        stats: {
          total_resolved,
          total_in_progress
        },
        recent_reports: recentReports.map(r => {
          const supportsCount = parseInt(r.get('supports_count'), 10) || 0;
          return {
            id: r.id,
            title: r.title,
            status: r.status,
            category: r.category ? {
              id: r.category.id,
              name: r.category.name,
              icon: r.category.icon,
              color: r.category.color
            } : null,
            created_at: r.created_at,
            supports_count: supportsCount,
            is_priority: (r.priority_score || 0) >= 20
          };
        })
      }
    });
  } catch (err) {
    console.error('[publicController.getMunicipalityPublicPage]', err);
    return res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
