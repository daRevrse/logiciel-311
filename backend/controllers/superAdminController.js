/**
 * Gestion des comptes super_admin (création / liste).
 */
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { User } = require('../models');
const mailService = require('../services/mailService');
const logger = require('../utils/logger');

exports.listSuperAdmins = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: 'super_admin' },
      attributes: { exclude: ['password_hash', 'verification_code', 'verification_expires_at'] },
      order: [['created_at', 'DESC']]
    });
    res.json({ success: true, data: users, count: users.length });
  } catch (err) {
    logger.error(`Erreur listSuperAdmins: ${err.message}`);
    res.status(500).json({ success: false, message: 'Erreur chargement super admins' });
  }
};

exports.createSuperAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Erreur de validation', errors: errors.array() });
    }

    const { full_name, email, phone } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: `Un utilisateur avec l'email ${email} existe déjà` });
    }

    const tempPassword = crypto.randomBytes(9).toString('base64').replace(/[+/=]/g, '').slice(0, 12);
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const user = await User.create({
      municipality_id: null,
      role: 'super_admin',
      full_name,
      email,
      phone,
      password_hash: passwordHash,
      is_active: true
    });

    const emailResult = await mailService.sendMail({
      to: email,
      subject: `[Muno] Compte super administrateur créé`,
      text: `Bonjour ${full_name},\n\nVotre compte super administrateur Muno a été créé.\nEmail : ${email}\nMot de passe temporaire : ${tempPassword}\nChangez votre mot de passe après la première connexion.`,
      html: `<p>Bonjour <strong>${full_name}</strong>,</p><p>Votre compte super administrateur Muno a été créé.</p><ul><li>Email : <code>${email}</code></li><li>Mot de passe temporaire : <code>${tempPassword}</code></li></ul><p>Changez votre mot de passe après la première connexion.</p>`
    });

    logger.info(`Super admin créé: ${email}`);
    res.status(201).json({
      success: true,
      data: {
        user: { id: user.id, email: user.email, full_name: user.full_name, phone: user.phone, role: user.role },
        temp_password: tempPassword,
        email_sent: emailResult.sent
      }
    });
  } catch (err) {
    logger.error(`Erreur createSuperAdmin: ${err.message}`);
    res.status(500).json({ success: false, message: 'Erreur création super admin', error: err.message });
  }
};
