/**
 * Contrôleur Super Admin — gestion globale des licences.
 * Toutes les routes sont protégées par requireSuperAdmin.
 */
const { Op } = require('sequelize');
const { License, Municipality } = require('../models');
const { MODULES, sanitizeFeatures } = require('../config/modules');
const logger = require('../utils/logger');

/**
 * GET /api/admin/modules/catalog
 */
exports.getCatalog = async (req, res) => {
  res.json({ success: true, data: MODULES });
};

/**
 * GET /api/admin/licenses?status=&q=
 */
exports.listLicenses = async (req, res) => {
  try {
    const { status, q } = req.query;
    const where = {};

    if (q) {
      where[Op.or] = [
        { municipality_name: { [Op.like]: `%${q}%` } },
        { contact_email: { [Op.like]: `%${q}%` } },
        { license_key: { [Op.like]: `%${q}%` } }
      ];
    }

    const licenses = await License.findAll({
      where,
      include: [{ model: Municipality, as: 'municipality', required: false }],
      order: [['created_at', 'DESC']]
    });

    const now = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);

    const enriched = licenses
      .map((l) => {
        const expiresAt = new Date(l.expires_at);
        let computedStatus = 'active';
        if (!l.is_active) computedStatus = 'inactive';
        else if (expiresAt < now) computedStatus = 'expired';
        else if (expiresAt < soon) computedStatus = 'expiring';

        const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

        return {
          ...l.toJSON(),
          status: computedStatus,
          daysRemaining
        };
      })
      .filter((l) => (status ? l.status === status : true));

    res.json({ success: true, data: enriched, count: enriched.length });
  } catch (error) {
    logger.error(`Erreur listLicenses: ${error.message}`);
    res.status(500).json({ success: false, message: 'Erreur chargement licences' });
  }
};

/**
 * GET /api/admin/licenses/:id
 */
exports.getLicense = async (req, res) => {
  try {
    const license = await License.findByPk(req.params.id, {
      include: [{ model: Municipality, as: 'municipality', required: false }]
    });
    if (!license) return res.status(404).json({ success: false, message: 'Licence non trouvée' });

    res.json({
      success: true,
      data: {
        ...license.toJSON(),
        daysRemaining: license.daysRemaining(),
        isExpired: license.isExpired()
      }
    });
  } catch (error) {
    logger.error(`Erreur getLicense: ${error.message}`);
    res.status(500).json({ success: false, message: 'Erreur chargement licence' });
  }
};

/**
 * PATCH /api/admin/licenses/:id/modules
 * body: { modules: { reports: true, map: false, ... } }
 */
exports.updateModules = async (req, res) => {
  try {
    const license = await License.findByPk(req.params.id);
    if (!license) return res.status(404).json({ success: false, message: 'Licence non trouvée' });

    const modules = req.body.modules || req.body.features || {};
    const current = license.features || {};
    const merged = { ...current, ...modules };
    license.features = sanitizeFeatures(merged);
    await license.save();

    logger.info(`Modules licence ${license.license_key} mis à jour`);
    res.json({ success: true, message: 'Modules mis à jour', data: license });
  } catch (error) {
    logger.error(`Erreur updateModules: ${error.message}`);
    res.status(500).json({ success: false, message: 'Erreur mise à jour modules' });
  }
};

/**
 * POST /api/admin/licenses/:id/renew  body: { years: 1 }
 */
exports.renewLicense = async (req, res) => {
  try {
    const license = await License.findByPk(req.params.id);
    if (!license) return res.status(404).json({ success: false, message: 'Licence non trouvée' });

    const years = parseInt(req.body.years, 10) || 1;
    const now = new Date();
    const base = new Date(license.expires_at) > now ? new Date(license.expires_at) : now;
    base.setFullYear(base.getFullYear() + years);
    license.expires_at = base;
    license.is_active = true;
    await license.save();

    logger.info(`Licence ${license.license_key} renouvelée de ${years} an(s) (jusqu'au ${base.toISOString()})`);
    res.json({ success: true, message: 'Licence renouvelée', data: license });
  } catch (error) {
    logger.error(`Erreur renewLicense: ${error.message}`);
    res.status(500).json({ success: false, message: 'Erreur renouvellement licence' });
  }
};

/**
 * PATCH /api/admin/licenses/:id/deactivate
 */
exports.deactivateLicense = async (req, res) => {
  try {
    const license = await License.findByPk(req.params.id);
    if (!license) return res.status(404).json({ success: false, message: 'Licence non trouvée' });
    license.is_active = false;
    await license.save();
    logger.warn(`Licence ${license.license_key} désactivée`);
    res.json({ success: true, message: 'Licence désactivée', data: license });
  } catch (error) {
    logger.error(`Erreur deactivateLicense: ${error.message}`);
    res.status(500).json({ success: false, message: 'Erreur désactivation licence' });
  }
};

/**
 * PATCH /api/admin/licenses/:id/activate
 */
exports.activateLicense = async (req, res) => {
  try {
    const license = await License.findByPk(req.params.id);
    if (!license) return res.status(404).json({ success: false, message: 'Licence non trouvée' });
    license.is_active = true;
    await license.save();
    res.json({ success: true, message: 'Licence réactivée', data: license });
  } catch (error) {
    logger.error(`Erreur activateLicense: ${error.message}`);
    res.status(500).json({ success: false, message: 'Erreur réactivation licence' });
  }
};
