const { Op } = require('sequelize');
const { Report, User, Notification, ActivityLog } = require('../models');
const logger = require('../utils/logger');

const SLA_BREACH_BOOST = 50;
const ACTIVE_STATUSES = ['pending', 'assigned', 'in_progress'];

async function runOnce(realtime = null) {
  const now = new Date();
  try {
    const overdue = await Report.findAll({
      where: {
        status: { [Op.in]: ACTIVE_STATUSES },
        sla_due_at: { [Op.lt]: now },
        escalated_at: null
      },
      limit: 100
    });

    if (!overdue.length) return { processed: 0 };

    for (const report of overdue) {
      try {
        report.escalated_at = now;
        report.priority_score = (report.priority_score || 0) + SLA_BREACH_BOOST;
        await report.save({ hooks: false });

        // Notifier admins de la municipalité
        const admins = await User.findAll({
          where: {
            municipality_id: report.municipality_id,
            role: ['admin', 'super_admin'],
            is_active: true
          },
          attributes: ['id']
        });

        await Promise.all(admins.map(admin => Notification.create({
          municipality_id: report.municipality_id,
          user_id: admin.id,
          report_id: report.id,
          type: 'system',
          title: `SLA dépassé - Signalement #${report.id}`,
          message: `Le signalement "${report.title}" a dépassé son délai SLA.`
        })));

        await ActivityLog.create({
          municipality_id: report.municipality_id,
          user_id: null,
          action: 'sla_breach',
          entity_type: 'report',
          entity_id: report.id,
          details: { sla_due_at: report.sla_due_at, escalated_at: now }
        }).catch(() => {});

        if (realtime) {
          admins.forEach(admin => realtime.emitToUser(admin.id, 'sla:breach', {
            reportId: report.id,
            title: report.title
          }));
        }
      } catch (err) {
        logger.error(`SLA escalation error report ${report.id}:`, err);
      }
    }

    logger.info(`✅ SLA job : ${overdue.length} signalements escaladés`);
    return { processed: overdue.length };
  } catch (error) {
    logger.error('Erreur slaEscalationJob:', error);
    return { processed: 0, error: error.message };
  }
}

function start(app) {
  const intervalMs = parseInt(process.env.SLA_JOB_INTERVAL_MS, 10) || 60 * 60 * 1000; // 1h
  const realtime = app && app.get ? app.get('realtime') : null;
  setInterval(() => runOnce(realtime).catch(e => logger.error('SLA tick error', e)), intervalMs);
  logger.info(`⏱  SLA escalation job démarré (intervalle ${intervalMs}ms)`);
  // Premier passage après 1 minute pour ne pas bloquer le démarrage
  setTimeout(() => runOnce(realtime).catch(() => {}), 60 * 1000);
}

module.exports = { start, runOnce };
