# 📱 Logiciel 311 - Signalement Citoyen Togo

Application web responsive de signalement citoyen adaptée au contexte togolais. Permet aux citoyens de signaler des problèmes urbains et aux municipalités de prioriser les interventions.

## 🎯 Modèle Commercial

- **Vente par licence** : Chaque municipalité achète une clé de licence pour activer son instance
- **Architecture multi-tenant** : Isolation totale des données par municipalité
- **Une licence = une commune** avec ses propres données

---

## 🛠️ Stack Technique

### Backend
- **Runtime** : Node.js avec Express.js
- **Base de données** : MySQL
- **ORM** : Sequelize
- **Authentification** : JWT (JSON Web Tokens)
- **Architecture** : RESTful API multi-tenant

### Frontend
- **Framework** : React (Vite)
- **Langage** : JavaScript
- **Styling** : Tailwind CSS
- **Routing** : React Router
- **HTTP Client** : Axios

### Outils Complémentaires
- **Upload fichiers** : Multer
- **Hash mots de passe** : Bcrypt
- **Variables env** : Dotenv
- **Emails** : Nodemailer
- **Logs** : Winston avec rotation quotidienne
- **Rate Limiting** : express-rate-limit

---

## 📂 Structure du Projet

```
logiciel-311/
├── backend/
│   ├── config/
│   │   └── database.js              # Configuration Sequelize
│   ├── controllers/
│   │   └── licenseController.js     # Contrôleur licences
│   ├── middlewares/
│   │   ├── auth.js                  # Authentification JWT
│   │   ├── license.js               # Validation licences
│   │   ├── multiTenant.js           # Isolation multi-tenant
│   │   ├── requestLogger.js         # Logging requêtes
│   │   └── rateLimiter.js           # Protection rate limit
│   ├── migrations/                  # Migrations Sequelize
│   │   ├── 20250101000001-create-licenses.js
│   │   ├── 20250101000002-create-municipalities.js
│   │   ├── 20250101000003-create-categories.js
│   │   ├── 20250101000004-create-users.js
│   │   ├── 20250101000005-create-reports.js
│   │   ├── 20250101000006-create-report-photos.js
│   │   ├── 20250101000007-create-supports.js
│   │   ├── 20250101000008-create-status-history.js
│   │   ├── 20250101000009-create-notifications.js
│   │   └── 20250101000010-create-activity-logs.js
│   ├── models/
│   │   ├── index.js                 # Point d'entrée Sequelize
│   │   ├── License.js               # Modèle Licence
│   │   ├── Municipality.js          # Modèle Municipalité
│   │   ├── Category.js              # Modèle Catégorie
│   │   ├── User.js                  # Modèle Utilisateur
│   │   ├── Report.js                # Modèle Signalement
│   │   ├── ReportPhoto.js           # Modèle Photo
│   │   ├── Support.js               # Modèle Appui
│   │   ├── StatusHistory.js         # Modèle Historique
│   │   ├── Notification.js          # Modèle Notification
│   │   └── ActivityLog.js           # Modèle Log activité
│   ├── routes/
│   │   └── license.routes.js        # Routes licences
│   ├── services/
│   │   └── licenseService.js        # Service licences
│   ├── utils/
│   │   └── logger.js                # Logger Winston
│   ├── uploads/                     # Fichiers uploadés
│   ├── seeders/                     # Seeders (données test)
│   ├── .env.example                 # Template variables env
│   ├── .sequelizerc                 # Config Sequelize CLI
│   ├── server.js                    # Point d'entrée serveur
│   └── package.json
│
├── frontend/                        # (À créer)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── citizen/
│   │   │   └── admin/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── utils/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
│
├── docs/
│   └── Fonctionnalites_Logiciel_311.xlsx
└── README.md
```

---

## 🗄️ Schéma de Base de Données

### Tables Principales

1. **licenses** - Gestion des clés de licence
   - Champs : `license_key`, `municipality_name`, `expires_at`, `max_users`, `max_admins`, `features`
   - Méthodes : `isExpired()`, `isValid()`, `daysRemaining()`

2. **municipalities** - Informations des communes
   - Relation : 1-1 avec `licenses`
   - Champs : `name`, `region`, `logo_url`, `settings` (JSON)

3. **users** - Citoyens et administrateurs
   - Authentification : `phone` OU `device_fingerprint`
   - Rôles : `citizen`, `admin`, `super_admin`

4. **categories** - Types de problèmes
   - Unique par municipalité
   - Champs : `name`, `icon`, `color`, `is_active`

5. **reports** - Signalements
   - Champs : `title`, `description`, `address`, `lat/lng`, `status`, `priority_score`
   - Statuts : `pending`, `in_progress`, `resolved`, `rejected`

6. **supports** - Appuis citoyens
   - Contrainte : 1 citoyen = 1 appui par signalement
   - Auto-update du `priority_score`

7. **status_history** - Historique des changements
8. **notifications** - Notifications utilisateurs
9. **activity_logs** - Logs audit
10. **report_photos** - Photos signalements

### Calcul Priority Score
```javascript
priority_score = nombre_supports + (ancienneté_en_jours * 0.5)
```

---

## 🚀 Installation

### Prérequis
- Node.js >= 16.x
- MySQL >= 8.0
- npm ou yarn

### 1. Cloner le projet
```bash
git clone <repo-url>
cd logiciel-311
```

### 2. Installation Backend

```bash
cd backend
npm install
```

### 3. Configuration Environnement

Copier `.env.example` vers `.env` :
```bash
cp .env.example .env
```

Éditer `.env` avec vos informations :
```env
# Base de données
DB_HOST=localhost
DB_PORT=3306
DB_NAME=logiciel_311
DB_USER=root
DB_PASSWORD=votre_mot_de_passe

# JWT
JWT_SECRET=votre_secret_jwt_tres_securise

# Clé master licences
LICENSE_MASTER_KEY=master_key_super_securisee

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173
```

### 4. Créer la Base de Données

```bash
mysql -u root -p
CREATE DATABASE logiciel_311 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 5. Exécuter les Migrations

```bash
npm run migrate
```

### 6. Démarrer le Serveur

```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

Le serveur démarre sur `http://localhost:5000`

---

## 📡 API Endpoints - Système de Licences

### Routes Publiques

#### Valider une Licence
```http
POST /api/licenses/validate
Content-Type: application/json

{
  "licenseKey": "XXXX-XXXX-XXXX-XXXX"
}
```

**Réponse (succès) :**
```json
{
  "success": true,
  "message": "Licence valide",
  "data": {
    "valid": true,
    "municipalityName": "Commune de Lomé",
    "expiresAt": "2026-01-01T00:00:00.000Z",
    "daysRemaining": 365,
    "features": {
      "notifications": true,
      "map": true,
      "statistics": true,
      "export": false
    }
  }
}
```

#### Activer une Licence
```http
POST /api/licenses/activate
Content-Type: application/json

{
  "licenseKey": "XXXX-XXXX-XXXX-XXXX",
  "name": "Commune de Lomé",
  "region": "Maritime",
  "contactEmail": "contact@lome.tg",
  "contactPhone": "+22890123456"
}
```

### Routes Super Admin

> ⚠️ **Authentification requise** : Header `Authorization: Bearer <JWT_TOKEN>`

#### Générer une Licence
```http
POST /api/licenses/generate
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "municipalityName": "Commune de Kara",
  "contactEmail": "contact@kara.tg",
  "contactPhone": "+22890123456",
  "durationYears": 1,
  "maxUsers": 1000,
  "maxAdmins": 50,
  "features": {
    "notifications": true,
    "map": true,
    "statistics": true,
    "export": true
  }
}
```

#### Lister Toutes les Licences
```http
GET /api/licenses
Authorization: Bearer <super_admin_token>
```

#### Renouveler une Licence
```http
PUT /api/licenses/:id/renew
Authorization: Bearer <super_admin_token>
Content-Type: application/json

{
  "additionalYears": 1
}
```

#### Désactiver une Licence
```http
PUT /api/licenses/:id/deactivate
Authorization: Bearer <super_admin_token>
```

#### Vérifier Licences Expirantes
```http
GET /api/licenses/expiring
Authorization: Bearer <super_admin_token>
```

---

## 🔒 Sécurité

### Multi-Tenant
- Isolation totale : chaque requête filtrée par `municipality_id`
- Middleware `multiTenant.js` vérifie ownership des ressources
- Logging automatique des tentatives cross-tenant

### Authentification
- JWT stocké côté client
- Expiration configurable (défaut: 7 jours)
- Refresh token (à implémenter)

### Rate Limiting
- Général : 100 req / 15 min
- Authentification : 5 tentatives / 15 min
- Création signalement : 10 / heure
- Upload : 50 fichiers / heure

### Validation
- Validation inputs avec `express-validator`
- Sanitisation automatique
- Protection XSS et SQL injection

---

## 📋 Commandes Utiles

```bash
# Migrations
npm run migrate              # Exécuter migrations
npm run migrate:undo         # Annuler dernière migration
npm run db:reset             # Reset complet DB

# Développement
npm run dev                  # Serveur avec nodemon
npm start                    # Serveur production

# Base de données
npx sequelize-cli migration:create --name nom-migration
npx sequelize-cli seed:create --name nom-seed
```

---

## 🧪 Tests (À implémenter)

```bash
npm test                     # Tests unitaires
npm run test:integration     # Tests intégration
npm run test:coverage        # Couverture code
```

---

## 📝 Prochaines Étapes de Développement

### Phase 1 - MVP (Actuel)
- [x] Système de gestion des licences
- [x] Configuration base de données
- [x] Modèles Sequelize
- [x] Migrations
- [x] Middlewares (auth, license, multi-tenant)
- [ ] Authentification citoyen (device fingerprinting)
- [ ] CRUD Signalements
- [ ] Système d'appui citoyen
- [ ] Interface citoyen basique
- [ ] Tableau de bord admin

### Phase 2 - Améliorations
- [ ] Notifications (email + push)
- [ ] Carte interactive (Leaflet/Mapbox)
- [ ] Statistiques avancées
- [ ] Export données (CSV, PDF)
- [ ] Authentification par SMS
- [ ] Dashboard analytics

---

## 🐛 Résolution Problèmes

### Erreur connexion MySQL
```bash
# Vérifier MySQL actif
mysql -u root -p

# Vérifier credentials dans .env
DB_USER=root
DB_PASSWORD=votre_password
```

### Erreur migrations
```bash
# Reset et relancer
npm run migrate:undo:all
npm run migrate
```

### Port déjà utilisé
```bash
# Changer le port dans .env
PORT=5001
```

---

## 📞 Support

- **Email** : support@logiciel311.tg
- **Documentation** : [docs.logiciel311.tg](https://docs.logiciel311.tg)
- **Issues** : GitHub Issues

---

## 📄 Licence

Propriétaire - Tous droits réservés

---

## 👨‍💻 Développeur

Développé avec ❤️ pour les municipalités togolaises

**Version** : 1.0.0
**Date** : Janvier 2025
