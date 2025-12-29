# 📋 Guide de Test - Signalements (Phase 3)

Tests complets du système de gestion des signalements.

---

## 📋 Prérequis

1. ✅ Serveur démarré (`npm run dev`)
2. ✅ Données de test chargées (`npm run seed`)
3. ✅ Token citoyen généré

**Générer un token citoyen :**
```bash
curl -X POST http://localhost:5000/api/auth/login/fingerprint \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "deviceFingerprint": "test-citizen-device",
    "fullName": "Test Citizen"
  }'
```

**📝 Copier le token retourné dans une variable :**
```bash
TOKEN="eyJhbGciOi..."
```

---

## 🎯 Tests : Catégories

### Test 1.1 : Lister les Catégories

```bash
curl http://localhost:5000/api/reports/categories \
  -H "Authorization: Bearer $TOKEN"
```

**Résultat attendu :**
```json
{
  "success": true,
  "count": 7,
  "data": [
    {
      "id": 1,
      "name": "Route dégradée",
      "description": "Catégorie pour les signalements de type: Route dégradée",
      "icon": "road",
      "color": "#EF4444",
      "displayOrder": 1,
      "activeReportsCount": 0
    },
    {
      "id": 2,
      "name": "Éclairage public",
      "icon": "light",
      "color": "#F59E0B",
      "activeReportsCount": 0
    },
    ...
  ]
}
```

---

## 📝 Tests : CRUD Signalements

### Test 2.1 : Créer un Signalement

```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "categoryId": 1,
    "title": "Nid de poule avenue de la Libération",
    "description": "Gros nid de poule très dangereux situé au milieu de la voie. Risque d'\''accidents, plusieurs motos ont déjà chuté.",
    "address": "Avenue de la Libération, près du rond-point Étoile",
    "latitude": 6.1319,
    "longitude": 1.2228
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Signalement créé avec succès",
  "data": {
    "id": 1,
    "title": "Nid de poule avenue de la Libération",
    "status": "pending",
    "priorityScore": 0,
    "createdAt": "2025-01-27T..."
  }
}
```

**📝 Noter l'ID du signalement (ex: 1)**

---

### Test 2.2 : Créer Plus de Signalements

```bash
# Signalement 2
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "categoryId": 2,
    "title": "Lampadaire cassé rue de l'Indépendance",
    "description": "Le lampadaire devant le n°45 ne fonctionne plus depuis 2 semaines. La rue est très sombre la nuit.",
    "address": "Rue de l'\''Indépendance, devant le n°45",
    "latitude": 6.1325,
    "longitude": 1.2235
  }'

# Signalement 3
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "categoryId": 3,
    "title": "Déchets non ramassés depuis une semaine",
    "description": "Les ordures s'\''accumulent au coin de la rue. Mauvaises odeurs et risques sanitaires.",
    "address": "Coin avenue Sarakawa et rue de la Paix"
  }'
```

---

### Test 2.3 : Récupérer un Signalement

```bash
curl http://localhost:5000/api/reports/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "municipalityId": 2,
    "citizenId": 6,
    "categoryId": 1,
    "title": "Nid de poule avenue de la Libération",
    "description": "Gros nid de poule très dangereux...",
    "address": "Avenue de la Libération, près du rond-point Étoile",
    "latitude": "6.13190000",
    "longitude": "1.22280000",
    "status": "pending",
    "priorityScore": 0,
    "citizen": {
      "id": 6,
      "fullName": "Test Citizen",
      "phone": null
    },
    "category": {
      "id": 1,
      "name": "Route dégradée",
      "icon": "road",
      "color": "#EF4444"
    },
    "photos": [],
    "supports": [],
    "supportsCount": 0,
    "resolver": null,
    "createdAt": "2025-01-27T...",
    "updatedAt": "2025-01-27T..."
  }
}
```

---

### Test 2.4 : Lister Tous les Signalements

```bash
curl "http://localhost:5000/api/reports?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "title": "Déchets non ramassés...",
      "status": "pending",
      "priorityScore": 0,
      "category": {...},
      "citizen": {...},
      "photos": [],
      "supportsCount": 0
    },
    ...
  ],
  "pagination": {
    "total": 3,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

---

### Test 2.5 : Filtrer par Statut

```bash
curl "http://localhost:5000/api/reports?status=pending" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Test 2.6 : Filtrer par Catégorie

```bash
curl "http://localhost:5000/api/reports?categoryId=1" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Test 2.7 : Recherche par Mot-clé

```bash
curl "http://localhost:5000/api/reports?search=poule" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Test 2.8 : Trier par Date

```bash
curl "http://localhost:5000/api/reports?sortBy=date&order=DESC" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Test 2.9 : Mes Signalements

```bash
curl http://localhost:5000/api/reports/my-reports \
  -H "Authorization: Bearer $TOKEN"
```

---

### Test 2.10 : Mettre à Jour un Signalement

```bash
curl -X PUT http://localhost:5000/api/reports/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Nid de poule URGENT avenue de la Libération",
    "description": "Gros nid de poule très dangereux. MISE À JOUR: Situation empire, plusieurs accidents."
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Signalement mis à jour",
  "data": {
    "id": 1,
    "title": "Nid de poule URGENT avenue de la Libération",
    "description": "Gros nid de poule très dangereux. MISE À JOUR...",
    "address": "Avenue de la Libération, près du rond-point Étoile",
    "updatedAt": "2025-01-27T..."
  }
}
```

---

### Test 2.11 : Supprimer un Signalement (Pending)

```bash
curl -X DELETE http://localhost:5000/api/reports/3 \
  -H "Authorization: Bearer $TOKEN"
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Signalement supprimé avec succès"
}
```

---

## 📸 Tests : Upload Photos

### Test 3.1 : Upload une Photo

**Créer un fichier image de test** (ou utiliser une image existante)

```bash
curl -X POST http://localhost:5000/api/reports/1/photos \
  -H "Authorization: Bearer $TOKEN" \
  -F "photo=@/chemin/vers/image.jpg"
```

**Windows PowerShell :**
```powershell
$form = @{
    photo = Get-Item -Path "C:\chemin\vers\image.jpg"
}

Invoke-RestMethod -Uri "http://localhost:5000/api/reports/1/photos" `
  -Method Post `
  -Headers @{Authorization = "Bearer $TOKEN"} `
  -Form $form
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Photo uploadée avec succès",
  "data": {
    "id": 1,
    "photoUrl": "http://localhost:5000/uploads/reports/2_1_1738000000000-123456789.jpg",
    "uploadOrder": 1
  }
}
```

---

### Test 3.2 : Voir la Photo Uploadée

Ouvrir dans le navigateur :
```
http://localhost:5000/uploads/reports/2_1_1738000000000-123456789.jpg
```

---

### Test 3.3 : Upload Plusieurs Photos

```bash
# Photo 2
curl -X POST http://localhost:5000/api/reports/1/photos \
  -H "Authorization: Bearer $TOKEN" \
  -F "photo=@/chemin/vers/image2.jpg"

# Photo 3
curl -X POST http://localhost:5000/api/reports/1/photos \
  -H "Authorization: Bearer $TOKEN" \
  -F "photo=@/chemin/vers/image3.jpg"
```

---

### Test 3.4 : Vérifier les Photos dans le Signalement

```bash
curl http://localhost:5000/api/reports/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Photos dans la réponse :**
```json
{
  "photos": [
    {
      "id": 1,
      "photoUrl": "http://localhost:5000/uploads/reports/2_1_...-....jpg",
      "uploadOrder": 1
    },
    {
      "id": 2,
      "photoUrl": "http://localhost:5000/uploads/reports/2_1_...-....jpg",
      "uploadOrder": 2
    }
  ]
}
```

---

### Test 3.5 : Supprimer une Photo

```bash
curl -X DELETE http://localhost:5000/api/reports/photos/2 \
  -H "Authorization: Bearer $TOKEN"
```

**Résultat :**
```json
{
  "success": true,
  "message": "Photo supprimée avec succès"
}
```

---

## 📊 Tests : Statistiques

### Test 4.1 : Statistiques Globales

```bash
curl http://localhost:5000/api/reports/statistics \
  -H "Authorization: Bearer $TOKEN"
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": {
    "total": 2,
    "byStatus": {
      "pending": 2,
      "in_progress": 0,
      "resolved": 0,
      "rejected": 0
    },
    "percentageResolved": "0.0"
  }
}
```

---

## ❌ Tests d'Erreurs

### Erreur 1 : Catégorie Invalide

```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "categoryId": 999,
    "title": "Test",
    "description": "Description test test test",
    "address": "Adresse test"
  }'
```

**Résultat :**
```json
{
  "success": false,
  "message": "Catégorie invalide ou inactive"
}
```

---

### Erreur 2 : Titre Trop Court

```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "categoryId": 1,
    "title": "Err",
    "description": "Description valide ici",
    "address": "Adresse"
  }'
```

**Résultat :**
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [
    {
      "msg": "Le titre doit contenir entre 5 et 255 caractères",
      "param": "title"
    }
  ]
}
```

---

### Erreur 3 : Upload Fichier Non-Image

```bash
curl -X POST http://localhost:5000/api/reports/1/photos \
  -H "Authorization: Bearer $TOKEN" \
  -F "photo=@/chemin/vers/document.pdf"
```

**Résultat :**
```json
{
  "success": false,
  "message": "Type de fichier non autorisé. Formats acceptés: image/jpeg, image/jpg, image/png, image/webp"
}
```

---

### Erreur 4 : Fichier Trop Gros (> 5MB)

```bash
# Créer un fichier > 5MB et essayer de l'uploader
```

**Résultat :**
```json
{
  "success": false,
  "message": "File too large"
}
```

---

### Erreur 5 : Supprimer Signalement d'un Autre Utilisateur

```bash
# Se connecter avec un autre citoyen
curl -X POST http://localhost:5000/api/auth/login/fingerprint \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "deviceFingerprint": "autre-citizen-device",
    "fullName": "Autre Citizen"
  }'

# Essayer de supprimer le signalement du premier
curl -X DELETE http://localhost:5000/api/reports/1 \
  -H "Authorization: Bearer $NEW_TOKEN"
```

**Résultat :**
```json
{
  "success": false,
  "message": "Signalement non trouvé ou non autorisé"
}
```

---

### Erreur 6 : Rate Limiting (10 signalements / heure)

```bash
# Créer 11 signalements rapidement
for i in {1..11}; do
  curl -X POST http://localhost:5000/api/reports \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
      \"categoryId\": 1,
      \"title\": \"Signalement test $i\",
      \"description\": \"Description du signalement numéro $i pour tester le rate limiting\",
      \"address\": \"Adresse test $i\"
    }" && echo ""
done
```

**Résultat (11ème requête) :**
```json
{
  "success": false,
  "message": "Vous avez atteint la limite de 10 signalements par heure."
}
```

---

## 🔄 Workflow Complet Citoyen

### Scénario : Signaler un Nid de Poule

```bash
# 1. Se connecter
curl -X POST http://localhost:5000/api/auth/login/fingerprint \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "deviceFingerprint": "citizen-device-123",
    "fullName": "Jean Dupont"
  }'
# → Copier TOKEN

# 2. Voir les catégories disponibles
curl http://localhost:5000/api/reports/categories \
  -H "Authorization: Bearer $TOKEN"
# → Choisir categoryId: 1 (Route dégradée)

# 3. Créer le signalement
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "categoryId": 1,
    "title": "Nid de poule dangereux avenue Principale",
    "description": "Nid de poule profond au milieu de la voie, très dangereux pour les véhicules",
    "address": "Avenue Principale, devant la boulangerie",
    "latitude": 6.1320,
    "longitude": 1.2230
  }'
# → Noter reportId: 4

# 4. Uploader une photo
curl -X POST http://localhost:5000/api/reports/4/photos \
  -H "Authorization: Bearer $TOKEN" \
  -F "photo=@/chemin/vers/photo_nid_poule.jpg"

# 5. Vérifier le signalement
curl http://localhost:5000/api/reports/4 \
  -H "Authorization: Bearer $TOKEN"

# 6. Voir tous mes signalements
curl http://localhost:5000/api/reports/my-reports \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Vérification en Base de Données

### Voir les Signalements

```sql
SELECT
  r.id,
  r.title,
  r.status,
  r.priority_score,
  c.name as categorie,
  u.full_name as citoyen,
  r.created_at
FROM reports r
JOIN categories c ON r.category_id = c.id
JOIN users u ON r.citizen_id = u.id
ORDER BY r.id DESC;
```

---

### Voir les Photos

```sql
SELECT
  rp.id,
  rp.report_id,
  r.title,
  rp.photo_url,
  rp.upload_order
FROM report_photos rp
JOIN reports r ON rp.report_id = r.id
ORDER BY rp.report_id, rp.upload_order;
```

---

### Compter Signalements par Catégorie

```sql
SELECT
  c.name as categorie,
  COUNT(r.id) as nombre_signalements,
  SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END) as pending,
  SUM(CASE WHEN r.status = 'resolved' THEN 1 ELSE 0 END) as resolved
FROM categories c
LEFT JOIN reports r ON c.id = r.category_id
GROUP BY c.id, c.name
ORDER BY nombre_signalements DESC;
```

---

## ✅ Checklist de Validation

- [ ] Lister catégories
- [ ] Créer signalement
- [ ] Récupérer signalement
- [ ] Lister signalements
- [ ] Filtrer par statut
- [ ] Filtrer par catégorie
- [ ] Recherche par mot-clé
- [ ] Mes signalements
- [ ] Modifier signalement
- [ ] Supprimer signalement (pending)
- [ ] Upload photo
- [ ] Photos visibles
- [ ] Supprimer photo
- [ ] Statistiques
- [ ] Validation erreurs
- [ ] Rate limiting
- [ ] Ownership vérifié

---

**✅ Si tous ces tests passent, le CRUD Signalements est 100% fonctionnel !**

**Prochaine étape : Phase 4 - Système d'Appui**
