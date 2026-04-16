# Design Document — Refonte DA Muno
**Date :** 2026-04-16  
**Scope :** Refonte complète de la direction artistique (couleurs, typographie, composants, layout, UX)

---

## Contexte

Le projet Muno utilise actuellement une palette violette (#7c3aed) qui ne correspond pas à l'identité visuelle définie dans DESIGN_SYSTEM.md. La charte Muno est institutionnelle, basée sur le bleu profond (#1E3A5F) et le bleu primaire (#2F6FED), avec un vert (#2BB673) pour l'action citoyenne "Appuyer". Le layout admin et les pages citoyens doivent également être restructurés pour correspondre aux specs UX du design system.

---

## Approche retenue : Refonte par couches

1. Design tokens → 2. Composants → 3. Layout admin → 4. Pages citoyen

---

## Couche 1 — Design Tokens

### `frontend/tailwind.config.js`
Remplacer la palette `primary` (violet) par :

```js
colors: {
  primary: {
    50:  '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2F6FED',  // ← couleur principale
    700: '#1D4ED8',
    800: '#1E3A5F',  // ← bleu profond
    900: '#1E2D5A',
  },
  support: {
    DEFAULT: '#2BB673',
    light:   '#6ED3A3',
    dark:    '#1D8A56',
  },
  status: {
    new:        '#2F6FED',
    inProgress: '#F59E0B',
    resolved:   '#2BB673',
    rejected:   '#EF4444',
  },
  muted: '#6B7280',
  surface: '#F5F7FA',
}
```

### `frontend/src/index.css`
- Font : Inter (déjà en place, conserver)
- CSS variables pour les tokens principaux
- Classes utilitaires : `.btn-primary`, `.btn-support`, `.card`, `.badge-*`

---

## Couche 2 — Composants communs

### Button (`components/common/Button.jsx`)
| Variante | Style |
|----------|-------|
| `primary` | bg `#2F6FED`, texte blanc, radius 8px |
| `secondary` | border bleu, fond blanc |
| `support` | bg `#2BB673`, texte blanc, icône 👍, radius 8px |
| `danger` | bg rouge |
| `ghost` | transparent |

### Card (`components/common/Card.jsx`)
- `border-radius: 12px`
- `box-shadow: 0 1px 4px rgba(0,0,0,0.08)`
- `padding: 16-24px`
- Fond blanc

### StatusBadge (`components/common/StatusBadge.jsx`)
| Statut | Couleur texte | Fond |
|--------|--------------|------|
| Nouveau / pending | #2F6FED | #EFF6FF |
| En cours / in_progress | #D97706 | #FEF3C7 |
| Résolu / resolved | #2BB673 | #ECFDF5 |
| Rejeté / rejected | #EF4444 | #FEF2F2 |
| Confirmé / confirmed | #1E3A5F | #DBEAFE |

### Navbar citoyen (`components/common/Navbar.jsx`)
- **Mobile :** Bottom navigation (Accueil, Signalements, Mon profil)
- **Desktop :** Top nav horizontale, logo gauche, liens, profil droite
- Couleur fond : blanc, bordure bas `#E5E7EB`
- Bouton flottant "+" vert (#2BB673) sur mobile

### Sidebar admin (nouveau composant `components/admin/Sidebar.jsx`)
- Fond : `#1E3A5F` (bleu profond)
- Logo Muno en blanc
- Liens de navigation :
  - Dashboard, Signalements, Interventions, Marchés, Voirie, Documents, Paramètres
- Lien actif : fond `#2F6FED`, texte blanc
- Lien inactif : texte `rgba(255,255,255,0.7)`, hover fond `rgba(255,255,255,0.1)`
- Largeur : 240px fixe (desktop), drawer sur mobile

---

## Couche 3 — Layout Admin

### Structure générale (`pages/admin/`)
```
┌─────────────────────────────────────┐
│  Sidebar (240px) │  Main content    │
│  #1E3A5F         │  ┌─ Header ────┐│
│  - Logo          │  │ Titre + Search││
│  - Nav items     │  └─────────────┘│
│                  │  Page content    │
└─────────────────────────────────────┘
```

### Dashboard (`pages/admin/Dashboard.jsx`)
- 4 widgets KPI : Total signalements | En cours | Résolus | Nouveaux
- Chaque widget : Card blanche, icône colorée, chiffre bold, label gris
- Graphique d'activité (déjà en place, adapter couleurs)
- Section "Signalements récents" avec colonnes : Titre | Appuis 👍 | Statut | Actions

### ManageReports (`pages/admin/ManageReports.jsx`)
- Colonne "Appuis 👍" mise en avant (2ème colonne après titre)
- Tri par défaut : nombre d'appuis décroissant
- Badge statut aligné design system
- Filtres : Statut | Catégorie | Commune | Date

### Header admin (`components/admin/AdminHeader.jsx`)
- Fond blanc, shadow légère
- Gauche : titre de la page courante
- Centre : barre de recherche
- Droite : avatar + nom + dropdown logout

---

## Couche 4 — Pages Citoyen

### Home (`pages/citizen/Home.jsx`)
- Split view : liste gauche (40%) + carte droite (60%) sur desktop
- Mobile : tabs "Liste" / "Carte"
- Bouton flottant "+" vert (FAB) en bas à droite
- Sidebar droite (desktop) : Top 5 signalements les plus appuyés
- Chaque card : Titre | Catégorie chip | Localisation | Appuis 👍 (mis en avant) | Badge statut

### CreateReport (`pages/citizen/CreateReport.jsx`)
- Stepper horizontal (5 étapes) :
  1. Localisation (carte mini + adresse auto)
  2. Photo (drag & drop, aperçu)
  3. Catégorie (chips cliquables : Voirie, Éclairage, Eau, Déchets, Autre)
  4. Description (textarea)
  5. Similaires (liste courte + bouton "Appuyer" si déjà signalé)
- Bouton "Suivant" bleu, "Soumettre" bleu pleine largeur

### ReportsList (`pages/citizen/ReportsList.jsx`)
- Cards avec : statut badge | appuis 👍 visible | bouton "Appuyer" vert
- Filtres : chips de catégorie en haut

### ReportDetail (`pages/citizen/ReportDetail.jsx`)
- Photo en haut (pleine largeur)
- Infos : titre, catégorie, localisation, date
- Section statut avec badge
- **Gros bouton "Appuyer" 👍 vert (#2BB673)** — fixe en bas sur mobile
- Signalements similaires en bas

### Login citoyen (`pages/citizen/Login.jsx`)
- Fond `#F5F7FA`
- Card centrée, logo Muno en haut
- Bouton submit bleu primaire

---

## Fichiers à modifier

| Fichier | Type de changement |
|---------|--------------------|
| `frontend/tailwind.config.js` | Palette complète |
| `frontend/src/index.css` | CSS variables + classes globales |
| `frontend/src/components/common/Button.jsx` | Variantes + couleurs |
| `frontend/src/components/common/Card.jsx` | Radius + shadow |
| `frontend/src/components/common/StatusBadge.jsx` | Couleurs statuts |
| `frontend/src/components/common/Navbar.jsx` | Bottom nav mobile + top desktop |
| `frontend/src/components/common/Input.jsx` | Focus ring bleu |
| `frontend/src/components/common/Modal.jsx` | Boutons + header |
| `frontend/src/components/admin/Sidebar.jsx` | **NOUVEAU** — sidebar bleu profond |
| `frontend/src/components/admin/AdminHeader.jsx` | **NOUVEAU** — header admin |
| `frontend/src/pages/admin/Dashboard.jsx` | KPI widgets + layout |
| `frontend/src/pages/admin/ManageReports.jsx` | Colonne appuis + tri |
| `frontend/src/pages/admin/ReportDetailAdmin.jsx` | Couleurs + layout |
| `frontend/src/pages/admin/AdminLogin.jsx` | Style login |
| `frontend/src/pages/citizen/Home.jsx` | Split view + FAB |
| `frontend/src/pages/citizen/CreateReport.jsx` | Stepper + chips |
| `frontend/src/pages/citizen/ReportsList.jsx` | Cards + bouton appuyer |
| `frontend/src/pages/citizen/ReportDetail.jsx` | Bouton appuyer fixe |
| `frontend/src/pages/citizen/Login.jsx` | Style login |
| `frontend/src/pages/citizen/MyReports.jsx` | Cards + badges |
| `frontend/src/App.jsx` | Layout wrapper admin (sidebar) |

---

## Vérification

1. Lancer `npm run dev` dans `frontend/`
2. Vérifier page Login citoyen : fond #F5F7FA, card centrée
3. Vérifier Home : split view liste/carte, FAB vert
4. Vérifier CreateReport : stepper 5 étapes
5. Vérifier page Admin Dashboard : sidebar bleu profond, 4 KPI widgets
6. Vérifier ManageReports : colonne appuis en avant
7. Vérifier StatusBadge : couleurs bleues/orange/vert
8. Vérifier Button variante `support` : vert + 👍
9. Tester responsive mobile (Navbar bottom nav)
