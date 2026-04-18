/**
 * Notifier pour événements d'intervention.
 *
 * - notifyInterventionAssigned(intervention) : email agent + notifs in-app
 *   agent + admin qui a assigné.
 * - notifyInterventionStatusChanged(intervention, previousStatus) : email
 *   citoyen propriétaire du rapport + notifs in-app agent/admin, lorsque le
 *   statut passe par assigned / in_progress / completed.
 *
 * NB : le modèle Notification a un ENUM `type` restreint à
 *   ['status_change', 'new_support', 'resolution', 'system']
 * ce qu'on respecte ici (on mappe sur `system` et `status_change` /
 * `resolution`).
 *
 * Toutes les erreurs sont capturées pour éviter qu'une notif défaillante ne
 * casse le cycle de vie de l'intervention / la transaction du hook.
 */

const { Intervention, Report, User, Notification, Municipality, Category } = require('../models');
const mailService = require('./mailService');
const logger = require('../utils/logger');
const { escapeHtml } = require('../utils/html');

/**
 * Charge l'intervention + toutes les relations utiles.
 */
async function loadFull(interventionId) {
  return Intervention.findByPk(interventionId, {
    include: [
      {
        model: Report,
        as: 'report',
        include: [
          { model: User, as: 'citizen', required: false, attributes: ['id', 'full_name', 'email'] },
          { model: Municipality, as: 'municipality', attributes: ['id', 'name'] },
          { model: Category, as: 'category', attributes: ['id', 'name'] }
        ]
      },
      { model: User, as: 'agent', required: false, attributes: ['id', 'full_name', 'email'] },
      { model: User, as: 'assigner', required: false, attributes: ['id', 'full_name', 'email'] }
    ]
  });
}

/**
 * Crée une notif in-app. Les erreurs sont loguées mais ne sont pas propagées.
 */
async function safeCreateNotification(payload) {
  try {
    await Notification.create(payload);
  } catch (err) {
    logger.error(`[interventionNotifier] création notif échouée: ${err.message}`, { payload });
  }
}

/**
 * Envoie un email. Silencieux si SMTP non configuré.
 */
async function safeSendMail(opts) {
  try {
    if (!opts.to) return;
    await mailService.sendMail(opts);
  } catch (err) {
    logger.error(`[interventionNotifier] envoi mail échoué: ${err.message}`);
  }
}

/**
 * Gabarit HTML simple pour les emails.
 */
function renderEmail({ title, intro, lines }) {
  const items = lines.map((l) => `<li>${l}</li>`).join('');
  return `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;line-height:1.5;color:#222;">
  <h2 style="color:#2563eb;">${escapeHtml(title)}</h2>
  <p>${escapeHtml(intro)}</p>
  <ul>${items}</ul>
  <p style="color:#666;font-size:12px;">Ce message est généré automatiquement — ne pas répondre.</p>
</body></html>`;
}

/**
 * Libellés lisibles par statut (côté rapport / côté intervention).
 */
const REPORT_STATUS_LABELS = {
  pending: 'En attente',
  assigned: 'Assigné',
  in_progress: 'En cours',
  resolved: 'Résolu',
  rejected: 'Rejeté'
};

const INTERVENTION_STATUS_LABELS = {
  pending: 'En attente',
  scheduled: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée'
};

/**
 * Notifie qu'une intervention vient d'être créée (agent assigné).
 */
async function notifyInterventionAssigned(intervention) {
  try {
    const full = await loadFull(intervention.id);
    if (!full) return;

    const agent = full.agent;
    const report = full.report;
    const assigner = full.assigner;
    const municipalityId = report ? report.municipality_id : null;
    if (!municipalityId) return;

    const reportTitle = report ? report.title : `#${intervention.report_id}`;

    // Email agent
    if (agent && agent.email) {
      const html = renderEmail({
        title: 'Nouvelle intervention assignée',
        intro: `Bonjour ${agent.full_name || ''}, une nouvelle intervention vous a été assignée.`,
        lines: [
          `Signalement : <strong>${escapeHtml(reportTitle)}</strong>`,
          `Catégorie : ${escapeHtml(report && report.category ? report.category.name : '—')}`,
          `Adresse : ${escapeHtml(report ? report.address : '—')}`,
          full.scheduled_at ? `Planifiée le : ${escapeHtml(new Date(full.scheduled_at).toLocaleString('fr-FR'))}` : 'Non planifiée',
          full.notes ? `Notes : ${escapeHtml(full.notes)}` : ''
        ].filter(Boolean)
      });

      await safeSendMail({
        to: agent.email,
        subject: `[Intervention #${full.id}] Nouvelle assignation — ${reportTitle}`,
        html,
        text: `Une nouvelle intervention vous a été assignée : ${reportTitle}.`
      });
    }

    // Notif in-app agent
    if (agent) {
      await safeCreateNotification({
        municipality_id: municipalityId,
        user_id: agent.id,
        report_id: report ? report.id : null,
        type: 'system',
        title: 'Nouvelle intervention assignée',
        message: `Vous avez été assigné au signalement « ${reportTitle} ».`
      });
    }

    // Notif in-app admin qui a assigné (confirmation)
    if (assigner) {
      await safeCreateNotification({
        municipality_id: municipalityId,
        user_id: assigner.id,
        report_id: report ? report.id : null,
        type: 'system',
        title: 'Intervention créée',
        message: `Intervention assignée à ${agent ? agent.full_name || agent.email : 'agent inconnu'} (« ${reportTitle} »).`
      });
    }
  } catch (err) {
    logger.error(`[interventionNotifier] notifyInterventionAssigned: ${err.message}`, { err });
  }
}

/**
 * Notifie du changement de statut d'une intervention.
 * Ignore les transitions vers `cancelled` (simple log) et les transitions
 * inutiles (même statut).
 */
async function notifyInterventionStatusChanged(intervention, previousStatus) {
  try {
    if (intervention.status === previousStatus) return;
    if (intervention.status === 'cancelled') {
      logger.info(`[interventionNotifier] intervention ${intervention.id} annulée (skip notif)`);
      return;
    }

    const full = await loadFull(intervention.id);
    if (!full) return;

    const report = full.report;
    const agent = full.agent;
    const assigner = full.assigner;
    const municipalityId = report ? report.municipality_id : null;
    if (!municipalityId) return;

    const reportTitle = report ? report.title : `#${intervention.report_id}`;
    const newLabel = INTERVENTION_STATUS_LABELS[intervention.status] || intervention.status;
    const reportStatusLabel = REPORT_STATUS_LABELS[report ? report.status : ''] || '';

    // Email citoyen (si présent et joignable)
    if (report && report.citizen && report.citizen.email) {
      const isCompleted = intervention.status === 'completed';
      const subject = isCompleted
        ? `[Signalement #${report.id}] Intervention terminée`
        : `[Signalement #${report.id}] Mise à jour — ${newLabel}`;
      const html = renderEmail({
        title: isCompleted ? 'Votre signalement a été traité' : 'Mise à jour de votre signalement',
        intro: `Bonjour ${report.citizen.full_name || ''}, le statut de votre signalement a évolué.`,
        lines: [
          `Signalement : <strong>${escapeHtml(reportTitle)}</strong>`,
          `Statut signalement : <strong>${escapeHtml(reportStatusLabel)}</strong>`,
          `Intervention : <strong>${escapeHtml(newLabel)}</strong>`
        ]
      });
      await safeSendMail({
        to: report.citizen.email,
        subject,
        html,
        text: `Votre signalement « ${reportTitle} » est maintenant : ${newLabel}.`
      });
    }

    const notifType = intervention.status === 'completed' ? 'resolution' : 'status_change';

    // Notif in-app agent
    if (agent) {
      await safeCreateNotification({
        municipality_id: municipalityId,
        user_id: agent.id,
        report_id: report ? report.id : null,
        type: notifType,
        title: `Intervention — ${newLabel}`,
        message: `Le statut de votre intervention sur « ${reportTitle} » est passé à ${newLabel}.`
      });
    }

    // Notif in-app admin assignant
    if (assigner) {
      await safeCreateNotification({
        municipality_id: municipalityId,
        user_id: assigner.id,
        report_id: report ? report.id : null,
        type: notifType,
        title: `Intervention #${full.id} — ${newLabel}`,
        message: `L'intervention sur « ${reportTitle} » est passée à ${newLabel}.`
      });
    }
  } catch (err) {
    logger.error(`[interventionNotifier] notifyInterventionStatusChanged: ${err.message}`, { err });
  }
}

module.exports = {
  notifyInterventionAssigned,
  notifyInterventionStatusChanged
};
