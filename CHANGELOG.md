# 📝 CHANGELOG - Logiciel 311

Historique des versions et changements du projet.

---

## [1.1.0] - Phase 2 : Authentification - 2025-01-27

### ✨ Nouvelles Fonctionnalités

#### Authentification Citoyen
- **Device Fingerprinting** : Login automatique par empreinte navigateur
- **SMS Verification** : Login par téléphone + code 6 chiffres
- **Auto-création utilisateur** : Création automatique à la première connexion
- **Gestion profil** : GET et UPDATE profil utilisateur
- **Token verification** : Endpoint pour vérifier validité token

#### Services
- `authService.js` : Service complet authentification
  - `loginByFingerprint()` - Login device fingerprint
  - `requestVerificationCode()` - Demande code SMS
  - `verifyCodeAndLogin()` - Vérification code + login
  - `loginAdmin()` - Login administrateur
  - `getProfile()` - Récupération profil
  - `updateProfile()` - Mise à jour profil

#### API Endpoints (10 nouveaux)
- `POST /api/auth/login/fingerprint` - Login fingerprint
- `POST /api/auth/request-code` - Demander code SMS
- `POST /api/auth/verify-code` - Vérifier code
- `POST /api/auth/admin/login` - Login admin
- `GET /api/auth/profile` - Profil utilisateur
- `PUT /api/auth/profile` - Modifier profil
- `GET /api/auth/verify-token` - Vérifier token
- `POST /api/auth/logout` - Déconnexion

### 🔒 Sécurité
- Validation inputs avec express-validator
- Rate limiting auth (5 tentatives / 15min)
- Vérification licence à chaque login
- Codes SMS expirent après 10 minutes
- Multi-tenant strict maintenu

### 📚 Documentation
- `AUTH_TESTING.md` : Guide complet tests authentification
- `PHASE2_SUMMARY.md` : Résumé Phase 2
- Mise à jour README avec endpoints auth

### 🔧 Améliorations Modèle User
- `generateVerificationCode()` : Génération code 6 chiffres
- `verifyCode()` : Vérification code + expiration
- `updateLastLogin()` : MAJ dernière connexion
- `findOrCreateByPhone()` : Find or create téléphone
- `findOrCreateByFingerprint()` : Find or create fingerprint

### 📊 Statistiques Phase 2
- **Fichiers créés** : 4
- **Lignes de code** : ~1500
- **Endpoints** : +10
- **Tests documentés** : 15+

---

## [1.0.0] - Phase 1 : Infrastructure & Licences - 2025-01-27

### ✨ Nouvelles Fonctionnalités

#### Infrastructure Backend
- Configuration complète Express.js
- Base de données MySQL avec Sequelize ORM
- 10 modèles Sequelize avec associations
- 10 migrations base de données
- Logging Winston avec rotation quotidienne

#### Système de Licences (PRIORITÉ #1)
- Génération clés uniques (format XXXX-XXXX-XXXX-XXXX)
- Validation et activation licences
- Renouvellement et désactivation
- Gestion fonctionnalités par licence
- Vérification licences expirantes

#### API REST Licences (10 endpoints)
- `POST /api/licenses/validate` - Valider clé
- `POST /api/licenses/activate` - Activer licence
- `POST /api/licenses/generate` - Générer licence (super admin)
- `GET /api/licenses` - Lister licences (super admin)
- `GET /api/licenses/:id` - Détails licence
- `PUT /api/licenses/:id/renew` - Renouveler
- `PUT /api/licenses/:id/deactivate` - Désactiver
- `PUT /api/licenses/:id/features` - MAJ fonctionnalités
- `GET /api/licenses/expiring` - Licences expirantes

### 🔒 Sécurité Multi-Tenant
- Middleware `auth.js` : Authentification JWT
- Middleware `license.js` : Validation licences
- Middleware `multiTenant.js` : Isolation totale municipalités
- Middleware `rateLimiter.js` : Protection anti-abus
- Middleware `requestLogger.js` : Logging activités

#### Rate Limiters
- Général : 100 req / 15 min
- Auth : 5 tentatives / 15 min
- Reports : 10 créations / heure
- Supports : 20 / minute
- Uploads : 50 / heure

### 🗄️ Base de Données (10 tables)
1. `licenses` - Gestion licences
2. `municipalities` - Communes
3. `categories` - Types problèmes
4. `users` - Citoyens & admins
5. `reports` - Signalements
6. `report_photos` - Photos
7. `supports` - Appuis citoyens
8. `status_history` - Historique
9. `notifications` - Notifications
10. `activity_logs` - Logs audit

### 📚 Documentation
- `README.md` : Documentation complète
- `QUICK_START.md` : Guide démarrage 5 min
- `TESTING_GUIDE.md` : Tests licences
- `SUMMARY.md` : Résumé développement
- `COMMANDS.md` : Référence commandes

### 🔧 Scripts & Outils
- `generate-token.js` : Génération tokens JWT test
- Seeder demo-data : Données démonstration
- Configuration Sequelize CLI
- Variables environnement (.env)

### 📊 Statistiques Phase 1
- **Fichiers créés** : 40+
- **Lignes de code** : ~6000
- **Modèles** : 10
- **Migrations** : 10
- **Endpoints** : 10
- **Middlewares** : 5

---

## 🎯 Roadmap

### Phase 3 - CRUD Signalements (À venir)
- [ ] Service reportService.js
- [ ] Controller reportController.js
- [ ] Routes /api/reports (CRUD complet)
- [ ] Upload photos (Multer)
- [ ] Géolocalisation (lat/lng)
- [ ] Filtres et recherche
- [ ] Pagination

### Phase 4 - Système d'Appui (À venir)
- [ ] Routes /api/supports
- [ ] Ajouter/retirer appui
- [ ] Auto-update priority_score
- [ ] Liste triée par priorité

### Phase 5 - Admin Dashboard (À venir)
- [ ] Routes admin /api/admin/*
- [ ] Changement statut signalements
- [ ] Notes admin
- [ ] Statistiques globales
- [ ] Gestion catégories CRUD

### Phase 6 - Notifications (À venir)
- [ ] Service notificationService.js
- [ ] Email (Nodemailer)
- [ ] SMS (provider Togo)
- [ ] Push web
- [ ] Routes /api/notifications

### Phase 7 - Frontend React (À venir)
- [ ] Init Vite + React
- [ ] Setup Tailwind CSS
- [ ] React Router
- [ ] Pages citoyens
- [ ] Dashboard admin
- [ ] Carte interactive (Leaflet)

### Phase 8 - Fonctionnalités Avancées
- [ ] Export données (CSV, PDF)
- [ ] Statistiques avancées
- [ ] Analytics
- [ ] Commentaires
- [ ] Historique détaillé

---

## 📝 Format

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

### Types de Changements
- **✨ Nouvelles Fonctionnalités** : Nouvelles features
- **🔒 Sécurité** : Améliorations sécurité
- **🐛 Corrections** : Bug fixes
- **🔧 Améliorations** : Optimisations
- **📚 Documentation** : Docs
- **🗑️ Suppressions** : Features retirées
- **⚠️ Dépréciations** : Features obsolètes

---

**Dernière mise à jour** : 2025-01-27
**Version actuelle** : 1.1.0
