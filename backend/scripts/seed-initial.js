/**
 * Script de seed pour créer la première municipalité et le premier super admin
 *
 * Usage:
 *   node backend/scripts/seed-initial.js
 *
 * Ce script crée:
 * - Une municipalité de test avec licence valide
 * - Un super admin avec numéro +22890000001
 * - Des catégories par défaut
 * - Un citoyen de test
 */

const { Municipality, User, Category, License } = require('../models');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Génère une clé de licence unique
 * Format: XXXX-XXXX-XXXX-XXXX
 */
function generateLicenseKey() {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    const segment = crypto.randomBytes(2).toString('hex').toUpperCase();
    segments.push(segment);
  }
  return segments.join('-');
}

async function seed() {
  try {
    console.log('\n🌱 Démarrage du seed...\n');

    // 1. Créer la licence d'abord
    console.log('🔑 Création de la licence...');
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const license = await License.create({
      license_key: generateLicenseKey(),
      municipality_name: 'Lomé',
      contact_email: 'admin@lome.tg',
      contact_phone: '+22822123456',
      issued_at: new Date(),
      expires_at: oneYearFromNow,
      max_users: 1000,
      max_admins: 50,
      is_active: true,
      features: {
        notifications: true,
        map: true,
        statistics: true,
        export: true
      }
    });
    console.log(`✅ Licence créée: ${license.license_key}`);
    console.log(`   Valide jusqu'au: ${license.expires_at.toLocaleDateString('fr-FR')}\n`);

    // 2. Créer la municipalité avec la licence
    console.log('📍 Création de la municipalité...');
    const municipality = await Municipality.create({
      license_id: license.id,
      name: 'Lomé',
      region: 'Maritime',
      contact_email: 'admin@lome.tg',
      contact_phone: '+22822123456',
      address: 'Avenue de la République, Lomé'
    });
    console.log(`✅ Municipalité créée: ${municipality.name} (ID: ${municipality.id})\n`);

    // 3. Créer le super admin
    console.log('👤 Création du super admin...');
    const superAdmin = await User.create({
      municipality_id: municipality.id,
      phone: '+22890000001',
      email: 'superadmin@lome.tg',
      full_name: 'Super Admin Lomé',
      role: 'super_admin',
      is_active: true
    });
    await superAdmin.setPassword('admin123');
    await superAdmin.save();
    console.log(`✅ Super Admin créé:`);
    console.log(`   Nom: ${superAdmin.full_name}`);
    console.log(`   Téléphone: ${superAdmin.phone}`);
    console.log(`   Email: ${superAdmin.email}`);
    console.log(`   Mot de passe: admin123`);
    console.log(`   Rôle: ${superAdmin.role}\n`);

    // 4. Créer un admin
    console.log('👤 Création d\'un admin...');
    const admin = await User.create({
      municipality_id: municipality.id,
      phone: '+22890000002',
      email: 'admin@lome.tg',
      full_name: 'Admin Lomé',
      role: 'admin',
      is_active: true
    });
    await admin.setPassword('admin123');
    await admin.save();
    console.log(`✅ Admin créé:`);
    console.log(`   Nom: ${admin.full_name}`);
    console.log(`   Téléphone: ${admin.phone}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Mot de passe: admin123\n`);

    // 5. Créer un citoyen de test
    console.log('👤 Création d\'un citoyen de test...');
    const citizen = await User.create({
      municipality_id: municipality.id,
      phone: '+22890123456',
      email: 'citoyen@test.tg',
      full_name: 'Citoyen Test',
      role: 'citizen',
      is_active: true
    });
    console.log(`✅ Citoyen créé:`);
    console.log(`   Nom: ${citizen.full_name}`);
    console.log(`   Téléphone: ${citizen.phone}\n`);

    // 6. Créer les catégories par défaut
    console.log('🏷️  Création des catégories...');
    const categories = [
      {
        name: 'Voirie',
        description: 'Problèmes de routes, nids-de-poule, signalisation',
        icon: 'construction',
        color: '#F59E0B'
      },
      {
        name: 'Éclairage public',
        description: 'Lampadaires défectueux, zones mal éclairées',
        icon: 'lightbulb',
        color: '#FBBF24'
      },
      {
        name: 'Déchets',
        description: 'Ordures non ramassées, dépôts sauvages',
        icon: 'trash-2',
        color: '#10B981'
      },
      {
        name: 'Eau et assainissement',
        description: 'Fuites d\'eau, caniveaux bouchés, inondations',
        icon: 'droplet',
        color: '#3B82F6'
      },
      {
        name: 'Espaces verts',
        description: 'Parcs, jardins, arbres dangereux',
        icon: 'tree-pine',
        color: '#059669'
      },
      {
        name: 'Sécurité',
        description: 'Problèmes de sécurité, zones dangereuses',
        icon: 'alert-triangle',
        color: '#EF4444'
      },
      {
        name: 'Bâtiments publics',
        description: 'Problèmes dans les écoles, centres de santé, etc.',
        icon: 'home',
        color: '#8B5CF6'
      },
      {
        name: 'Transport',
        description: 'Transports en commun, stationnement',
        icon: 'car',
        color: '#6366F1'
      }
    ];

    for (const categoryData of categories) {
      const category = await Category.create({
        municipality_id: municipality.id,
        ...categoryData,
        active: true
      });
      console.log(`   ✓ ${category.name}`);
    }

    console.log('\n✨ Seed terminé avec succès!\n');
    console.log('📝 Résumé:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Municipalité: ${municipality.name}`);
    console.log(`Licence: ${license.license_key}`);
    console.log(`Valide jusqu'au: ${license.expires_at.toLocaleDateString('fr-FR')}`);
    console.log('\nUtilisateurs créés:');
    console.log(`  🔑 Super Admin: ${superAdmin.email} (mot de passe: admin123)`);
    console.log(`  👮 Admin: ${admin.email} (mot de passe: admin123)`);
    console.log(`  👤 Citoyen: ${citizen.phone}`);
    console.log(`\nCatégories: ${categories.length} créées`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('💡 Pour vous connecter:');
    console.log('   Admins:');
    console.log('   1. Allez sur /admin/login');
    console.log('   2. Utilisez l\'email et le mot de passe ci-dessus');
    console.log('');
    console.log('   Citoyens:');
    console.log('   1. Allez sur /login');
    console.log('   2. Utilisez le numéro de téléphone ci-dessus\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Erreur lors du seed:', error);
    console.error(error);
    process.exit(1);
  }
}

// Exécuter le seed
seed();
