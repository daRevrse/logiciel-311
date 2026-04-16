const { User } = require('./models');

async function cleanup() {
  try {
    console.log('--- CLEANUP STARTED ---');
    
    // Identifiants à protéger (on garde la version la plus récente avec un mot de passe)
    const emails = ['superadmin@lome.tg', 'admin@lome.tg'];
    
    for (const email of emails) {
      console.log(`Traitement de ${email}...`);
      
      // Trouver tous les doublons
      const users = await User.findAll({ where: { email } });
      
      if (users.length > 1) {
        console.log(`Trouvé ${users.length} entrées pour ${email}. Nettoyage en cours...`);
        
        // Trier par date de création décroissante et présence de mot de passe
        users.sort((a, b) => {
          if (a.password_hash && !b.password_hash) return -1;
          if (!a.password_hash && b.password_hash) return 1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
        
        // On garde le premier (le plus "valide" ou récent)
        const toKeep = users[0];
        const toDeleteIds = users.slice(1).map(u => u.id);
        
        console.log(`On garde l'utilisateur ID: ${toKeep.id}. Suppression des IDs: ${toDeleteIds.join(', ')}`);
        
        await User.destroy({
          where: {
            id: toDeleteIds
          }
        });
      } else if (users.length === 1) {
        console.log(`Déjà unique pour ${email}.`);
      } else {
        console.log(`Aucun utilisateur trouvé pour ${email}.`);
      }
    }
    
    console.log('--- CLEANUP FINISHED ---');
    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
}

cleanup();
