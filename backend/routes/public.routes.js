const express = require('express');
const router = express.Router();
const { Municipality } = require('../models');

/**
 * @route GET /api/public/municipalities/by-slug/:slug
 * @desc Informations publiques de la mairie pour branding de la page de login admin
 * @access Public
 */
router.get('/municipalities/by-slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const municipality = await Municipality.findOne({
      where: { slug, is_active: true },
      attributes: ['id', 'name', 'slug', 'logo_url', 'region', 'country', 'settings']
    });

    if (!municipality) {
      return res.status(404).json({ success: false, message: 'Mairie introuvable' });
    }

    const primaryColor = municipality.getSetting('theme.primaryColor') || '#3B82F6';

    res.json({
      success: true,
      data: {
        id: municipality.id,
        name: municipality.name,
        slug: municipality.slug,
        logo_url: municipality.logo_url,
        region: municipality.region,
        country: municipality.country,
        primary_color: primaryColor
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
