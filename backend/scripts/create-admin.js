const { User, Municipality, License } = require('../models');
const bcrypt = require('bcrypt');

async function createDefaultAdmin() {
  try {
    // 1. S'assurer qu'une municipalité existe
    let municipality = await Municipality.findOne({ where: { name: 'Lomé' } });
    if (!municipality) {
      municipality = await Municipality.create({
        name: 'Lomé',
        contact_email: 'contact@lome.tg',
        contact_phone: '+228 90 00 00 00',
        address: 'Lomé, Togo'
      });
      console.log('✓ Municipalité Lomé créée');
    }

    // 2. S'assurer qu'une licence existe
    let license = await License.findOne({ where: { contact_email: 'contact@lome.tg' } });
    if (!license) {
      license = await License.create({
        license_key: 'LOME-2024-ABCD-1234',
        municipality_name: 'Lomé',
        contact_email: 'contact@lome.tg',
        contact_phone: '+228 90 00 00 00',
        issued_at: new Date(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
        is_active: true,
        max_users: 1000,
        max_admins: 50,
        features: { notifications: true, map: true, statistics: true, export: true }
      });
      
      municipality.license_id = license.id;
      await municipality.save();
      console.log('✓ Licence active créée et liée');
    }

    // 3. Créer le Super Admin
    const superAdminEmail = 'superadmin@lome.tg';
    let superAdmin = await User.findOne({ where: { email: superAdminEmail } });
    
    if (superAdmin) {
      await superAdmin.destroy(); // On le recrée pour être sûr du mot de passe
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin123!', salt);

    superAdmin = await User.create({
      municipality_id: municipality.id,
      role: 'super_admin',
      full_name: 'Super Administrateur',
      email: superAdminEmail,
      password_hash: passwordHash,
      phone: '+22890111111',
      is_active: true
    });
    console.log(`✓ Super Admin créé: ${superAdminEmail} / Admin123!`);

    // 4. Créer un Admin standard
    const adminEmail = 'admin@lome.tg';
    let admin = await User.findOne({ where: { email: adminEmail } });
    
    if (admin) {
      await admin.destroy();
    }

    admin = await User.create({
      municipality_id: municipality.id,
      role: 'admin',
      full_name: 'Gestionnaire Voirie',
      email: adminEmail,
      password_hash: passwordHash,
      phone: '+22890222222',
      is_active: true
    });
    console.log(`✓ Admin créé: ${adminEmail} / Admin123!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createDefaultAdmin();
