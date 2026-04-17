# Design — Admin Mairie & Refonte Citoyen

Date : 2026-04-17
Statut : Validé (brainstorming)

## Contexte

Deux blocs livrables indépendamment :
1. **Admin mairie** — configuration espace, page publique personnalisée, interventions & agents.
2. **Citoyen** — fix du système d'appui (+1) et refonte layout mobile-first basée sur la DA (`DESIGN_SYSTEM.md`).

Stack existant : backend Node/Express + Sequelize (modèles `Municipality`, `Report`, `User`, `Category`, `Notification`…), frontend React (pages `admin/` et `citizen/`).

---

## BLOC 1 — Admin mairie

### 1.1 Modèle de données

**Municipality** (étendu)
- `logo_url`, `banner_url` (uploads)
- `primary_color`, `secondary_color` (hex)
- `display_name`, `public_description`
- `address`, `phone`, `email`, `public_hours` (JSON)
- `priority_support_threshold` (int, default 10) — utilisé par bloc 2

**User** (étendu)
- rôle `agent` supporté
- `specializations` (array de `category_id`)
- `municipality_id`

**Intervention** (nouveau)
```
id, report_id, agent_id, assigned_by (admin user_id),
status ENUM(pending|scheduled|in_progress|completed|cancelled),
scheduled_at, started_at, completed_at,
notes (text), cost (decimal nullable),
created_at, updated_at
```
Un report peut avoir N interventions. Statut du report dérivé :
- `assigned` dès la 1re intervention non annulée
- `in_progress` dès qu'une intervention passe `in_progress`
- `resolved` quand toutes les interventions non-annulées sont `completed`

### 1.2 Endpoints

**Admin settings & branding**
- `PATCH /admin/municipality/settings` — branding + coordonnées + description page publique
- `POST /admin/municipality/upload-logo`
- `POST /admin/municipality/upload-banner`

**Admin agents**
- `GET /admin/agents`
- `POST /admin/agents` (création, envoi invitation email)
- `PATCH /admin/agents/:id` (infos + specializations)
- `DELETE /admin/agents/:id`

**Admin interventions**
- `GET /admin/interventions?status=&agent_id=&category_id=`
- `GET /admin/interventions/:id`
- `POST /admin/interventions` (crée depuis report, assigne agent)
- `PATCH /admin/interventions/:id` (statut, notes, date)
- `GET /admin/agents/suggest?report_id=` → agents filtrés par `specializations ∩ report.category_id`

**Agent (UI dédiée)**
- `GET /agent/interventions` (mes interventions)
- `PATCH /agent/interventions/:id` (statut, notes, photos)
- `POST /agent/interventions/:id/photos`

**Public**
- `GET /public/municipalities/:slug` → payload page publique (branding + description + stats + catégories actives + signalements récents)

### 1.3 UI Admin

Nouveau menu dans l'espace admin :
- **Paramètres mairie** : tabs *Branding* (logo, bannière, couleurs, preview live), *Coordonnées* (adresse, tél, email, horaires), *Page publique* (description).
- **Agents** : table CRUD, modal création (email, nom, spécialisations multi-select parmi catégories mairie).
- **Interventions** : table filtrable (statut, agent, catégorie), vue détail.
- Depuis la fiche d'un *Report* : bouton "Créer intervention" → modal avec **suggestions d'agents** (badge "spécialisé"), date prévue, notes. Suggestion semi-auto : admin valide.

### 1.4 UI Agent

Nouveau rôle → layout dédié minimal :
- Login → redirige vers `/agent`.
- **Mes interventions** : cards regroupées par statut.
- **Détail intervention** : infos report (photo, localisation, catégorie, description), bouton `Démarrer` → `Terminer`, champ notes, upload photos terrain, timeline.

### 1.5 Page publique mairie (`/m/:slug`)

- Header brandé (logo + couleurs mairie, CSS variables injectées).
- Bannière + `public_description`.
- Bloc coordonnées + horaires.
- CTA **"Signaler un problème"** → flow création pré-rempli avec `municipality_id`.
- Grille catégories actives de la mairie.
- Stats publiques : nb traités / en cours.
- Signalements publics récents (limité, liens vers détail).

### 1.6 Notifications

- **Email agent** à l'assignation d'une intervention.
- **Email citoyen** à chaque changement de statut de son report (assigné / en cours / terminé).
- **Notif in-app** (table `Notification` existante) pour agent + admin.

### 1.7 Thème dynamique

CSS custom properties `--primary`, `--secondary` injectées au niveau `<body>` sur toutes les pages d'un slug mairie (page publique + espace citoyen contextualisé).

---

## BLOC 2 — Citoyen

### 2.1 Système d'appui (+1) — fix

**Données**
- Nouvelle table `ReportSupport(report_id, user_id, created_at, UNIQUE(report_id, user_id))`.
- Dénormalisation `Report.supports_count` (int, default 0) maintenu par hooks Sequelize.

**Endpoints**
- `POST /reports/:id/support` — toggle (idempotent)
- `GET /reports/:id/support` — `{ count, user_supported }`

**Règles**
- Auth requise.
- Interdit d'appuyer son propre signalement.
- Tri public : `GET /reports?sort=supports`.
- **Seuil prioritaire** : quand `supports_count` atteint `municipality.priority_support_threshold`, flag `Report.is_priority = true` + notif admin mairie.

### 2.2 Refonte layout citoyen

Application de la DA (`DESIGN_SYSTEM.md` / commits `uipro`) sur tous les écrans citoyens :
- Home, liste publique, détail, création (wizard), recherche, historique, profil, page mairie.
- Header / footer / menu mobile (drawer + bottom nav).
- États vides, skeletons chargement, erreurs.

**Composants partagés**
- `ReportCard`, `StatusBadge`, `SupportButton`, `FilterBar`, `EmptyState`, `SkeletonCard`, `PriorityBadge`.

### 2.3 Mobile-first

- Breakpoints : base mobile → `md` tablet → `lg` desktop.
- Création signalement : **wizard plein écran** sur mobile (étape photo, géoloc, catégorie, description, récap).
- **Bottom navigation mobile** : Accueil / Signaler / Mes signalements / Profil.
- Touch targets ≥ 44px ; photo upload via `<input capture="environment">`.

### 2.4 Impact features existantes

- **Liste publique** : ajout tri "Plus appuyés" + badge priorité.
- **Détail signalement** : `SupportButton` visible, compteur animé, partage (Web Share API + fallback copie lien).
- **Détection similaires** : logique inchangée, restylée.
- **Historique perso** : refondu en liste de cards avec `StatusBadge`.

---

## Découpage de livraison

1. **Bloc 1 — Admin mairie** (PR indépendante)
   - 1.1 migrations + modèles
   - 1.2 endpoints admin + agent + public
   - 1.3–1.4 UI admin + UI agent
   - 1.5 page publique `/m/:slug`
   - 1.6 notifications
   - 1.7 thème dynamique

2. **Bloc 2 — Citoyen** (PR indépendante)
   - 2.1 appui +1 (migration + endpoints + hooks)
   - 2.2–2.3 refonte layout mobile-first
   - 2.4 intégration features existantes

Chaque bloc sera détaillé en plan d'implémentation séparé (voir `writing-plans`).
