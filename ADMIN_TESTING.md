# 👨‍💼 Guide de Test - Dashboard Admin

Tests complets du système d'administration (Phase 5).

---

## 📋 Prérequis

1. ✅ Serveur démarré (`npm run dev`)
2. ✅ Base de données avec signalements de test
3. ✅ Au moins 1 admin et 2 citoyens
4. ✅ Signalements avec différents statuts

---

## 🎯 Fonctionnalités à Tester

### ✨ Gestion Signalements
- ✅ Changer le statut d'un signalement
- ✅ Ajouter des notes internes
- ✅ Voir l'historique complet
- ✅ Assigner à un admin
- ✅ Retirer assignation

### 📊 Dashboard & Stats
- ✅ Statistiques globales
- ✅ Répartition par statut
- ✅ Répartition par catégorie
- ✅ Top signalements appuyés
- ✅ Taux de résolution
- ✅ Temps moyen de résolution

### 👥 Gestion Équipe
- ✅ Liste admins municipalité
- ✅ Mes signalements assignés

---

## 🚀 Préparation des Tests

### Étape 1 : Login Admin

```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "phone": "+22890222222"
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Connexion admin réussie",
  "data": {
    "user": {
      "id": 2,
      "fullName": "Admin Lomé",
      "role": "admin",
      "municipalityId": 2
    },
    "token": "eyJhbGciOi..."
  }
}
```

**📝 Copier TOKEN_ADMIN**

---

### Étape 2 : Créer Signalements de Test

**Créer 3 signalements avec différents statuts :**

```bash
# Signalement 1 (pending)
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_CITIZEN_1" \
  -d '{
    "categoryId": 1,
    "title": "Nid de poule avenue principale",
    "description": "Gros trou dangereux",
    "address": "Avenue Principale, Lomé"
  }'

# Noter REPORT_ID_1

# Signalement 2 (pending)
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_CITIZEN_2" \
  -d '{
    "categoryId": 2,
    "title": "Éclairage public défectueux",
    "description": "Lampadaire cassé depuis 1 semaine",
    "address": "Rue des Flamboyants, Lomé"
  }'

# Noter REPORT_ID_2
```

---

## 🧪 Tests : Changer Statut

### Test 1.1 : Changer pending → in_progress ✅

```bash
curl -X PUT http://localhost:5000/api/admin/reports/15/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{
    "status": "in_progress",
    "comment": "Pris en charge par le service technique"
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Statut mis à jour avec succès",
  "data": {
    "report": {
      "id": 15,
      "title": "Nid de poule avenue principale",
      "status": "in_progress",
      "citizen": {
        "id": 6,
        "full_name": "Jean Dupont"
      },
      "category": {
        "id": 1,
        "name": "Voirie et routes"
      }
    },
    "oldStatus": "pending",
    "newStatus": "in_progress"
  }
}
```

**✅ Vérification :**
- Statut changé de pending → in_progress
- Historique créé dans status_histories
- Log activité enregistré

---

### Test 1.2 : Changer in_progress → resolved ✅

```bash
curl -X PUT http://localhost:5000/api/admin/reports/15/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{
    "status": "resolved",
    "comment": "Nid de poule réparé le 27/01/2025"
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Statut mis à jour avec succès",
  "data": {
    "report": {
      "id": 15,
      "status": "resolved"
    },
    "oldStatus": "in_progress",
    "newStatus": "resolved"
  }
}
```

---

### Test 1.3 : Changer pending → rejected ❌ (avec raison)

```bash
curl -X PUT http://localhost:5000/api/admin/reports/16/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{
    "status": "rejected",
    "comment": "Signalement en doublon avec #12. Merci de consulter le signalement existant."
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Statut mis à jour avec succès",
  "data": {
    "report": {
      "id": 16,
      "status": "rejected"
    },
    "oldStatus": "pending",
    "newStatus": "rejected"
  }
}
```

---

### Test 1.4 : Citoyen Tente de Changer Statut ❌

```bash
curl -X PUT http://localhost:5000/api/admin/reports/15/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_CITIZEN_1" \
  -d '{
    "status": "resolved"
  }'
```

**Résultat attendu :**
```json
{
  "success": false,
  "message": "Accès réservé aux administrateurs"
}
```

**✅ Vérification :**
- Erreur 403
- Middleware requireAdmin bloque l'accès

---

### Test 1.5 : Statut Invalide ❌

```bash
curl -X PUT http://localhost:5000/api/admin/reports/15/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{
    "status": "invalid_status"
  }'
```

**Résultat attendu :**
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [
    {
      "msg": "Statut invalide",
      "param": "status"
    }
  ]
}
```

---

## 🧪 Tests : Notes Admin

### Test 2.1 : Ajouter Note Interne ✅

```bash
curl -X POST http://localhost:5000/api/admin/reports/15/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{
    "note": "Équipe technique a inspecté le site. Réparation planifiée pour demain matin 8h."
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Note ajoutée avec succès",
  "data": {
    "id": 3,
    "report_id": 15,
    "old_status": "in_progress",
    "new_status": "in_progress",
    "comment": "Équipe technique a inspecté le site...",
    "changed_by_admin_id": 2,
    "created_at": "2025-01-27T...",
    "admin": {
      "id": 2,
      "full_name": "Admin Lomé",
      "role": "admin"
    }
  }
}
```

**✅ Vérification :**
- Note enregistrée dans status_histories
- old_status = new_status (indique une note)
- Admin qui a ajouté la note inclus

---

### Test 2.2 : Note Trop Courte ❌

```bash
curl -X POST http://localhost:5000/api/admin/reports/15/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{
    "note": "OK"
  }'
```

**Résultat attendu :**
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [
    {
      "msg": "Note entre 5 et 2000 caractères",
      "param": "note"
    }
  ]
}
```

---

## 🧪 Tests : Historique

### Test 3.1 : Voir Historique Complet ✅

```bash
curl http://localhost:5000/api/admin/reports/15/history \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": {
    "report": {
      "id": 15,
      "title": "Nid de poule avenue principale",
      "current_status": "resolved",
      "created_at": "2025-01-27T10:00:00Z"
    },
    "timeline": [
      {
        "id": 1,
        "old_status": "pending",
        "new_status": "in_progress",
        "comment": "Pris en charge par le service technique",
        "created_at": "2025-01-27T10:15:00Z",
        "admin": {
          "id": 2,
          "full_name": "Admin Lomé"
        }
      },
      {
        "id": 2,
        "old_status": "in_progress",
        "new_status": "in_progress",
        "comment": "Équipe technique a inspecté le site...",
        "created_at": "2025-01-27T11:00:00Z",
        "admin": {
          "id": 2,
          "full_name": "Admin Lomé"
        }
      },
      {
        "id": 3,
        "old_status": "in_progress",
        "new_status": "resolved",
        "comment": "Nid de poule réparé le 27/01/2025",
        "created_at": "2025-01-27T14:30:00Z",
        "admin": {
          "id": 2,
          "full_name": "Admin Lomé"
        }
      }
    ],
    "statusChanges": [
      // Changements de statut uniquement (old ≠ new)
    ],
    "notes": [
      // Notes uniquement (old = new)
    ]
  }
}
```

**✅ Vérification :**
- Historique complet chronologique
- Séparation changements vs notes
- Détails admin inclus

---

## 🧪 Tests : Assignation

### Test 4.1 : Créer un 2ème Admin

```bash
# Via SQL pour l'instant (TODO: endpoint création admin)
INSERT INTO users (municipality_id, full_name, phone, role, is_active, created_at, updated_at)
VALUES (2, 'Admin Technique', '+22890333333', 'admin', 1, NOW(), NOW());
```

**Noter ADMIN_ID_2 (ex: 9)**

---

### Test 4.2 : Assigner Signalement à Admin ✅

```bash
curl -X POST http://localhost:5000/api/admin/reports/15/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{
    "adminId": 9
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Signalement assigné avec succès",
  "data": {
    "report": {
      "id": 15,
      "title": "Nid de poule avenue principale",
      "assigned_to_admin_id": 9,
      "assignedAdmin": {
        "id": 9,
        "full_name": "Admin Technique",
        "phone": "+22890333333"
      }
    },
    "assignedTo": "Admin Technique"
  }
}
```

**✅ Vérification :**
- Champ assigned_to_admin_id mis à jour
- Note ajoutée dans historique
- Admin assigné inclus dans réponse

---

### Test 4.3 : Réassigner à Autre Admin ✅

```bash
curl -X POST http://localhost:5000/api/admin/reports/15/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{
    "adminId": 2
  }'
```

**Résultat attendu :**
- Réassignation réussie
- Note "Réassigné à Admin Lomé" dans historique

---

### Test 4.4 : Retirer Assignation ✅

```bash
curl -X DELETE http://localhost:5000/api/admin/reports/15/assign \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Assignation retirée avec succès"
}
```

**✅ Vérification :**
- assigned_to_admin_id = NULL
- Note "Assignation retirée" dans historique

---

### Test 4.5 : Assigner à Admin Inexistant ❌

```bash
curl -X POST http://localhost:5000/api/admin/reports/15/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_ADMIN" \
  -d '{
    "adminId": 999
  }'
```

**Résultat attendu :**
```json
{
  "success": false,
  "message": "Administrateur introuvable ou inactif"
}
```

---

## 🧪 Tests : Mes Signalements Assignés

### Test 5.1 : Voir Mes Signalements ✅

```bash
curl "http://localhost:5000/api/admin/reports/assigned?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN_ADMIN_2"
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": {
    "reports": [
      {
        "id": 15,
        "title": "Nid de poule avenue principale",
        "status": "in_progress",
        "priority_score": 5.5,
        "citizen": {
          "id": 6,
          "full_name": "Jean Dupont"
        },
        "category": {
          "id": 1,
          "name": "Voirie et routes"
        },
        "photos": [
          // Première photo
        ]
      }
    ],
    "pagination": {
      "total": 3,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

### Test 5.2 : Filtrer par Statut

```bash
curl "http://localhost:5000/api/admin/reports/assigned?status=in_progress" \
  -H "Authorization: Bearer $TOKEN_ADMIN_2"
```

**Résultat attendu :**
- Seulement signalements in_progress assignés à l'admin

---

## 🧪 Tests : Dashboard Stats

### Test 6.1 : Statistiques Globales ✅

```bash
curl http://localhost:5000/api/admin/dashboard/stats \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalReports": 25,
      "reportsByStatus": {
        "pending": 10,
        "in_progress": 8,
        "resolved": 5,
        "rejected": 2
      },
      "resolutionRate": 20.0,
      "avgResolutionTimeDays": 3.5,
      "assignedCount": 12,
      "unassignedCount": 13
    },
    "reportsByCategory": [
      {
        "category_id": 1,
        "count": 12,
        "category": {
          "name": "Voirie et routes",
          "icon": "🛣️"
        }
      },
      {
        "category_id": 2,
        "count": 8,
        "category": {
          "name": "Éclairage public",
          "icon": "💡"
        }
      }
    ],
    "topSupported": [
      {
        "id": 15,
        "title": "Nid de poule avenue principale",
        "priority_score": 8.5,
        "supports_count": 8,
        "category": {
          "name": "Voirie et routes"
        }
      }
    ],
    "recentActivityCount": 45
  }
}
```

**✅ Vérification :**
- Total signalements correct
- Répartition par statut
- Taux de résolution calculé
- Temps moyen de résolution
- Top signalements appuyés
- Activité récente (7 jours)

---

### Test 6.2 : Stats avec Filtre Date

```bash
curl "http://localhost:5000/api/admin/dashboard/stats?dateFrom=2025-01-01&dateTo=2025-01-31" \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

**Résultat attendu :**
- Stats filtrées pour janvier 2025 uniquement

---

## 🧪 Tests : Liste Admins

### Test 7.1 : Voir Tous les Admins ✅

```bash
curl http://localhost:5000/api/admin/users/admins \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "full_name": "Admin Lomé",
      "phone": "+22890222222",
      "email": null,
      "role": "admin",
      "created_at": "2025-01-20T..."
    },
    {
      "id": 9,
      "full_name": "Admin Technique",
      "phone": "+22890333333",
      "email": null,
      "role": "admin",
      "created_at": "2025-01-27T..."
    }
  ]
}
```

**✅ Vérification :**
- Liste tous les admins actifs
- Tri alphabétique par nom
- Utilisé pour menu déroulant assignation

---

## 📊 Vérifications en Base de Données

### Voir Historique Statuts

```sql
SELECT
  sh.id,
  sh.report_id,
  r.title,
  sh.old_status,
  sh.new_status,
  sh.comment,
  u.full_name as admin_name,
  sh.created_at
FROM status_histories sh
JOIN reports r ON sh.report_id = r.id
JOIN users u ON sh.changed_by_admin_id = u.id
WHERE r.municipality_id = 2
ORDER BY sh.created_at DESC
LIMIT 20;
```

---

### Voir Signalements Assignés

```sql
SELECT
  r.id,
  r.title,
  r.status,
  r.assigned_to_admin_id,
  u.full_name as assigned_to,
  r.priority_score
FROM reports r
LEFT JOIN users u ON r.assigned_to_admin_id = u.id
WHERE r.municipality_id = 2
  AND r.assigned_to_admin_id IS NOT NULL
ORDER BY r.priority_score DESC;
```

---

### Statistiques par Admin

```sql
SELECT
  u.id,
  u.full_name,
  COUNT(DISTINCT r.id) as signalements_assignes,
  SUM(CASE WHEN r.status = 'resolved' THEN 1 ELSE 0 END) as resolus,
  SUM(CASE WHEN r.status = 'in_progress' THEN 1 ELSE 0 END) as en_cours
FROM users u
LEFT JOIN reports r ON u.id = r.assigned_to_admin_id
WHERE u.municipality_id = 2
  AND u.role IN ('admin', 'super_admin')
GROUP BY u.id, u.full_name
ORDER BY signalements_assignes DESC;
```

---

## ✅ Checklist de Validation Phase 5

### Changement Statut
- [ ] pending → in_progress fonctionne
- [ ] in_progress → resolved fonctionne
- [ ] pending → rejected avec raison
- [ ] Historique créé automatiquement
- [ ] Citoyen ne peut pas changer statut

### Notes Admin
- [ ] Ajouter note interne fonctionne
- [ ] Note visible dans historique
- [ ] Admin auteur identifié
- [ ] Validation longueur note

### Historique
- [ ] Timeline complète chronologique
- [ ] Séparation changements/notes
- [ ] Détails admin inclus
- [ ] Accessible uniquement aux admins

### Assignation
- [ ] Assigner à admin fonctionne
- [ ] Réassigner fonctionne
- [ ] Retirer assignation fonctionne
- [ ] Note créée dans historique
- [ ] Validation admin existe

### Dashboard Stats
- [ ] Total signalements correct
- [ ] Répartition par statut
- [ ] Répartition par catégorie
- [ ] Taux de résolution calculé
- [ ] Temps moyen résolution
- [ ] Top signalements
- [ ] Filtre par date

### Mes Assignations
- [ ] Liste signalements assignés
- [ ] Filtre par statut
- [ ] Pagination fonctionnelle
- [ ] Tri par priorité

### Permissions
- [ ] requireAdmin bloque citoyens
- [ ] Multi-tenant respecté
- [ ] Logs activités créés

---

## 🔄 Workflow Complet Admin

### Scénario : Admin Gère un Signalement

```bash
# 1. Admin se connecte
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "phone": "+22890222222"
  }'

# Copier TOKEN

# 2. Voir dashboard stats
curl http://localhost:5000/api/admin/dashboard/stats \
  -H "Authorization: Bearer $TOKEN"

# 3. Voir signalements prioritaires
curl "http://localhost:5000/api/reports?sortBy=priority&limit=10" \
  -H "Authorization: Bearer $TOKEN"

# 4. Sélectionner signalement (ID: 15)
curl http://localhost:5000/api/reports/15 \
  -H "Authorization: Bearer $TOKEN"

# 5. Changer statut → in_progress
curl -X PUT http://localhost:5000/api/admin/reports/15/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "in_progress",
    "comment": "Pris en charge par le service technique"
  }'

# 6. Assigner à admin technique
curl -X POST http://localhost:5000/api/admin/reports/15/assign \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "adminId": 9
  }'

# 7. Ajouter note de suivi
curl -X POST http://localhost:5000/api/admin/reports/15/notes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "note": "Équipe dépêchée sur place demain 8h"
  }'

# 8. Voir historique complet
curl http://localhost:5000/api/admin/reports/15/history \
  -H "Authorization: Bearer $TOKEN"

# 9. Plus tard : Résoudre le signalement
curl -X PUT http://localhost:5000/api/admin/reports/15/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "status": "resolved",
    "comment": "Problème résolu le 28/01/2025"
  }'
```

**✅ Workflow complet admin opérationnel !**

---

## 🎯 Prochaines Étapes

Avec le dashboard admin fonctionnel :

1. **Phase 6 : Notifications**
   - Notifier citoyen quand statut change
   - Notifier admin quand signalement assigné
   - Email, SMS, push notifications

2. **Phase 7 : Frontend React**
   - Dashboard admin visuel
   - Gestion signalements
   - Charts et graphiques

3. **Phase 8 : Avancé**
   - Export CSV/PDF
   - Analytics avancés
   - Commentaires citoyens

---

**✅ Le dashboard admin est 100% opérationnel !**

---

**Date :** 27 Janvier 2025
**Version :** 1.4.0 - Phase 5 Admin
**Status :** ✅ TESTS DISPONIBLES
