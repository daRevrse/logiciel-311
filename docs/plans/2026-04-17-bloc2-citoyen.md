# Bloc 2 — Citoyen : fix appui + refonte layout : Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Corriger le système d'appui (+1) côté frontend et côté logique de priorisation, puis refondre l'ensemble du layout citoyen en mobile-first cohérent avec la DA adoptée.

**Architecture:** Backend supports/route existent déjà (`backend/routes/support.routes.js`) → on ajoute dénormalisation `supports_count`, seuil prioritaire, tri et branchement frontend. Refonte layout en appliquant DA (`DESIGN_SYSTEM.md`) via composants partagés et bottom-nav mobile.

**Tech Stack:** React, DA tokens existants, Sequelize.

**Design ref:** `docs/plans/2026-04-17-mairie-citoyen-design.md`

---

## Phase G — Système d'appui (+1) — fix & priorisation

### Task G1 : Dénormalisation supports_count

**Files:**
- Create: `backend/migrations/20260417110001-add-supports-count-is-priority.js`
- Modify: `backend/models/Report.js`
- Modify: `backend/models/Support.js` (hooks afterCreate/afterDestroy)

**Étapes :**
1. Migration : `ALTER TABLE reports ADD COLUMN supports_count INT DEFAULT 0`, `ADD COLUMN is_priority BOOLEAN DEFAULT false`. Backfill via `UPDATE reports r SET supports_count = (SELECT COUNT(*) FROM supports WHERE report_id = r.id)`.
2. Hooks sur `Support` : `afterCreate` → `Report.increment('supports_count')` + check seuil ; `afterDestroy` → decrement.
3. Seuil : après increment, reload report + mairie → si `supports_count >= municipality.priority_support_threshold && !is_priority` → `is_priority=true`, créer notif admin mairie.

**Test :** `backend/tests/integration/support-priority.test.js` (seuil 3 → 3 appuis → is_priority=true + 1 notif admin).

**Commit :** `feat(support): denormalize count + priority threshold`.

### Task G2 : Endpoint support state + tri

**Files:**
- Modify: `backend/controllers/supportController.js` — `checkSupport` doit retourner `{ count, user_supported, is_priority }`.
- Modify: `backend/controllers/reportController.js` — `listReports` accepte `sort=supports|recent` (default recent) → `ORDER BY supports_count DESC` quand supports.

**Commit :** `feat(reports): sort by supports + is_priority in payload`.

### Task G3 : SupportButton frontend fonctionnel

**Files:**
- Create: `frontend/src/components/shared/SupportButton.jsx`
- Create: `frontend/src/services/supportService.js` (méthodes add/remove/check)
- Modify: `frontend/src/pages/citizen/ReportDetail.jsx` — intégrer le bouton.
- Modify: `frontend/src/pages/citizen/ReportsList.jsx` — compteur + icône sur les cards.

**Comportement :**
- Au mount : `GET /api/reports/:id/support/check` → état initial.
- Click : toggle → `POST` ou `DELETE`, mise à jour optimiste du compteur, rollback si erreur.
- Désactivé si user est l'auteur du report ou non connecté (tooltip "Connectez-vous pour appuyer").
- Animation compteur (slide up).

**Commit :** `feat(citizen): functional support button`.

### Task G4 : Liste publique — tri & badge priorité

**Files:**
- Modify: `frontend/src/pages/citizen/ReportsList.jsx`
- Create: `frontend/src/components/shared/PriorityBadge.jsx`

Ajouter toggle tri (Récents / Plus appuyés) → `?sort=supports`, afficher `PriorityBadge` si `is_priority`.

**Commit :** `feat(citizen): sort by supports + priority badge`.

---

## Phase H — Composants partagés DA

### Task H1 : Tokens & utilitaires

**Files:**
- Modify: `frontend/src/index.css` — confirmer exposition CSS vars DA (`--color-primary`, `--radius-md`, `--spacing-*`, etc.).
- Create: `frontend/src/styles/breakpoints.css` — breakpoints mobile-first.

**Commit :** `chore(da): tokens & breakpoints ready`.

### Task H2 : Composants shared

**Files à créer sous `frontend/src/components/shared/` :**
- `ReportCard.jsx` — card signalement (mobile + desktop).
- `StatusBadge.jsx` — statuts colorés.
- `FilterBar.jsx` — chips filtres catégorie/statut + tri.
- `EmptyState.jsx` — illustration + message + CTA.
- `SkeletonCard.jsx` — loading skeleton.
- `PageHeader.jsx`, `PageContainer.jsx` — wrappers layout.

Chaque composant avec variantes `mobile` / `desktop` via CSS media queries.

**Commit :** `feat(shared): DA components library`.

### Task H3 : Layout citoyen + bottom navigation

**Files:**
- Create: `frontend/src/layouts/CitizenLayout.jsx`
- Create: `frontend/src/components/shared/BottomNav.jsx` (Accueil / Signaler / Mes signalements / Profil — visible `<lg`).
- Create: `frontend/src/components/shared/MobileDrawer.jsx` (menu hamburger tablet/desktop fallback).
- Modify: `frontend/src/App.jsx` — wrapper routes citoyen avec CitizenLayout.

**Commit :** `feat(citizen): layout + bottom nav`.

---

## Phase I — Refonte écrans citoyen

### Task I1 : Home citoyen

**Files:** `frontend/src/pages/citizen/Home.jsx`

Hero mobile (CTA signaler) + liste catégories + derniers signalements publics (`ReportCard`).

**Commit :** `feat(citizen): home redesign`.

### Task I2 : Liste publique & recherche

**Files:** `frontend/src/pages/citizen/ReportsList.jsx`, `Search.jsx`

`FilterBar` + `ReportCard` grid, infinite scroll ou pagination, skeletons, `EmptyState`.

**Commit :** `feat(citizen): public list & search redesign`.

### Task I3 : Détail signalement

**Files:** `frontend/src/pages/citizen/ReportDetail.jsx`

Header photo full-width mobile, infos, `StatusBadge`, `SupportButton`, timeline statut, partage (Web Share API + fallback `navigator.clipboard`), liste signalements similaires.

**Commit :** `feat(citizen): report detail redesign`.

### Task I4 : Création signalement — wizard plein écran mobile

**Files:**
- Modify: `frontend/src/pages/citizen/CreateReport.jsx`
- Create: `frontend/src/components/citizen/ReportWizard/` (Step1Photo, Step2Location, Step3Category, Step4Description, Step5Review).

**Comportement :**
- Sur mobile : chaque étape plein écran, boutons Précédent/Suivant sticky bottom.
- Sur desktop : toutes les sections visibles sur une page.
- Upload photo avec `capture="environment"`.
- Géoloc navigator + fallback map input.
- Détection similaires affichée en étape Review.

**Commit :** `feat(citizen): wizard create report`.

### Task I5 : Historique personnel + profil

**Files:** `frontend/src/pages/citizen/MyReports.jsx`, `Profile.jsx`

Liste cards avec tabs (En cours / Résolus), profil simple (infos user + stats perso).

**Commit :** `feat(citizen): my reports & profile redesign`.

### Task I6 : Page mairie (côté citoyen, si accès direct)

S'assurer que `frontend/src/pages/public/MunicipalityPublicPage.jsx` (créée au bloc 1 E3) utilise les composants partagés du bloc 2. Si bloc 1 pas encore mergé : créer stub et finaliser lors du merge.

**Commit :** `feat(citizen): align municipality page with shared DA`.

### Task I7 : États vides / chargement / erreurs

Passer toutes les pages au crible et remplacer les `Loading...` / `null` par `SkeletonCard` ou `EmptyState`.

**Commit :** `feat(citizen): consistent empty & loading states`.

---

## Phase J — QA & PR

### Task J1 : Tests responsive manuels

Créer `docs/plans/2026-04-17-bloc2-qa.md` — checklist : 375px / 768px / 1280px pour chaque page citoyen.

### Task J2 : Accessibilité rapide

- Vérifier contraste (tokens DA primaires vs backgrounds).
- `alt` sur images.
- Focus visible.
- Touch targets ≥ 44px.

### Task J3 : PR & review

- Branche `feat/citizen-support-layout-refresh`.
- Invoquer `superpowers:requesting-code-review`.

---

## Ordre conseillé d'exécution

G1 → G2 → G3 → G4 → H1 → H2 → H3 → I1 → I2 → I3 → I4 → I5 → I6 → I7 → J1 → J2 → J3.

**Dépendance inter-blocs :** I6 dépend de la merge du Bloc 1 (E3). Si Bloc 1 pas prêt, livrer I6 dans une PR de suivi.
