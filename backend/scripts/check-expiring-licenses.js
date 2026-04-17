/**
 * Script CLI : vérifie les licences qui expirent sous 30 jours
 * et envoie un email d'alerte (si SMTP configuré).
 *
 * Usage: node backend/scripts/check-expiring-licenses.js
 */
require('dotenv').config();

(async () => {
  try {
    const licenseService = require('../services/licenseService');
    const result = await licenseService.checkExpiringLicenses();
    console.log(`Terminé. ${result.length} licence(s) traitée(s).`);
    process.exit(0);
  } catch (err) {
    console.error('Erreur:', err);
    process.exit(1);
  }
})();
