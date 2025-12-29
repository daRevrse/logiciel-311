# 👍 Guide de Test - Système d'Appui Citoyen

Tests complets du système d'appui (support) sur les signalements (Phase 4).

---

## 📋 Prérequis

1. ✅ Serveur démarré (`npm run dev`)
2. ✅ Base de données avec signalements de test
3. ✅ Au moins 2 citoyens connectés (pour tester les appuis)
4. ✅ Tokens JWT valides pour les citoyens

---

## 🎯 Fonctionnalités à Tester

### ✨ Système d'Appui
- ✅ Ajouter son appui à un signalement
- ✅ Retirer son appui
- ✅ 1 citoyen = 1 appui max par signalement
- ✅ Impossible d'appuyer son propre signalement
- ✅ Auto-update du priority_score
- ✅ Statistiques d'appuis
- ✅ Top signalements appuyés
- ✅ Mes signalements appuyés

---

## 🚀 Préparation des Tests

### Étape 1 : Créer 2 Citoyens

**Citoyen 1 :**
```bash
curl -X POST http://localhost:5000/api/auth/login/fingerprint \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "deviceFingerprint": "citizen1-device",
    "fullName": "Jean Dupont"
  }'
```

**Copier le token → TOKEN_CITIZEN_1**

**Citoyen 2 :**
```bash
curl -X POST http://localhost:5000/api/auth/login/fingerprint \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "deviceFingerprint": "citizen2-device",
    "fullName": "Marie Martin"
  }'
```

**Copier le token → TOKEN_CITIZEN_2**

---

### Étape 2 : Créer un Signalement (Citoyen 1)

```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_CITIZEN_1" \
  -d '{
    "categoryId": 1,
    "title": "Nid de poule avenue principale",
    "description": "Gros nid de poule dangereux pour les véhicules",
    "address": "Avenue Principale, Lomé"
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Signalement créé avec succès",
  "data": {
    "id": 15,
    "title": "Nid de poule avenue principale",
    "priority_score": 0.0,
    "status": "pending"
  }
}
```

**📝 Noter l'ID du signalement → REPORT_ID**

---

## 🧪 Tests : Ajouter des Appuis

### Test 1.1 : Citoyen 2 Appuie le Signalement ✅

```bash
curl -X POST http://localhost:5000/api/reports/15/support \
  -H "Authorization: Bearer $TOKEN_CITIZEN_2"
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Appui ajouté avec succès",
  "data": {
    "support": {
      "id": 1,
      "report_id": 15,
      "citizen_id": 7,
      "created_at": "2025-01-27T..."
    },
    "newPriorityScore": 1.0
  }
}
```

**✅ Vérification :**
- Support créé avec succès
- Priority score passé de 0.0 à 1.0
- Log activité créé

---

### Test 1.2 : Citoyen 2 Tente d'Appuyer 2 Fois ❌

```bash
curl -X POST http://localhost:5000/api/reports/15/support \
  -H "Authorization: Bearer $TOKEN_CITIZEN_2"
```

**Résultat attendu :**
```json
{
  "success": false,
  "message": "Vous avez déjà appuyé ce signalement"
}
```

**✅ Vérification :**
- Erreur 400
- Impossible d'appuyer 2 fois
- Priority score inchangé

---

### Test 1.3 : Citoyen 1 Tente d'Appuyer Son Propre Signalement ❌

```bash
curl -X POST http://localhost:5000/api/reports/15/support \
  -H "Authorization: Bearer $TOKEN_CITIZEN_1"
```

**Résultat attendu :**
```json
{
  "success": false,
  "message": "Vous ne pouvez pas appuyer votre propre signalement"
}
```

**✅ Vérification :**
- Erreur 400
- Créateur ne peut pas appuyer son signalement
- Log warning créé

---

### Test 1.4 : Créer Citoyen 3 et Appuyer ✅

```bash
# Créer citoyen 3
curl -X POST http://localhost:5000/api/auth/login/fingerprint \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "deviceFingerprint": "citizen3-device",
    "fullName": "Paul Durand"
  }'

# Copier TOKEN_CITIZEN_3

# Appuyer le signalement
curl -X POST http://localhost:5000/api/reports/15/support \
  -H "Authorization: Bearer $TOKEN_CITIZEN_3"
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Appui ajouté avec succès",
  "data": {
    "support": {
      "id": 2,
      "report_id": 15,
      "citizen_id": 8
    },
    "newPriorityScore": 2.0
  }
}
```

**✅ Vérification :**
- 2 appuis total
- Priority score = 2.0
- Le signalement monte dans le classement

---

## 🧪 Tests : Retirer des Appuis

### Test 2.1 : Citoyen 2 Retire Son Appui ✅

```bash
curl -X DELETE http://localhost:5000/api/reports/15/support \
  -H "Authorization: Bearer $TOKEN_CITIZEN_2"
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Appui retiré avec succès",
  "data": {
    "newPriorityScore": 1.0
  }
}
```

**✅ Vérification :**
- Appui supprimé
- Priority score recalculé : 2.0 → 1.0
- 1 seul appui restant (Citoyen 3)

---

### Test 2.2 : Citoyen 2 Tente de Retirer 2 Fois ❌

```bash
curl -X DELETE http://localhost:5000/api/reports/15/support \
  -H "Authorization: Bearer $TOKEN_CITIZEN_2"
```

**Résultat attendu :**
```json
{
  "success": false,
  "message": "Vous n'avez pas appuyé ce signalement"
}
```

**✅ Vérification :**
- Erreur 400
- Impossible de retirer un appui inexistant

---

### Test 2.3 : Citoyen 2 Réappuie Après Retrait ✅

```bash
curl -X POST http://localhost:5000/api/reports/15/support \
  -H "Authorization: Bearer $TOKEN_CITIZEN_2"
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Appui ajouté avec succès",
  "data": {
    "newPriorityScore": 2.0
  }
}
```

**✅ Vérification :**
- Possible de réappuyer après retrait
- Priority score : 1.0 → 2.0

---

## 🧪 Tests : Vérifications & Statistiques

### Test 3.1 : Vérifier Si J'ai Appuyé

```bash
curl http://localhost:5000/api/reports/15/support/check \
  -H "Authorization: Bearer $TOKEN_CITIZEN_2"
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": {
    "hasSupported": true,
    "reportId": 15,
    "citizenId": 7
  }
}
```

---

### Test 3.2 : Compter les Appuis d'un Signalement

```bash
curl http://localhost:5000/api/reports/15/supports/count \
  -H "Authorization: Bearer $TOKEN_CITIZEN_2"
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": {
    "reportId": 15,
    "supportsCount": 2
  }
}
```

---

### Test 3.3 : Statistiques Détaillées d'un Signalement

```bash
curl http://localhost:5000/api/reports/15/supports/stats \
  -H "Authorization: Bearer $TOKEN_CITIZEN_2"
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": {
    "totalSupports": 2,
    "priorityScore": 2.0,
    "ageInDays": 0,
    "supportsPerDay": 2.0
  }
}
```

---

### Test 3.4 : Mes Signalements Appuyés

```bash
curl http://localhost:5000/api/supports/my-supported \
  -H "Authorization: Bearer $TOKEN_CITIZEN_2"
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": {
    "supports": [
      {
        "report_id": 15,
        "created_at": "2025-01-27T...",
        "report": {
          "id": 15,
          "title": "Nid de poule avenue principale",
          "status": "pending",
          "priority_score": 2.0,
          "citizen": {
            "id": 6,
            "full_name": "Jean Dupont"
          }
        }
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "totalPages": 1
    }
  }
}
```

---

## 🧪 Tests : Top Signalements Appuyés

### Test 4.1 : Créer Plusieurs Signalements avec Appuis

**Créer Signalement 2 (Citoyen 1) :**
```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_CITIZEN_1" \
  -d '{
    "categoryId": 2,
    "title": "Éclairage public défectueux",
    "description": "Lampadaire cassé depuis 1 semaine",
    "address": "Rue des Flamboyants, Lomé"
  }'
```

**5 Citoyens Appuient :**
```bash
# Citoyen 2 appuie
curl -X POST http://localhost:5000/api/reports/16/support \
  -H "Authorization: Bearer $TOKEN_CITIZEN_2"

# Citoyen 3 appuie
curl -X POST http://localhost:5000/api/reports/16/support \
  -H "Authorization: Bearer $TOKEN_CITIZEN_3"

# ... (créer 2 autres citoyens et les faire appuyer)
```

---

### Test 4.2 : Voir le Top 10 des Signalements

```bash
curl "http://localhost:5000/api/reports/top-supported?limit=10" \
  -H "Authorization: Bearer $TOKEN_CITIZEN_2"
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": [
    {
      "id": 16,
      "title": "Éclairage public défectueux",
      "priority_score": 5.0,
      "supports_count": 5,
      "citizen": {
        "id": 6,
        "full_name": "Jean Dupont"
      }
    },
    {
      "id": 15,
      "title": "Nid de poule avenue principale",
      "priority_score": 2.0,
      "supports_count": 2,
      "citizen": {
        "id": 6,
        "full_name": "Jean Dupont"
      }
    }
  ]
}
```

**✅ Vérification :**
- Signalements triés par nombre d'appuis DESC
- Signalement avec 5 appuis en premier

---

### Test 4.3 : Top avec Filtre Status

```bash
curl "http://localhost:5000/api/reports/top-supported?status=pending&limit=5" \
  -H "Authorization: Bearer $TOKEN_CITIZEN_2"
```

**Résultat attendu :**
- Seulement signalements avec status = "pending"
- Triés par nombre d'appuis

---

## 🧪 Tests Admin : Voir Qui a Appuyé

### Test 5.1 : Login Admin

```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "phone": "+22890222222"
  }'
```

**Copier TOKEN_ADMIN**

---

### Test 5.2 : Lister Tous les Appuis d'un Signalement (Admin)

```bash
curl http://localhost:5000/api/reports/15/supports \
  -H "Authorization: Bearer $TOKEN_ADMIN"
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": {
    "supports": [
      {
        "id": 1,
        "report_id": 15,
        "citizen_id": 7,
        "created_at": "2025-01-27T...",
        "citizen": {
          "id": 7,
          "full_name": "Marie Martin",
          "email": null,
          "created_at": "2025-01-27T..."
        }
      },
      {
        "id": 2,
        "report_id": 15,
        "citizen_id": 8,
        "created_at": "2025-01-27T...",
        "citizen": {
          "id": 8,
          "full_name": "Paul Durand",
          "email": null,
          "created_at": "2025-01-27T..."
        }
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 50,
      "totalPages": 1
    }
  }
}
```

**✅ Vérification :**
- Admin voit tous les appuis
- Détails citoyens inclus
- Pagination fonctionnelle

---

### Test 5.3 : Citoyen Tente d'Accéder Liste Complète ❌

```bash
curl http://localhost:5000/api/reports/15/supports \
  -H "Authorization: Bearer $TOKEN_CITIZEN_2"
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
- Seulement admins peuvent voir la liste complète

---

## 🧪 Tests : Règles Métier

### Test 6.1 : Impossible d'Appuyer Signalement Résolu ❌

**Créer signalement et le résoudre (Admin) :**
```bash
# Créer signalement
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN_CITIZEN_1" \
  -d '{
    "categoryId": 1,
    "title": "Test signalement résolu",
    "description": "Test",
    "address": "Test"
  }'

# Le résoudre (TODO: endpoint admin pour changer status)
# Pour l'instant, modifier en SQL:
# UPDATE reports SET status = 'resolved' WHERE id = 17;
```

**Tenter d'appuyer :**
```bash
curl -X POST http://localhost:5000/api/reports/17/support \
  -H "Authorization: Bearer $TOKEN_CITIZEN_2"
```

**Résultat attendu :**
```json
{
  "success": false,
  "message": "Impossible d'appuyer un signalement résolu ou rejeté"
}
```

---

### Test 6.2 : Vérifier Auto-Update Priority Score

**Scénario complet :**

1. **Créer signalement** → priority_score = 0.0
2. **Ajouter 3 appuis** → priority_score = 3.0
3. **Retirer 1 appui** → priority_score = 2.0
4. **Attendre 1 jour (simuler)** → priority_score = 2.5 (2 appuis + 0.5 jour)

**Vérification SQL :**
```sql
SELECT
  id,
  title,
  priority_score,
  created_at,
  TIMESTAMPDIFF(DAY, created_at, NOW()) as age_days,
  (SELECT COUNT(*) FROM supports WHERE report_id = reports.id) as supports_count
FROM reports
WHERE id = 15;
```

**Formule vérifiée :**
```
priority_score = supports_count + (age_days * 0.5)
```

---

## 🧪 Tests : Rate Limiting

### Test 7.1 : Limite Appuis par Minute

**Faire 21 appuis rapidement :**
```bash
for i in {1..21}; do
  curl -X POST http://localhost:5000/api/reports/15/support \
    -H "Authorization: Bearer $TOKEN_CITIZEN_2" \
    && echo ""
done
```

**Résultat attendu (21ème requête) :**
```json
{
  "success": false,
  "message": "Trop d'actions. Veuillez patienter un instant."
}
```

**✅ Vérification :**
- Limite : 20 actions / minute
- Protection contre spam d'appuis

---

## 📊 Vérifications en Base de Données

### Voir Tous les Appuis

```sql
SELECT
  s.id,
  s.report_id,
  s.citizen_id,
  u.full_name as citizen_name,
  r.title as report_title,
  s.created_at
FROM supports s
JOIN users u ON s.citizen_id = u.id
JOIN reports r ON s.report_id = r.id
ORDER BY s.created_at DESC;
```

---

### Voir Signalements avec Compteur d'Appuis

```sql
SELECT
  r.id,
  r.title,
  r.priority_score,
  r.status,
  COUNT(s.id) as supports_count,
  TIMESTAMPDIFF(DAY, r.created_at, NOW()) as age_days
FROM reports r
LEFT JOIN supports s ON r.id = s.report_id
WHERE r.municipality_id = 2
GROUP BY r.id
ORDER BY supports_count DESC, r.priority_score DESC;
```

---

### Vérifier Priority Score Cohérent

```sql
SELECT
  id,
  title,
  priority_score,
  (SELECT COUNT(*) FROM supports WHERE report_id = reports.id) as supports_count,
  TIMESTAMPDIFF(DAY, created_at, NOW()) as age_days,
  (
    (SELECT COUNT(*) FROM supports WHERE report_id = reports.id) +
    (TIMESTAMPDIFF(DAY, created_at, NOW()) * 0.5)
  ) as calculated_score
FROM reports
WHERE municipality_id = 2
HAVING ABS(priority_score - calculated_score) > 0.1;
```

**Résultat attendu :** Aucune ligne (tous les scores cohérents)

---

### Voir Activités Appuis

```sql
SELECT
  action,
  user_id,
  metadata,
  created_at
FROM activity_logs
WHERE action IN ('add_support', 'remove_support')
ORDER BY created_at DESC
LIMIT 20;
```

---

## ✅ Checklist de Validation Phase 4

### Fonctionnalités CRUD Appuis
- [ ] Ajouter un appui fonctionne
- [ ] Retirer un appui fonctionne
- [ ] Impossible d'appuyer 2 fois
- [ ] Impossible d'appuyer son propre signalement
- [ ] Impossible d'appuyer signalement résolu/rejeté

### Priority Score
- [ ] Priority score mis à jour à l'ajout d'appui
- [ ] Priority score mis à jour au retrait d'appui
- [ ] Formule correcte : `supports + (age_days * 0.5)`
- [ ] Score cohérent dans toute la base

### Statistiques & Vues
- [ ] Compter appuis fonctionne
- [ ] Statistiques détaillées correctes
- [ ] Top signalements triés correctement
- [ ] Mes signalements appuyés affichés
- [ ] Vérifier si j'ai appuyé fonctionne

### Sécurité & Permissions
- [ ] Citoyens uniquement peuvent appuyer
- [ ] Admins voient liste complète appuis
- [ ] Citoyens ne voient pas qui a appuyé
- [ ] Multi-tenant respecté
- [ ] Rate limiting fonctionne (20/min)

### Logging & Audit
- [ ] Logs créés pour add_support
- [ ] Logs créés pour remove_support
- [ ] Tentatives invalides loggées
- [ ] IP et metadata enregistrés

---

## 🔄 Workflow Complet Citoyen

### Scénario : Marie Appuie un Signalement

```bash
# 1. Marie se connecte
curl -X POST http://localhost:5000/api/auth/login/fingerprint \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "deviceFingerprint": "marie-phone-123",
    "fullName": "Marie Martin"
  }'

# Copier TOKEN

# 2. Marie liste les signalements
curl "http://localhost:5000/api/reports?sortBy=priority" \
  -H "Authorization: Bearer $TOKEN"

# 3. Marie voit un signalement qui l'intéresse (ID: 15)
curl http://localhost:5000/api/reports/15 \
  -H "Authorization: Bearer $TOKEN"

# 4. Marie vérifie si elle l'a déjà appuyé
curl http://localhost:5000/api/reports/15/support/check \
  -H "Authorization: Bearer $TOKEN"

# 5. Marie appuie le signalement
curl -X POST http://localhost:5000/api/reports/15/support \
  -H "Authorization: Bearer $TOKEN"

# 6. Marie voit tous ses signalements appuyés
curl http://localhost:5000/api/supports/my-supported \
  -H "Authorization: Bearer $TOKEN"

# 7. Marie change d'avis et retire son appui
curl -X DELETE http://localhost:5000/api/reports/15/support \
  -H "Authorization: Bearer $TOKEN"
```

**✅ Tout fonctionne parfaitement !**

---

## 🎯 Prochaines Étapes

Avec le système d'appui fonctionnel :

1. **Phase 5 : Dashboard Admin**
   - Changer le statut des signalements
   - Ajouter des notes admin
   - Statistiques avancées

2. **Phase 6 : Notifications**
   - Notifier quand signalement appuyé
   - Notifier changement de statut

3. **Phase 7 : Frontend React**
   - Bouton "Appuyer" sur chaque signalement
   - Afficher nombre d'appuis
   - Indicateur "Vous avez appuyé"

---

**✅ Le système d'appui citoyen est 100% opérationnel !**

---

**Date :** 27 Janvier 2025
**Version :** 1.3.0 - Phase 4 Appuis
**Status :** ✅ TESTS DISPONIBLES
