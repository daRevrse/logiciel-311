const { Municipality, Category, Report, ReportComment, StatusHistory, User, sequelize } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

/**
 * GET /api/public/reports/track/:code
 * Recherche d'un signalement par tracking_code (sans authentification).
 */
exports.trackReport = async (req, res) => {
  try {
    const raw = (req.params.code || '').toUpperCase().trim();
    if (!/^[A-Z0-9]{4,12}$/.test(raw)) {
      return res.status(400).json({ success: false, message: 'Code de suivi invalide' });
    }

    const report = await Report.findOne({
      where: { tracking_code: raw },
      attributes: [
        'id', 'tracking_code', 'title', 'description', 'status', 'address',
        'created_at', 'resolved_at', 'closure_reason', 'closure_reason_details'
      ],
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'color'] },
        { model: Municipality, as: 'municipality', attributes: ['id', 'name', 'slug'] }
      ]
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Aucun signalement avec ce code' });
    }

    const [history, comments] = await Promise.all([
      StatusHistory.findAll({
        where: { report_id: report.id },
        attributes: ['old_status', 'new_status', 'created_at', 'comment'],
        order: [['created_at', 'ASC']]
      }),
      ReportComment.findAll({
        where: { report_id: report.id, is_internal: false },
        attributes: ['id', 'body', 'author_role', 'created_at'],
        include: [{ model: User, as: 'author', attributes: ['full_name', 'role'] }],
        order: [['created_at', 'ASC']]
      })
    ]);

    res.json({
      success: true,
      data: {
        report: {
          tracking_code: report.tracking_code,
          title: report.title,
          status: report.status,
          address: report.address,
          created_at: report.created_at,
          resolved_at: report.resolved_at,
          closure_reason: report.closure_reason,
          category: report.category,
          municipality: report.municipality
        },
        history: history.map(h => ({
          old_status: h.old_status,
          new_status: h.new_status,
          comment: h.comment,
          created_at: h.created_at
        })),
        comments: comments.map(c => ({
          body: c.body,
          author_role: c.author_role,
          author_name: c.author?.full_name || null,
          created_at: c.created_at
        }))
      }
    });
  } catch (err) {
    console.error('[publicController.trackReport]', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

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
    const [categories, statusCounts, totalReports, recentResolved, recentReports] = await Promise.all([
      Category.findAll({
        where: { municipality_id: municipalityId, is_active: true },
        attributes: ['id', 'name', 'icon', 'color'],
        order: [['display_order', 'ASC'], ['name', 'ASC']]
      }),

      Report.findAll({
        where: {
          municipality_id: municipalityId,
          status: { [Op.in]: ['resolved', 'in_progress', 'assigned', 'completed'] }
        },
        attributes: ['status', [fn('COUNT', col('id')), 'count']],
        group: ['status'],
        raw: true
      }),

      // Total des signalements reçus (hors rejetés/doublons)
      Report.count({
        where: { municipality_id: municipalityId, status: { [Op.ne]: 'rejected' } }
      }),

      // Réalisations : derniers signalements résolus
      Report.findAll({
        where: { municipality_id: municipalityId, status: 'resolved' },
        attributes: ['id', 'title', 'address', 'created_at', 'resolved_at'],
        include: [{ model: Category, as: 'category', attributes: ['id', 'name', 'icon', 'color'] }],
        order: [['resolved_at', 'DESC']],
        limit: 6
      }),

      Report.findAll({
        where: {
          municipality_id: municipalityId,
          status: { [Op.ne]: 'rejected' }
        },
        attributes: [
          'id', 'title', 'status', 'priority_score', 'created_at',
          [
            literal('(SELECT COUNT(*) FROM supports AS s WHERE s.report_id = `Report`.`id`)'),
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
      else if (['in_progress', 'assigned', 'completed'].includes(row.status)) total_in_progress += count;
    }
    const resolution_rate = totalReports > 0 ? Math.round((total_resolved / totalReports) * 100) : 0;

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
          total_reports: totalReports,
          total_resolved,
          total_in_progress,
          resolution_rate
        },
        recent_resolved: recentResolved.map(r => ({
          id: r.id,
          title: r.title,
          address: r.address,
          resolved_at: r.resolved_at,
          created_at: r.created_at,
          category: r.category ? { id: r.category.id, name: r.category.name, icon: r.category.icon, color: r.category.color } : null
        })),
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
