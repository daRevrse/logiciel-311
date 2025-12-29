'use strict';

/**
 * Seeder de données de démonstration
 * Crée un super admin et une licence test
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Créer une licence système pour super admin
    await queryInterface.bulkInsert('licenses', [{
      license_key: 'DEMO-SYST-EM00-0001',
      municipality_name: 'Système - Super Admin',
      contact_email: 'superadmin@logiciel311.tg',
      contact_phone: '+22890000000',
      issued_at: new Date(),
      expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 10)),
      is_active: true,
      max_users: 9999,
      max_admins: 100,
      features: JSON.stringify({
        notifications: true,
        map: true,
        statistics: true,
        export: true
      }),
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // 2. Créer une municipalité système
    await queryInterface.bulkInsert('municipalities', [{
      license_id: 1,
      name: 'Système',
      region: 'National',
      contact_email: 'superadmin@logiciel311.tg',
      contact_phone: '+22890000000',
      address: 'Lomé, Togo',
      settings: JSON.stringify({
        theme: {
          primaryColor: '#3B82F6',
          secondaryColor: '#10B981'
        }
      }),
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // 3. Créer le super administrateur
    await queryInterface.bulkInsert('users', [{
      municipality_id: 1,
      phone: '+22890000000',
      device_fingerprint: 'superadmin-device-001',
      full_name: 'Super Administrateur',
      email: 'superadmin@logiciel311.tg',
      role: 'super_admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // 4. Créer une licence de démonstration pour Lomé
    await queryInterface.bulkInsert('licenses', [{
      license_key: 'DEMO-LOME-2025-0001',
      municipality_name: 'Commune de Lomé',
      contact_email: 'contact@lome.demo.tg',
      contact_phone: '+22890111111',
      issued_at: new Date(),
      expires_at: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      is_active: true,
      max_users: 1000,
      max_admins: 50,
      features: JSON.stringify({
        notifications: true,
        map: true,
        statistics: true,
        export: false
      }),
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // 5. Créer la municipalité de Lomé
    await queryInterface.bulkInsert('municipalities', [{
      license_id: 2,
      name: 'Commune de Lomé',
      region: 'Maritime',
      contact_email: 'contact@lome.demo.tg',
      contact_phone: '+22890111111',
      address: 'Avenue de la Libération, Lomé',
      settings: JSON.stringify({
        theme: {
          primaryColor: '#059669',
          secondaryColor: '#F59E0B'
        },
        map: {
          defaultZoom: 13,
          center: {
            lat: 6.1319,
            lng: 1.2228
          }
        }
      }),
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // 6. Créer un administrateur pour Lomé
    await queryInterface.bulkInsert('users', [{
      municipality_id: 2,
      phone: '+22890222222',
      full_name: 'Admin Lomé',
      email: 'admin@lome.demo.tg',
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // 7. Créer quelques citoyens test pour Lomé
    await queryInterface.bulkInsert('users', [
      {
        municipality_id: 2,
        phone: '+22890333333',
        full_name: 'Kofi Mensah',
        role: 'citizen',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        municipality_id: 2,
        phone: '+22890444444',
        full_name: 'Akosua Adjei',
        role: 'citizen',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        municipality_id: 2,
        device_fingerprint: 'device-fingerprint-12345',
        full_name: 'Kwame Nkrumah',
        role: 'citizen',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // 8. Créer des catégories pour Lomé
    const categories = [
      { name: 'Route dégradée', icon: 'road', color: '#EF4444' },
      { name: 'Éclairage public', icon: 'light', color: '#F59E0B' },
      { name: 'Déchets / Insalubrité', icon: 'trash', color: '#10B981' },
      { name: 'Eau / Canalisation', icon: 'water', color: '#3B82F6' },
      { name: 'Espaces verts', icon: 'park', color: '#22C55E' },
      { name: 'Signalisation', icon: 'sign', color: '#8B5CF6' },
      { name: 'Autre', icon: 'default', color: '#6B7280' }
    ];

    await queryInterface.bulkInsert('categories',
      categories.map((cat, index) => ({
        municipality_id: 2,
        name: cat.name,
        description: `Catégorie pour les signalements de type: ${cat.name}`,
        icon: cat.icon,
        color: cat.color,
        is_active: true,
        display_order: index + 1,
        created_at: new Date(),
        updated_at: new Date()
      }))
    );

    console.log('✅ Données de démonstration créées avec succès !');
    console.log('\n📋 INFORMATIONS DE CONNEXION:\n');
    console.log('Super Admin:');
    console.log('  Téléphone: +22890000000');
    console.log('  Licence: DEMO-SYST-EM00-0001');
    console.log('\nAdmin Lomé:');
    console.log('  Téléphone: +22890222222');
    console.log('  Licence: DEMO-LOME-2025-0001');
    console.log('\nCitoyens Lomé:');
    console.log('  +22890333333 (Kofi Mensah)');
    console.log('  +22890444444 (Akosua Adjei)');
    console.log('  device-fingerprint-12345 (Kwame Nkrumah)');
  },

  down: async (queryInterface, Sequelize) => {
    // Supprimer dans l'ordre inverse des dépendances
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('municipalities', null, {});
    await queryInterface.bulkDelete('licenses', null, {});
  }
};
