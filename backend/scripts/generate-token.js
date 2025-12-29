/**
 * Script pour générer des tokens JWT de test
 * Usage: node scripts/generate-token.js [role] [userId] [municipalityId]
 * Exemple: node scripts/generate-token.js super_admin 1 1
 */

const jwt = require('jsonwebtoken');
const path = require('path');

// Charger les variables d'environnement
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Récupérer les arguments
const args = process.argv.slice(2);
const role = args[0] || 'citizen';
const userId = parseInt(args[1]) || 1;
const municipalityId = parseInt(args[2]) || 1;

// Valider le rôle
const validRoles = ['citizen', 'admin', 'super_admin'];
if (!validRoles.includes(role)) {
  console.error(`❌ Rôle invalide. Utilisez: ${validRoles.join(', ')}`);
  process.exit(1);
}

// Générer le token
const payload = {
  userId,
  municipalityId,
  role
};

const token = jwt.sign(
  payload,
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

// Afficher les informations
console.log('\n📱 TOKEN JWT GÉNÉRÉ\n');
console.log('═'.repeat(60));
console.log(`Rôle         : ${role}`);
console.log(`User ID      : ${userId}`);
console.log(`Municipality : ${municipalityId}`);
console.log(`Expiration   : ${process.env.JWT_EXPIRES_IN || '7d'}`);
console.log('═'.repeat(60));
console.log('\n🔑 TOKEN:\n');
console.log(token);
console.log('\n📋 UTILISATION:\n');
console.log('Authorization: Bearer ' + token);
console.log('\n💡 CURL EXEMPLE:\n');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:5000/api/licenses`);
console.log('\n');
