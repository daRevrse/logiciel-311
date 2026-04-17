# Bloc 1 — Admin mairie : Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Permettre à l'admin d'une mairie de configurer son espace (branding + page publique) et de gérer agents & interventions ; ajouter une UI agent minimale et une page publique `/m/:slug` brandée.

**Architecture:** Extension du modèle `Municipality` + `User` (rôle agent, specializations) + nouvelle entité `Intervention`. API REST scoped par rôle (admin / agent / public). Frontend React ajoute pages admin (settings, agents, interventions), layout agent dédié, et page publique mairie avec thème dynamique (CSS variables).

**Tech Stack:** Node/Express, Sequelize (MySQL), React, multer (uploads), nodemailer (déjà en place).

**Design ref:** `docs/plans/2026-04-17-mairie-citoyen-design.md`

---

## Phase A — Données & migrations

### Task A1 : Migration Municipality branding & page publique

**Files:**
- Create: `backend/migrations/20260417100001-extend-municipality-branding.js`
- Modify: `backend/models/Municipality.js`

**Step 1 — Écrire la migration** ajoutant : `logo_url`, `banner_url`, `primary_color` (default `#1E40AF`), `secondary_color` (default `#64748B`), `display_name`, `public_description` (TEXT), `address`, `phone`, `email`, `public_hours` (JSON), `priority_support_threshold` (INT default 10).

**Step 2 — Lancer** `npx sequelize-cli db:migrate` → succès.

**Step 3 — Mettre à jour le modèle** (champs + validations hex pour couleurs).

**Step 4 — Commit** `feat(municipality): branding & public page fields`.

### Task A2 : Migration User agent + specializations

**Files:**
- Create: `backend/migrations/20260417100002-add-agent-role-and-specializations.js`
- Modify: `backend/models/User.js`

**Étapes :**
1. Migration : étendre l'ENUM `role` pour inclure `agent` (si ENUM) ou valider via check ; ajouter colonne `specializations` JSON (array d'IDs catégories), nullable.
2. Modèle : ajouter rôle + champ `specializations` avec `get/set` JSON safe.
3. Commit `feat(user): add agent role and specializations`.

### Task A3 : Création table Intervention

**Files:**
- Create: `backend/migrations/20260417100003-create-interventions.js`
- Create: `backend/models/Intervention.js`
- Modify: `backend/models/index.js` (associations)

**Schéma table :**
```
id PK, report_id FK reports CASCADE,
agent_id FK users SET NULL,
assigned_by FK users SET NULL,
status ENUM('pending','scheduled','in_progress','completed','cancelled') default 'pending',
scheduled_at DATETIME null, started_at DATETIME null, completed_at DATETIME null,
notes TEXT null, cost DECIMAL(10,2) null,
created_at, updated_at
INDEX(report_id), INDEX(agent_id), INDEX(status)
```

**Associations :**
- `Report.hasMany(Intervention)` / `Intervention.belongsTo(Report)`
- `User.hasMany(Intervention, { foreignKey: 'agent_id', as: 'assignedInterventions' })`
- `Intervention.belongsTo(User, { foreignKey: 'agent_id', as: 'agent' })`
- `Intervention.belongsTo(User, { foreignKey: 'assigned_by', as: 'assigner' })`

**Commit :** `feat(intervention): model & migration`.

### Task A4 : Hook report status derivation

**Files:**
- Create: `backend/services/reportStatusService.js`
- Modify: `backend/models/Intervention.js` (afterCreate / afterUpdate hooks)

**Règle :**
- 1+ intervention non annulée avec status `pending|scheduled` → report.status = `assigned`
- au moins une `in_progress` → `in_progress`
- toutes non-annulées `completed` → `resolved`

**TDD :** `backend/tests/services/reportStatusService.test.js` — 4 cas (pending→assigned, assigned→in_progress, all completed→resolved, all cancelled→unchanged).

**Commit :** `feat(intervention): derive report status from interventions`.

---

## Phase B — Endpoints admin mairie

### Task B1 : Admin settings endpoint

**Files:**
- Modify: `backend/controllers/adminController.js` (ajout `getMunicipalitySettings`, `updateMunicipalitySettings`)
- Modify: `backend/routes/admin.routes.js`

**Endpoints :**
- `GET /api/admin/municipality/settings` → retourne les champs ajoutés en A1.
- `PATCH /api/admin/municipality/settings` → validate (couleurs hex, email, phone, hours JSON), update.

Scope : l'admin ne peut modifier QUE sa propre mairie (tenant = `req.user.municipality_id`).

**Commit :** `feat(admin): municipality settings endpoints`.

### Task B2 : Upload logo & bannière

**Files:**
- Modify: `backend/controllers/adminController.js`
- Modify: `backend/routes/admin.routes.js`
- Réutiliser `backend/middlewares/upload*` existant si présent ; sinon créer avec multer (`uploads/municipalities/:id/`).

**Endpoints :**
- `POST /api/admin/municipality/upload-logo` (multipart, champ `logo`) → max 2 MB, png/jpg/svg.
- `POST /api/admin/municipality/upload-banner` (champ `banner`) → max 5 MB.
- Stockage : `backend/uploads/municipalities/:id/logo.{ext}` ; URL retournée `/uploads/municipalities/:id/logo.ext` ; met à jour `logo_url` / `banner_url`.

**Commit :** `feat(admin): branding image uploads`.

### Task B3 : CRUD agents

**Files:**
- Create: `backend/controllers/agentAdminController.js`
- Create: `backend/routes/agent-admin.routes.js` (monté sous `/api/admin/agents`)
- Modify: `backend/server.js` (montage route)

**Endpoints :**
- `GET /api/admin/agents` → agents de la mairie (role=agent, municipality_id match).
- `POST /api/admin/agents` — body `{ email, name, specializations: [categoryId] }` → crée user role=agent, mot de passe temporaire, envoie email invitation (réutiliser service mail existant).
- `PATCH /api/admin/agents/:id` — update name + specializations.
- `DELETE /api/admin/agents/:id` — soft delete (flag `is_active=false` si existe, sinon `deletedAt`).

**Validation :** specializations ⊂ categories de la mairie.

**Tests :** 1 happy path création + 1 test scope (admin mairie A ne peut pas lister agents mairie B).

**Commit :** `feat(admin): agents CRUD`.

### Task B4 : Endpoints interventions admin

**Files:**
- Create: `backend/controllers/interventionController.js`
- Create: `backend/routes/intervention.routes.js` (monté sous `/api/admin/interventions`)

**Endpoints :**
- `GET /api/admin/interventions?status=&agent_id=&category_id=&page=&limit=` — scoped mairie.
- `GET /api/admin/interventions/:id` — avec relations report + agent.
- `POST /api/admin/interventions` — body `{ report_id, agent_id, scheduled_at?, notes? }` → vérifie report appartient à la mairie, agent appartient à la mairie.
- `PATCH /api/admin/interventions/:id` — status, notes, scheduled_at.
- `GET /api/admin/agents/suggest?report_id=` → agents dont `specializations` inclut `report.category_id`, triés par charge (`COUNT(interventions WHERE status IN pending/scheduled/in_progress)`).

**Commit :** `feat(admin): interventions endpoints + agent suggestion`.

### Task B5 : Notifications email/in-app

**Files:**
- Create: `backend/services/interventionNotifier.js`
- Modify: `backend/models/Intervention.js` (hooks afterCreate / afterUpdate)
- Ajouter templates emails sous `backend/templates/`.

**Règles :**
- afterCreate → email + notif in-app à l'agent assigné.
- afterUpdate (status change) → email citoyen avec mapping `assigned|in_progress|completed` + notif admin + agent.

**Commit :** `feat(intervention): notifications wiring`.

---

## Phase C — UI Agent (rôle dédié)

### Task C1 : Routes auth & layout agent

**Files:**
- Create: `frontend/src/layouts/AgentLayout.jsx`
- Modify: `frontend/src/App.jsx` — redirection si `user.role === 'agent'` → `/agent`.
- Modify: `frontend/src/contexts/AuthContext.jsx` (si role checks).

**Design :** header minimal (logo mairie, nom agent, logout), contenu pleine hauteur, mobile-first.

**Commit :** `feat(agent): layout & routing`.

### Task C2 : Endpoints agent + page mes interventions

**Files:**
- Modify: `backend/routes/intervention.routes.js` — ajout routes agent `/api/agent/interventions` (GET) et `/api/agent/interventions/:id` (PATCH status/notes), auth role=agent, scope `agent_id = req.user.id`.
- Create: `frontend/src/pages/agent/MyInterventions.jsx`
- Create: `frontend/src/services/agentService.js`

**UI :** 3 colonnes/groupes : "À faire", "En cours", "Terminées" ; cards cliquables vers détail.

**Commit :** `feat(agent): my interventions page`.

### Task C3 : Détail intervention agent

**Files:**
- Create: `frontend/src/pages/agent/InterventionDetail.jsx`
- Create: `backend/routes/intervention.routes.js` : `POST /api/agent/interventions/:id/photos` (multer).

**UI :** infos report (photo, localisation, catégorie, description citoyen), boutons `Démarrer` / `Terminer`, textarea notes, upload photos, timeline statuts.

**Commit :** `feat(agent): intervention detail + photo upload`.

---

## Phase D — UI Admin mairie

### Task D1 : Page Paramètres mairie (branding + page publique)

**Files:**
- Create: `frontend/src/pages/admin/MunicipalitySettings.jsx`
- Modify: `frontend/src/services/adminService.js` — méthodes settings + uploads.

**UI :** tabs *Branding* (logo, bannière, color pickers, preview live), *Coordonnées* (address, phone, email, hours), *Page publique* (display_name, public_description textarea).

**Validation côté client** : hex colors, email, tailles upload.

**Commit :** `feat(admin): municipality settings UI`.

### Task D2 : Page Agents (CRUD)

**Files:**
- Create: `frontend/src/pages/admin/AgentsList.jsx`
- Create: `frontend/src/components/admin/AgentFormModal.jsx`

**UI :** table (nom, email, spécialisations badges, dernière activité), bouton "Nouvel agent" → modal (email, nom, multi-select spécialisations), actions edit/delete.

**Commit :** `feat(admin): agents CRUD UI`.

### Task D3 : Page Interventions + modal assignation

**Files:**
- Create: `frontend/src/pages/admin/InterventionsList.jsx`
- Create: `frontend/src/components/admin/InterventionDetailModal.jsx`
- Create: `frontend/src/components/admin/AssignInterventionModal.jsx` (utilisable depuis détail d'un Report)
- Modify: `frontend/src/pages/admin/ReportDetail.jsx` → ajouter bouton "Créer intervention".

**Modal assignation :**
- Appelle `GET /admin/agents/suggest?report_id=` → agents listés avec badge "Spécialisé" (match) et compteur charge.
- Champs : agent (select), scheduled_at (datetime), notes (textarea).
- Submit → `POST /admin/interventions`.

**Commit :** `feat(admin): interventions UI`.

---

## Phase E — Page publique mairie `/m/:slug`

### Task E1 : Endpoint public mairie

**Files:**
- Modify: `backend/routes/public.routes.js`
- Modify: `backend/controllers/publicController.js` (ou créer)

**Endpoint :** `GET /api/public/municipalities/:slug` → `{ id, slug, display_name, logo_url, banner_url, primary_color, secondary_color, public_description, address, phone, email, public_hours, categories: [...], stats: { total_resolved, total_in_progress }, recent_reports: [...] }`.

**Commit :** `feat(public): municipality page payload`.

### Task E2 : Composant thème dynamique

**Files:**
- Create: `frontend/src/hooks/useMunicipalityTheme.js` (inject CSS vars `--primary`, `--secondary` sur `document.documentElement`).
- Modify: DA tokens (`frontend/src/index.css`) pour fallback et utilisation variables.

**Commit :** `feat(theme): dynamic municipality theme`.

### Task E3 : Page publique `/m/:slug`

**Files:**
- Create: `frontend/src/pages/public/MunicipalityPublicPage.jsx`
- Modify: `frontend/src/App.jsx` (route `/m/:slug`).
- Modify: `frontend/src/pages/public/MunicipalitySelector.jsx` (existant ?) — lien vers `/m/:slug`.

**Sections :** header brandé, bannière + description, bloc coordonnées/horaires, CTA "Signaler" → `/signaler?municipality=:slug`, grille catégories, stats publiques (2 chiffres clés), liste 5 signalements publics récents.

**Commit :** `feat(public): branded municipality page`.

---

## Phase F — Tests E2E & QA

### Task F1 : Tests backend intégration

**Files:** `backend/tests/integration/interventions.test.js`, `agents.test.js`, `municipality-settings.test.js`.

Scénarios : admin crée agent → assigne intervention → agent clôture → citoyen reçoit email → report passe `resolved`.

### Task F2 : Smoke test frontend manuel (checklist)

Checklist dans `docs/plans/2026-04-17-bloc1-qa.md` : parcours admin + agent + citoyen sur `/m/:slug`.

### Task F3 : PR & review

- Ouvrir PR branche `feat/admin-mairie-interventions`.
- Invoquer skill `superpowers:requesting-code-review`.

---

## Ordre conseillé d'exécution

A1 → A2 → A3 → A4 → B1 → B2 → B3 → B4 → B5 → C1 → C2 → C3 → D1 → D2 → D3 → E1 → E2 → E3 → F1 → F2 → F3.
