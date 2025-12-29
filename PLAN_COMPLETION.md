# Plan de Complétion - Logiciel 311 Togo

## État Actuel
- **Backend**: 100% complet (56 endpoints fonctionnels)
- **Frontend**: ~20% complet (structure de base + pages partielles)
- **Status global**: 70-80% du projet terminé

---

## PHASE 1: MVP - Fonctionnalités Essentielles (Priorité HAUTE)
**Objectif**: Application utilisable pour les citoyens et les admins
**Durée estimée**: 2-3 semaines

### 1.1 Page de Création de Signalement (Citoyen)
**Fichier**: `frontend/src/pages/citizen/CreateReport.jsx`

**Fonctionnalités à implémenter**:
- Formulaire multi-étapes (wizard):
  - Étape 1: Sélection de catégorie
  - Étape 2: Description du problème
  - Étape 3: Localisation (adresse + carte)
  - Étape 4: Photos (optionnel)
  - Étape 5: Récapitulatif
- Upload de photos avec drag-and-drop (max 5 photos)
- Prévisualisation des photos
- Géolocalisation automatique (navigator.geolocation)
- Carte interactive Leaflet pour sélection précise
- Validation complète des champs
- Messages d'erreur clairs
- Boutons de navigation entre étapes
- Sauvegarde automatique en brouillon (localStorage)

**Composants nécessaires**:
```javascript
// À créer dans frontend/src/components/citizen/
- ReportFormWizard.jsx
- CategorySelector.jsx
- PhotoUploader.jsx
- LocationPicker.jsx
- FormSummary.jsx
```

**API déjà disponible**:
- ✅ POST `/api/reports` - Créer signalement
- ✅ POST `/api/reports/:id/photos` - Upload photos
- ✅ GET `/api/reports/categories` - Liste catégories

---

### 1.2 Page Mes Signalements (Citoyen)
**Fichier**: `frontend/src/pages/citizen/MyReports.jsx`

**Fonctionnalités à implémenter**:
- Liste paginée des signalements du citoyen
- Filtres: statut, date, catégorie
- Tri: date, priorité, nombre d'appuis
- Cartes de signalement cliquables
- Actions: Modifier (si pending), Supprimer (si pending), Voir détails
- Statistiques personnelles:
  - Nombre total de signalements
  - Répartition par statut
  - Taux de résolution
- Recherche par titre/description

**Composants nécessaires**:
```javascript
// À créer dans frontend/src/components/citizen/
- ReportCard.jsx (carte individuelle)
- ReportFilters.jsx (filtres et recherche)
- UserStats.jsx (statistiques utilisateur)
```

**Route à ajouter**:
```javascript
<Route path="/my-reports" element={<ProtectedRoute><Layout><MyReports /></Layout></ProtectedRoute>} />
```

**API déjà disponible**:
- ✅ GET `/api/reports/my-reports` - Signalements de l'utilisateur
- ✅ PUT `/api/reports/:id` - Modifier signalement
- ✅ DELETE `/api/reports/:id` - Supprimer signalement

---

### 1.3 Gestion des Signalements Admin
**Fichier**: `frontend/src/pages/admin/ManageReports.jsx`

**Fonctionnalités à implémenter**:
- Tableau complet des signalements
- Colonnes: ID, Titre, Catégorie, Statut, Priorité, Date, Actions
- Filtres avancés:
  - Statut (multi-select)
  - Catégorie
  - Date (range picker)
  - Priorité (min/max)
  - Recherche texte
- Tri sur toutes les colonnes
- Pagination
- Actions en masse:
  - Changer statut
  - Exporter sélection
- Actions individuelles:
  - Voir détails
  - Changer statut
  - Ajouter note
  - Assigner
- Statistiques en haut:
  - Total signalements
  - Par statut (badges)
  - En retard

**Composants nécessaires**:
```javascript
// À créer dans frontend/src/components/admin/
- ReportsTable.jsx (tableau principal)
- ReportRow.jsx (ligne de tableau)
- StatusChangeModal.jsx (modal changement statut)
- AssignModal.jsx (modal assignation)
- BulkActions.jsx (actions en masse)
- AdvancedFilters.jsx (filtres avancés)
```

**Route à ajouter**:
```javascript
<Route path="/admin/reports" element={<ProtectedRoute adminOnly><Layout><ManageReports /></Layout></ProtectedRoute>} />
```

**API déjà disponible**:
- ✅ GET `/api/reports` - Liste signalements (avec filtres)
- ✅ PUT `/api/admin/reports/:id/status` - Changer statut
- ✅ POST `/api/admin/reports/:id/notes` - Ajouter note
- ✅ POST `/api/admin/reports/:id/assign` - Assigner

---

### 1.4 Détails Signalement Admin
**Fichier**: `frontend/src/pages/admin/ReportDetailAdmin.jsx`

**Fonctionnalités à implémenter**:
- Vue complète du signalement
- Section informations:
  - Titre, description, catégorie
  - Adresse, coordonnées GPS
  - Statut actuel avec badge
  - Priorité score
  - Dates (création, mise à jour)
  - Citoyen créateur
- Galerie photos en grand format
- Carte Leaflet avec marker
- Liste des appuis (citoyens qui ont appuyé)
- Historique des changements de statut (timeline)
- Notes administratives
- Actions admin:
  - Changer statut (modal)
  - Ajouter note (textarea + bouton)
  - Assigner/Désassigner
  - Supprimer (avec confirmation)
- Bouton retour vers liste

**Composants nécessaires**:
```javascript
// À créer dans frontend/src/components/admin/
- AdminReportHeader.jsx (en-tête avec actions)
- ReportInfoSection.jsx (informations détaillées)
- HistoryTimeline.jsx (timeline des changements)
- AdminNotes.jsx (section notes)
- SupportersList.jsx (liste des citoyens supporters)
- AdminActions.jsx (boutons d'actions)
```

**Route à ajouter**:
```javascript
<Route path="/admin/reports/:id" element={<ProtectedRoute adminOnly><Layout><ReportDetailAdmin /></Layout></ProtectedRoute>} />
```

**API déjà disponible**:
- ✅ GET `/api/reports/:id` - Détails signalement
- ✅ GET `/api/reports/:id/supports` - Liste supporters
- ✅ GET `/api/admin/reports/:id/history` - Historique
- ✅ POST `/api/admin/reports/:id/notes` - Ajouter note
- ✅ PUT `/api/admin/reports/:id/status` - Changer statut
- ✅ POST `/api/admin/reports/:id/assign` - Assigner
- ✅ DELETE `/api/admin/reports/:id/assign` - Désassigner

---

### 1.5 Améliorations UI/UX Critiques

#### Upload de Photos
**Composant**: `frontend/src/components/common/PhotoUploader.jsx`

**Fonctionnalités**:
- Zone de drag-and-drop
- Clic pour parcourir fichiers
- Prévisualisation miniatures
- Bouton supprimer par photo
- Barre de progression upload
- Validation: format (jpg, png), taille (max 5MB)
- Maximum 5 photos
- Messages d'erreur clairs

#### Validation de Formulaires
**Composant**: `frontend/src/components/common/FormField.jsx`

**Fonctionnalités**:
- Affichage erreurs en temps réel
- Icônes de validation (✓ / ✗)
- Messages d'aide (hints)
- Support validation async
- États: default, error, success

#### Modal de Confirmation
**Composant**: `frontend/src/components/common/ConfirmModal.jsx`

**Fonctionnalités**:
- Titre, message, icône
- Boutons personnalisables
- Variantes: danger, warning, info
- Overlay semi-transparent
- Fermeture ESC
- Animations d'entrée/sortie

---

## PHASE 2: Fonctionnalités Avancées (Priorité MOYENNE)
**Objectif**: Expérience utilisateur enrichie
**Durée estimée**: 2-3 semaines

### 2.1 Intégration Carte Interactive

**Bibliothèque**: React Leaflet
**Installation**:
```bash
npm install leaflet react-leaflet
```

**Composants à créer**:
```javascript
// frontend/src/components/common/
- Map.jsx (carte base)
- MapMarker.jsx (marker personnalisé)
- MapCluster.jsx (clustering markers)
```

**Fonctionnalités**:
- Affichage carte OpenStreetMap
- Markers pour chaque signalement
- Clustering pour performance
- Popup au clic sur marker
- Filtres carte (catégorie, statut)
- Géolocalisation utilisateur
- Recherche d'adresse (Nominatim API)

**Intégrations**:
- Page Home.jsx (vue carte)
- CreateReport.jsx (sélection localisation)
- ReportDetail.jsx (affichage position)

---

### 2.2 Statistiques et Analytics

**Bibliothèque**: Chart.js avec react-chartjs-2
**Installation**:
```bash
npm install chart.js react-chartjs-2
```

**Page**: `frontend/src/pages/admin/Statistics.jsx`

**Composants à créer**:
```javascript
// frontend/src/components/admin/
- StatsCard.jsx (carte statistique)
- LineChart.jsx (graphique ligne)
- BarChart.jsx (graphique barres)
- PieChart.jsx (graphique camembert)
- DateRangeFilter.jsx (filtre période)
```

**Graphiques à implémenter**:
1. **Évolution temporelle**:
   - Signalements par jour/semaine/mois
   - Résolutions par période
   - Tendances

2. **Répartition par catégorie**:
   - Camembert des catégories
   - Top 5 catégories

3. **Performance**:
   - Temps moyen de résolution
   - Taux de résolution
   - Signalements en retard

4. **Géographique**:
   - Heatmap des signalements
   - Zones à problèmes

**Filtres**:
- Période (7j, 30j, 3mois, 1an, personnalisé)
- Catégorie
- Statut
- Comparaison périodes

**API déjà disponible**:
- ✅ GET `/api/reports/statistics` - Statistiques globales
- ✅ GET `/api/admin/dashboard/stats` - Stats dashboard

---

### 2.3 Système de Notifications

**Composants à créer**:
```javascript
// frontend/src/components/common/
- NotificationBell.jsx (icône avec badge)
- NotificationDropdown.jsx (dropdown notifications)
- NotificationItem.jsx (item individuel)
- NotificationPreferences.jsx (page préférences)
```

**Fonctionnalités**:
- Badge avec nombre non lues
- Dropdown liste notifications
- Marquage lecture au clic
- Bouton "Tout marquer lu"
- Filtres: lues/non lues, type
- Page préférences:
  - Email activé/désactivé
  - Types notifications souhaitées
  - Fréquence

**Intégration Navbar**:
- Icône cloche avec badge
- Dropdown au clic
- Polling toutes les 30s (ou WebSocket phase 3)

**API déjà disponible**:
- ✅ GET `/api/notifications` - Liste notifications
- ✅ GET `/api/notifications/unread` - Non lues
- ✅ PUT `/api/notifications/:id/read` - Marquer lue
- ✅ PUT `/api/notifications/read-all` - Tout marquer lu
- ✅ GET `/api/notifications/preferences` - Préférences
- ✅ PUT `/api/notifications/preferences` - Modifier préférences

---

### 2.4 Export de Données

**Fonctionnalités**:
- Export CSV:
  - Liste signalements filtrés
  - Statistiques
  - Historique
- Export PDF:
  - Rapport détaillé
  - Graphiques inclus

**Bibliothèques**:
```bash
npm install jspdf jspdf-autotable
npm install papaparse
```

**Composants**:
```javascript
// frontend/src/components/admin/
- ExportButton.jsx (bouton export)
- ExportModal.jsx (choix format/options)
```

**Implémentation**:
- Bouton "Exporter" dans ManageReports
- Modal choix format (CSV/PDF)
- Options: colonnes, filtres appliqués
- Téléchargement fichier

---

### 2.5 Amélioration Page Profil Utilisateur

**Page**: `frontend/src/pages/citizen/Profile.jsx` (à créer)

**Sections**:
1. **Informations personnelles**:
   - Nom complet (éditable)
   - Municipalité
   - Membre depuis
   - Appareil (fingerprint)

2. **Statistiques personnelles**:
   - Signalements créés
   - Appuis donnés
   - Taux résolution

3. **Préférences**:
   - Notifications email
   - Langue (FR/EN)
   - Thème (clair/sombre)

4. **Actions**:
   - Modifier profil
   - Changer mot de passe (si applicable)
   - Supprimer compte

**Route**:
```javascript
<Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
```

**API déjà disponible**:
- ✅ GET `/api/auth/profile` - Profil utilisateur
- ✅ PUT `/api/auth/profile` - Modifier profil

---

## PHASE 3: Fonctionnalités Premium (Priorité BASSE)
**Objectif**: Application de production complète
**Durée estimée**: 3-4 semaines

### 3.1 Notifications en Temps Réel (WebSocket)

**Bibliothèque**: Socket.io
**Installation**:
```bash
# Backend
npm install socket.io

# Frontend
npm install socket.io-client
```

**Backend** (`backend/websocket.js`):
```javascript
const socketIO = require('socket.io');

function initializeWebSocket(server) {
  const io = socketIO(server, {
    cors: { origin: process.env.FRONTEND_URL }
  });

  io.on('connection', (socket) => {
    // Rejoindre room municipalité
    socket.on('join_municipality', (municipalityId) => {
      socket.join(`municipality_${municipalityId}`);
    });

    // Émettre nouveau signalement
    // Émettre changement statut
    // Émettre nouvelle notification
  });

  return io;
}
```

**Frontend** (`frontend/src/contexts/SocketContext.jsx`):
- Connexion WebSocket
- Événements: nouveau signalement, changement statut, notification
- Auto-reconnexion
- Émission événements depuis composants

**Fonctionnalités**:
- Notifications push instantanées
- Mise à jour live dashboard
- Mise à jour live liste signalements
- Badge temps réel

---

### 3.2 Progressive Web App (PWA)

**Fonctionnalités**:
- Installable sur mobile/desktop
- Mode offline basique
- Cache assets statiques
- Icônes et splash screens
- Manifest.json

**Configuration Vite**:
```bash
npm install vite-plugin-pwa
```

**Service Worker**:
- Cache pages essentielles
- Cache API responses (courts délais)
- Affichage mode offline

---

### 3.3 Multilingue (i18n)

**Bibliothèque**: react-i18next
**Installation**:
```bash
npm install react-i18next i18next
```

**Langues**:
- Français (défaut)
- Anglais
- Ewé (optionnel)

**Fichiers traductions**:
```javascript
// frontend/src/locales/
- fr.json
- en.json
- ee.json (optionnel)
```

**Implémentation**:
- Sélecteur langue dans Navbar
- Stockage préférence localStorage
- Traduction tous textes UI

---

### 3.4 Tests Automatisés

**Tests Unitaires** (Jest + React Testing Library):
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
```

**Tests à créer**:
- Composants communs (Button, Card, Input, etc.)
- Services API (mocks)
- Hooks personnalisés
- Utilitaires

**Tests E2E** (Cypress):
```bash
npm install --save-dev cypress
```

**Scénarios**:
1. Connexion citoyen
2. Création signalement complet
3. Appui sur signalement
4. Admin change statut
5. Notifications reçues

**Coverage cible**: 70%+

---

### 3.5 Documentation API (Swagger)

**Backend**: Ajouter Swagger/OpenAPI

**Installation**:
```bash
npm install swagger-jsdoc swagger-ui-express
```

**Configuration**:
- Documenter tous endpoints (JSDoc)
- Interface Swagger UI accessible `/api-docs`
- Schémas de validation
- Exemples requêtes/réponses

---

## PHASE 4: Optimisations et Production
**Objectif**: Application prête pour déploiement
**Durée estimée**: 1-2 semaines

### 4.1 Performance Frontend

**Optimisations**:
- Code splitting par route
- Lazy loading composants
- Optimisation images (WebP, compression)
- Pagination infinie (au lieu de pagination classique)
- Debounce recherche
- Memoization composants (React.memo, useMemo, useCallback)
- Virtual scrolling pour longues listes

**Outils**:
- Lighthouse audit
- Bundle analyzer
- Performance monitoring

---

### 4.2 Sécurité Renforcée

**Frontend**:
- Sanitization inputs (DOMPurify)
- CSP headers
- XSS protection
- CSRF tokens

**Backend** (déjà bien sécurisé):
- Rate limiting (✅ déjà fait)
- Input validation (✅ déjà fait)
- SQL injection protection (✅ Sequelize)
- JWT rotation
- Helmet.js (headers sécurité)

---

### 4.3 Monitoring et Logging

**Backend**:
- Winston déjà configuré ✅
- Ajouter Sentry pour erreurs production
- Métriques performance (temps réponse)
- Health check endpoint

**Frontend**:
- Sentry pour erreurs client
- Analytics (Google Analytics / Matomo)
- User tracking (sessions, parcours)

---

### 4.4 Déploiement

**Backend**:
- Dockerisation
- CI/CD (GitHub Actions)
- Variables environnement
- Migrations auto
- Backup BDD automatique

**Frontend**:
- Build production optimisé
- Déploiement Vercel/Netlify
- CDN pour assets
- Variables environnement

**Infrastructure**:
- Serveur Node.js (VPS ou cloud)
- MySQL/PostgreSQL hébergé
- Stockage photos (S3, Cloudinary)
- Email service (SendGrid, Mailgun)
- SMS service (Twilio, Africa's Talking)

---

## Résumé des Priorités

### 🔴 URGENT (Phase 1 - 2-3 semaines)
1. CreateReport.jsx complet
2. MyReports.jsx
3. ManageReports.jsx (admin)
4. ReportDetailAdmin.jsx
5. PhotoUploader component
6. FormValidation UI

### 🟡 IMPORTANT (Phase 2 - 2-3 semaines)
1. Carte Leaflet
2. Graphiques Chart.js
3. Système notifications UI
4. Export CSV/PDF
5. Page profil utilisateur
6. Page statistiques admin

### 🟢 AMÉLIORATION (Phase 3 - 3-4 semaines)
1. WebSocket temps réel
2. PWA
3. Multilingue i18n
4. Tests automatisés
5. Documentation Swagger

### ⚪ PRODUCTION (Phase 4 - 1-2 semaines)
1. Optimisations performance
2. Sécurité renforcée
3. Monitoring
4. Déploiement

---

## Estimation Totale

**Développement complet**: 8-12 semaines (2-3 mois)

**MVP fonctionnel** (Phase 1): 2-3 semaines
**Version Beta** (Phase 1+2): 4-6 semaines
**Version Production** (Phase 1+2+3+4): 8-12 semaines

---

## Technologies à Ajouter

### Frontend
- ✅ React 18 (déjà installé)
- ✅ React Router v6 (déjà installé)
- ✅ Tailwind CSS (déjà installé)
- ✅ Axios (déjà installé)
- ✅ React Hot Toast (déjà installé)
- 📦 **À installer**:
  - `leaflet` + `react-leaflet` (cartes)
  - `chart.js` + `react-chartjs-2` (graphiques)
  - `jspdf` + `jspdf-autotable` (export PDF)
  - `papaparse` (export CSV)
  - `react-i18next` (multilingue)
  - `socket.io-client` (WebSocket)
  - `vite-plugin-pwa` (PWA)
  - `dompurify` (sanitization)

### Backend
- ✅ Tout déjà installé et fonctionnel

---

## Prochaines Étapes Recommandées

1. **Commencer par Phase 1.1**: CreateReport.jsx
   - Page la plus critique pour les citoyens
   - Bloque l'utilisation réelle de l'app

2. **Puis Phase 1.3**: ManageReports.jsx (admin)
   - Nécessaire pour admins puissent gérer
   - Débloque workflow complet

3. **Ensuite Phase 1.2**: MyReports.jsx
   - Permet aux citoyens de suivre leurs signalements

4. **Finaliser Phase 1**: UI/UX critiques
   - PhotoUploader, FormValidation, ConfirmModal

5. **Passer à Phase 2**: Fonctionnalités avancées
   - Carte, graphiques, notifications

---

## Questions à Clarifier

1. **Carte**:
   - Fournisseur tuiles: OpenStreetMap (gratuit) ou Mapbox (payant)?
   - Besoin géocodage inverse (adresse → coords)?

2. **SMS**:
   - Service SMS production: Twilio, Africa's Talking?
   - Budget SMS?

3. **Email**:
   - Service email: SendGrid, Mailgun, AWS SES?
   - Templates email existants?

4. **Photos**:
   - Stockage: local filesystem ou cloud (S3, Cloudinary)?
   - Compression/redimensionnement automatique?

5. **Déploiement**:
   - Hébergement prévu: VPS, AWS, Azure, autre?
   - Budget infrastructure?

6. **Langues**:
   - Langues requises: FR, EN, Ewé, autres?
   - Traductions disponibles?

---

**Prêt à commencer? Par quelle phase voulez-vous débuter?**
