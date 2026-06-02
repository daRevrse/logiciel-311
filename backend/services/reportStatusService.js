/**
 * reportStatusService
 *
 * Dérive le statut d'un Report à partir de ses Interventions (non-annulées).
 *
 * Règles :
 *  - Report déjà clôturé (resolved/rejected) -> inchangé (clôture admin)
 *  - Aucune intervention non-annulée  -> statut inchangé
 *  - Au moins une `in_progress`       -> report.status = 'in_progress'
 *  - Toutes `completed`               -> report.status = 'completed' (l'admin clôture ensuite)
 *  - Sinon (pending/scheduled)        -> report.status = 'assigned'
 *
 * Pas de boucle infinie : cette fonction sauvegarde Report (pas Intervention),
 * or les hooks qui l'appellent sont sur Intervention uniquement.
 */

/**
 * @param {number} reportId
 * @returns {Promise<string|null>} nouveau statut, ou null si inchangé
 */
async function deriveReportStatus(reportId) {
  // Lazy require pour éviter toute dépendance circulaire (models/index.js
  // charge Intervention.js qui require ce fichier au chargement initial).
  const { Report, Intervention } = require('../models');

  const interventions = await Intervention.findAll({
    where: { report_id: reportId },
    attributes: ['id', 'status']
  });

  const active = interventions.filter((i) => i.status !== 'cancelled');

  if (active.length === 0) {
    return null; // rien à dériver
  }

  let newStatus;
  if (active.some((i) => i.status === 'in_progress')) {
    newStatus = 'in_progress';
  } else if (active.every((i) => i.status === 'completed')) {
    // Travail terminé par les agents : en attente de clôture par l'admin.
    // (On NE met PAS 'resolved' : ce statut final exige un closure_reason posé par l'admin.)
    newStatus = 'completed';
  } else {
    newStatus = 'assigned';
  }

  const report = await Report.findByPk(reportId);
  if (!report) return null;

  // Ne jamais écraser une clôture administrative
  if (report.status === 'resolved' || report.status === 'rejected') {
    return null;
  }

  if (report.status === newStatus) {
    return null;
  }

  report.status = newStatus;
  await report.save();
  return newStatus;
}

module.exports = { deriveReportStatus };
