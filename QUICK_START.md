# 🚀 Guide de Démarrage Rapide - Logiciel 311

## ⚡ Démarrage en 5 Minutes

### Étape 1 : Créer la Base de Données

Ouvrez MySQL et exécutez :

```sql
CREATE DATABASE logiciel_311 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Étape 2 : Configurer les Variables d'Environnement

Le fichier `.env` est déjà créé dans `backend/`. **Vérifiez et modifiez uniquement** :

```env
DB_PASSWORD=votre_mot_de_passe_mysql
```

### Étape 3 : Exécuter les Migrations

```bash
cd backend
npm run migrate
```

Vous devriez voir :
```
Sequelize CLI [Node: 16.x.x, CLI: 6.x.x, ORM: 6.x.x]

== 20250101000001-create-licenses: migrating =======
== 20250101000001-create-licenses: migrated (0.234s)
...
```

### Étape 4 : Démarrer le Serveur

```bash
npm run dev
```

Sortie attendue :
```
info: ✓ Connexion à la base de données établie
info: 🚀 Serveur démarré sur le port 5000
info: 📍 Environnement: development
info: 🌐 URL: http://localhost:5000
```

### Étape 5 : Tester l'API

#### Test de santé
```bash
curl http://localhost:5000/health
```

Réponse :
```json
{
  "status": "OK",
  "timestamp": "2025-01-27T10:30:00.000Z",
  "uptime": 5.234,
  "environment": "development"
}
```

---

## 🔑 Premier Cas d'Usage : Générer et Activer une Licence

### 1. Créer un Super Admin Manuellement (SQL)

```sql
USE logiciel_311;

-- Créer une licence test
INSERT INTO licenses (license_key, municipality_name, contact_email, issued_at, expires_at, is_active, max_users, max_admins)
VALUES ('TEST-0000-0000-0001', 'Super Admin License', 'admin@system.tg', NOW(), DATE_ADD(NOW(), INTERVAL 10 YEAR), 1, 9999, 100);

-- Créer une municipalité système
INSERT INTO municipalities (license_id, name, region, contact_email)
VALUES (1, 'Système', 'National', 'admin@system.tg');

-- Créer le super admin
INSERT INTO users (municipality_id, phone, full_name, role, is_active)
VALUES (1, '+22890000000', 'Super Administrateur', 'super_admin', 1);
```

### 2. Obtenir un Token JWT

Créez un fichier `test-auth.js` dans `backend/` :

```javascript
const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign(
  { userId: 1, municipalityId: 1, role: 'super_admin' },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

console.log('Token JWT Super Admin:');
console.log(token);
```

Exécutez :
```bash
node test-auth.js
```

Copiez le token affiché.

### 3. Générer une Licence pour une Municipalité

```bash
curl -X POST http://localhost:5000/api/licenses/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -d '{
    "municipalityName": "Commune de Lomé",
    "contactEmail": "contact@lome.tg",
    "contactPhone": "+22890123456",
    "durationYears": 1,
    "maxUsers": 1000,
    "maxAdmins": 50
  }'
```

Réponse :
```json
{
  "success": true,
  "message": "Licence générée avec succès",
  "data": {
    "id": 2,
    "licenseKey": "A1B2-C3D4-E5F6-G7H8",
    "municipalityName": "Commune de Lomé",
    "contactEmail": "contact@lome.tg",
    "expiresAt": "2026-01-27T10:30:00.000Z"
  }
}
```

### 4. Valider la Licence (Sans Auth)

```bash
curl -X POST http://localhost:5000/api/licenses/validate \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "A1B2-C3D4-E5F6-G7H8"
  }'
```

### 5. Activer la Licence pour la Municipalité (Sans Auth)

```bash
curl -X POST http://localhost:5000/api/licenses/activate \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "A1B2-C3D4-E5F6-G7H8",
    "name": "Commune de Lomé",
    "region": "Maritime",
    "contactEmail": "contact@lome.tg",
    "contactPhone": "+22890123456",
    "address": "Avenue de la Libération, Lomé"
  }'
```

Réponse :
```json
{
  "success": true,
  "message": "Licence activée avec succès",
  "data": {
    "municipalityId": 2,
    "name": "Commune de Lomé",
    "region": "Maritime"
  }
}
```

✅ **La municipalité est maintenant opérationnelle !**

---

## 📊 Vérifier les Données

```sql
-- Voir toutes les licences
SELECT id, license_key, municipality_name, is_active, expires_at FROM licenses;

-- Voir toutes les municipalités
SELECT m.id, m.name, m.region, l.license_key, l.expires_at
FROM municipalities m
JOIN licenses l ON m.license_id = l.id;

-- Voir tous les utilisateurs
SELECT id, full_name, role, municipality_id FROM users;
```

---

## 🧪 Tests Rapides avec Thunder Client / Postman

### Collection à Importer

Créez une collection avec ces endpoints :

1. **Health Check** - GET `http://localhost:5000/health`
2. **Generate License** - POST `http://localhost:5000/api/licenses/generate`
3. **Validate License** - POST `http://localhost:5000/api/licenses/validate`
4. **Activate License** - POST `http://localhost:5000/api/licenses/activate`
5. **List Licenses** - GET `http://localhost:5000/api/licenses`

---

## ❌ Résolution de Problèmes

### Erreur : `ER_NOT_SUPPORTED_AUTH_MODE`
MySQL 8+ utilise `caching_sha2_password`. Solution :

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'votre_password';
FLUSH PRIVILEGES;
```

### Erreur : `connect ECONNREFUSED`
MySQL n'est pas démarré :
```bash
# Windows
net start MySQL80

# Linux/Mac
sudo service mysql start
```

### Erreur : `Migrations pending`
```bash
npm run migrate
```

### Port 5000 occupé
Changer dans `.env` :
```env
PORT=5001
```

---

## 📝 Prochaines Étapes

Maintenant que le backend fonctionne :

1. ✅ Système de licences opérationnel
2. 🔄 Développer l'authentification citoyen
3. 🔄 CRUD Signalements
4. 🔄 Système d'appui
5. 🔄 Frontend React

---

## 🆘 Besoin d'Aide ?

- Vérifier `backend/logs/app-YYYY-MM-DD.log` pour les erreurs
- Activer SQL logging dans `config/database.js` : `logging: console.log`
- Consulter le README principal

**Bon développement ! 🚀**
