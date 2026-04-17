const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

function buildTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_PORT) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT, 10),
    secure: String(SMTP_SECURE || '').toLowerCase() === 'true',
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined
  });
}

function isConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_PORT);
}

async function sendMail({ to, subject, html, text }) {
  if (!isConfigured()) {
    logger.warn(`[mail] SMTP non configuré, email "${subject}" vers ${to} ignoré.`);
    return { sent: false, reason: 'smtp_not_configured' };
  }
  if (!transporter) transporter = buildTransporter();

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@muno.local';
  try {
    const info = await transporter.sendMail({ from, to, subject, html, text });
    logger.info(`[mail] envoyé à ${to} (${subject}) id=${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    logger.error(`[mail] échec envoi à ${to}: ${err.message}`);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendMail, isConfigured };
