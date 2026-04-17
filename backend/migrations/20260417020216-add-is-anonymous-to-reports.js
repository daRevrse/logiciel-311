'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Ajouter la colonne is_anonymous (indépendante)
    try {
      await queryInterface.addColumn('reports', 'is_anonymous', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        after: 'status'
      });
    } catch (e) {
      // Ignorer si déjà ajoutée par une tentative précédente échouée
      console.log('Colonne is_anonymous déjà présente ou erreur ignorée');
    }

    // 2. Modifier citizen_id pour être nullable
    // On utilise SQL brut pour éviter les problèmes de validation de contraintes de Sequelize/MySQL
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    try {
      await queryInterface.sequelize.query('ALTER TABLE reports MODIFY citizen_id INTEGER NULL');
      
      // On met à jour la contrainte pour utiliser SET NULL au lieu de CASCADE
      // Il faut d'abord trouver le nom de la contrainte. Dans MySQL par défaut c'est reports_ibfk_2
      // Mais pour être sûr on tente de la supprimer par les noms courants ou on laisse tel quel 
      // si on ne peut pas la trouver facilement, le plus important est le NULL.
      
      try {
        // Tentative de trouver et supprimer la FK pour la recréer proprement
        const [results] = await queryInterface.sequelize.query(
          "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'reports' AND COLUMN_NAME = 'citizen_id' AND TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL"
        );
        
        if (results && results.length > 0) {
          const constraintName = results[0].CONSTRAINT_NAME;
          await queryInterface.sequelize.query(`ALTER TABLE reports DROP FOREIGN KEY ${constraintName}`);
          await queryInterface.sequelize.query(`ALTER TABLE reports ADD CONSTRAINT fk_reports_citizen FOREIGN KEY (citizen_id) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE`);
        }
      } catch (fkError) {
        console.warn('Erreur lors de la mise à jour de la contrainte FK:', fkError.message);
      }

    } finally {
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('reports', 'is_anonymous');
    
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    try {
      await queryInterface.sequelize.query('ALTER TABLE reports MODIFY citizen_id INTEGER NOT NULL');
    } finally {
      await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    }
  }
};
