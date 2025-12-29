# 📝 Commandes Utiles - Logiciel 311

Guide de référence rapide pour toutes les commandes.

---

## 🗄️ MySQL

### Connexion
```bash
mysql -u root -p
```

### Créer la Base
```sql
CREATE DATABASE logiciel_311 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Utiliser la Base
```sql
USE logiciel_311;
```

### Voir les Tables
```sql
SHOW TABLES;
```

### Voir Structure Table
```sql
DESCRIBE licenses;
DESCRIBE municipalities;
DESCRIBE users;
DESCRIBE reports;
```

### Supprimer la Base (ATTENTION!)
```sql
DROP DATABASE logiciel_311;
```

---

## 📦 NPM

### Installation Dépendances
```bash
cd backend
npm install
```

### Démarrer Serveur
```bash
# Mode développement (avec nodemon - auto-reload)
npm run dev

# Mode production
npm start
```

### Migrations
```bash
# Exécuter toutes les migrations
npm run migrate

# Annuler la dernière migration
npm run migrate:undo

# Annuler toutes les migrations
npm run migrate:undo:all

# Reset complet (undo all + migrate + seed)
npm run db:reset
```

### Seeders
```bash
# Exécuter tous les seeders
npm run seed

# Exécuter tous les seeders (alias)
npx sequelize-cli db:seed:all

# Annuler tous les seeders
npx sequelize-cli db:seed:undo:all

# Exécuter un seeder spécifique
npx sequelize-cli db:seed --seed 20250101000001-demo-data.js
```

---

## 🔧 Sequelize CLI

### Créer une Migration
```bash
npx sequelize-cli migration:create --name nom-de-la-migration
```

Exemple :
```bash
npx sequelize-cli migration:create --name add-columns-to-users
```

### Créer un Seeder
```bash
npx sequelize-cli seed:create --name nom-du-seed
```

Exemple :
```bash
npx sequelize-cli seed:create --name test-categories
```

### Créer un Modèle
```bash
npx sequelize-cli model:generate --name NomModele --attributes champ1:string,champ2:integer
```

---

## 🔑 Scripts Personnalisés

### Générer Token JWT
```bash
# Super Admin (userId=1, municipalityId=1)
node scripts/generate-token.js super_admin 1 1

# Admin (userId=2, municipalityId=2)
node scripts/generate-token.js admin 2 2

# Citoyen (userId=3, municipalityId=2)
node scripts/generate-token.js citizen 3 2

# Format complet
node scripts/generate-token.js <role> <userId> <municipalityId>
```

---

## 🧪 Tests API avec cURL

### Health Check
```bash
curl http://localhost:5000/health
```

### Valider Licence
```bash
curl -X POST http://localhost:5000/api/licenses/validate \
  -H "Content-Type: application/json" \
  -d '{"licenseKey": "DEMO-LOME-2025-0001"}'
```

### Activer Licence
```bash
curl -X POST http://localhost:5000/api/licenses/activate \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "DEMO-LOME-2025-0001",
    "name": "Commune de Lomé",
    "region": "Maritime"
  }'
```

### Lister Licences (Avec Auth)
```bash
curl http://localhost:5000/api/licenses \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

### Générer Licence (Avec Auth)
```bash
curl -X POST http://localhost:5000/api/licenses/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{
    "municipalityName": "Commune de Kara",
    "contactEmail": "contact@kara.tg",
    "durationYears": 1
  }'
```

### Renouveler Licence (Avec Auth)
```bash
curl -X PUT http://localhost:5000/api/licenses/2/renew \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d '{"additionalYears": 1}'
```

---

## 📊 Requêtes SQL Utiles

### Voir Toutes les Licences
```sql
SELECT
  id,
  license_key,
  municipality_name,
  is_active,
  DATE_FORMAT(expires_at, '%Y-%m-%d') as expiration,
  DATEDIFF(expires_at, NOW()) as jours_restants
FROM licenses;
```

### Voir Municipalités avec Licences
```sql
SELECT
  m.id,
  m.name,
  m.region,
  l.license_key,
  l.is_active,
  l.expires_at
FROM municipalities m
JOIN licenses l ON m.license_id = l.id;
```

### Voir Tous les Utilisateurs
```sql
SELECT
  u.id,
  u.full_name,
  u.role,
  u.phone,
  u.is_active,
  m.name as municipalite
FROM users u
JOIN municipalities m ON u.municipality_id = m.id;
```

### Compter Utilisateurs par Municipalité
```sql
SELECT
  m.name as municipalite,
  COUNT(u.id) as nombre_utilisateurs,
  SUM(CASE WHEN u.role = 'citizen' THEN 1 ELSE 0 END) as citoyens,
  SUM(CASE WHEN u.role = 'admin' THEN 1 ELSE 0 END) as admins
FROM municipalities m
LEFT JOIN users u ON m.id = u.municipality_id
GROUP BY m.id, m.name;
```

### Voir Catégories par Municipalité
```sql
SELECT
  m.name as municipalite,
  c.name as categorie,
  c.icon,
  c.color,
  c.is_active
FROM categories c
JOIN municipalities m ON c.municipality_id = m.id
ORDER BY m.name, c.display_order;
```

### Licences Expirantes (< 30 jours)
```sql
SELECT
  license_key,
  municipality_name,
  expires_at,
  DATEDIFF(expires_at, NOW()) as jours_restants
FROM licenses
WHERE is_active = 1
  AND DATEDIFF(expires_at, NOW()) <= 30
  AND DATEDIFF(expires_at, NOW()) >= 0;
```

### Supprimer Toutes les Données (RESET)
```sql
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE activity_logs;
TRUNCATE TABLE notifications;
TRUNCATE TABLE status_history;
TRUNCATE TABLE supports;
TRUNCATE TABLE report_photos;
TRUNCATE TABLE reports;
TRUNCATE TABLE categories;
TRUNCATE TABLE users;
TRUNCATE TABLE municipalities;
TRUNCATE TABLE licenses;
SET FOREIGN_KEY_CHECKS = 1;
```

---

## 📁 Fichiers & Dossiers

### Voir Structure Projet
```bash
# Windows
tree /F

# Linux/Mac
tree -L 3
```

### Voir Logs en Direct
```bash
# Windows PowerShell
Get-Content backend\logs\app-2025-01-27.log -Wait

# Linux/Mac
tail -f backend/logs/app-2025-01-27.log
```

### Supprimer Logs
```bash
# Windows
del backend\logs\*.log

# Linux/Mac
rm backend/logs/*.log
```

### Supprimer node_modules
```bash
# Windows
rmdir /s /q backend\node_modules

# Linux/Mac
rm -rf backend/node_modules
```

---

## 🔍 Debugging

### Activer Logs SQL
Éditer `backend/config/database.js` :
```javascript
logging: console.log  // Au lieu de false
```

### Voir Variables Environnement
```bash
node -e "require('dotenv').config({path:'backend/.env'}); console.log(process.env)"
```

### Tester Connexion MySQL
```bash
node -e "
const mysql = require('mysql2/promise');
mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'logiciel_311'
}).then(() => console.log('✓ Connexion réussie'))
  .catch(err => console.error('✗ Erreur:', err.message));
"
```

### Vérifier Port Utilisé
```bash
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000
```

---

## 🧹 Maintenance

### Nettoyer Cache NPM
```bash
npm cache clean --force
```

### Réinstaller Dépendances
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Vérifier Vulnérabilités
```bash
npm audit

# Corriger automatiquement
npm audit fix
```

### Mettre à Jour Dépendances
```bash
# Vérifier versions disponibles
npm outdated

# Mettre à jour (prudence!)
npm update
```

---

## 🚀 Déploiement

### Build Production (Future)
```bash
npm run build
```

### Variables Env Production
```bash
# Créer .env.production
cp .env.example .env.production

# Éditer avec valeurs production
nano .env.production
```

### Démarrer avec PM2 (Production)
```bash
# Installer PM2
npm install -g pm2

# Démarrer
pm2 start server.js --name logiciel-311

# Voir status
pm2 status

# Voir logs
pm2 logs logiciel-311

# Redémarrer
pm2 restart logiciel-311

# Arrêter
pm2 stop logiciel-311
```

---

## 🔐 Sécurité

### Générer Secret JWT Fort
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Générer Master Key Licence
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 📚 Documentation

### Voir README
```bash
cat README.md
```

### Voir Guide Rapide
```bash
cat QUICK_START.md
```

### Voir Guide Tests
```bash
cat TESTING_GUIDE.md
```

### Voir Résumé
```bash
cat SUMMARY.md
```

---

## 💡 Raccourcis Utiles

### Workflow Complet (Première Installation)
```bash
# 1. Créer DB
mysql -u root -p -e "CREATE DATABASE logiciel_311"

# 2. Aller dans backend
cd backend

# 3. Configurer .env
code .env  # Ou nano .env

# 4. Installer dépendances
npm install

# 5. Migrations
npm run migrate

# 6. Données test
npm run seed

# 7. Démarrer
npm run dev
```

### Workflow Reset Complet
```bash
# Tout supprimer et recommencer
cd backend
npm run migrate:undo:all
npm run migrate
npm run seed
npm run dev
```

### Test Rapide API
```bash
# Terminal 1: Serveur
cd backend && npm run dev

# Terminal 2: Tests
curl http://localhost:5000/health
node scripts/generate-token.js super_admin 1 1
```

---

**📌 Astuce** : Ajouter ces commandes à vos favoris pour accès rapide !
