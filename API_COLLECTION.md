# 📬 Collection API - Logiciel 311

Collection complète pour Postman / Thunder Client / Insomnia

---

## 🔧 Configuration Environnement

Créer un environnement avec ces variables :

```json
{
  "baseUrl": "http://localhost:5000",
  "municipalityId": 2,
  "superAdminToken": "",
  "adminToken": "",
  "citizenToken": "",
  "licenseKey": "DEMO-LOME-2025-0001",
  "testPhone": "+22890999999",
  "testFingerprint": "test-device-fingerprint-001"
}
```

---

## 📁 Dossier 1 : Health & Info

### 1.1 Health Check
```
GET {{baseUrl}}/health
```

### 1.2 API Info
```
GET {{baseUrl}}/
```

---

## 📁 Dossier 2 : Licences (Public)

### 2.1 Valider une Licence
```
POST {{baseUrl}}/api/licenses/validate
Content-Type: application/json

{
  "licenseKey": "{{licenseKey}}"
}
```

### 2.2 Activer une Licence
```
POST {{baseUrl}}/api/licenses/activate
Content-Type: application/json

{
  "licenseKey": "NEW-LICE-NSE-KEY1",
  "name": "Commune de Kara",
  "region": "Kara",
  "contactEmail": "contact@kara.tg",
  "contactPhone": "+22890555555",
  "address": "Centre-ville, Kara"
}
```

---

## 📁 Dossier 3 : Licences (Super Admin)

### 3.1 Générer une Licence
```
POST {{baseUrl}}/api/licenses/generate
Authorization: Bearer {{superAdminToken}}
Content-Type: application/json

{
  "municipalityName": "Commune de Sokodé",
  "contactEmail": "contact@sokode.tg",
  "contactPhone": "+22890777777",
  "durationYears": 1,
  "maxUsers": 500,
  "maxAdmins": 25,
  "features": {
    "notifications": true,
    "map": true,
    "statistics": true,
    "export": false
  }
}
```

### 3.2 Lister Toutes les Licences
```
GET {{baseUrl}}/api/licenses
Authorization: Bearer {{superAdminToken}}
```

### 3.3 Détails d'une Licence
```
GET {{baseUrl}}/api/licenses/2
Authorization: Bearer {{superAdminToken}}
```

### 3.4 Licences Expirantes
```
GET {{baseUrl}}/api/licenses/expiring
Authorization: Bearer {{superAdminToken}}
```

### 3.5 Renouveler une Licence
```
PUT {{baseUrl}}/api/licenses/2/renew
Authorization: Bearer {{superAdminToken}}
Content-Type: application/json

{
  "additionalYears": 1
}
```

### 3.6 Désactiver une Licence
```
PUT {{baseUrl}}/api/licenses/3/deactivate
Authorization: Bearer {{superAdminToken}}
```

### 3.7 Mettre à Jour Fonctionnalités
```
PUT {{baseUrl}}/api/licenses/2/features
Authorization: Bearer {{superAdminToken}}
Content-Type: application/json

{
  "features": {
    "notifications": true,
    "map": true,
    "statistics": true,
    "export": true
  }
}
```

---

## 📁 Dossier 4 : Authentification (Public)

### 4.1 Login Device Fingerprint (Nouveau)
```
POST {{baseUrl}}/api/auth/login/fingerprint
Content-Type: application/json

{
  "municipalityId": {{municipalityId}},
  "deviceFingerprint": "{{testFingerprint}}",
  "fullName": "Kokou Test"
}
```

**📝 Action après** : Copier `data.token` dans `{{citizenToken}}`

### 4.2 Login Device Fingerprint (Existant)
```
POST {{baseUrl}}/api/auth/login/fingerprint
Content-Type: application/json

{
  "municipalityId": {{municipalityId}},
  "deviceFingerprint": "{{testFingerprint}}"
}
```

### 4.3 Demander Code SMS
```
POST {{baseUrl}}/api/auth/request-code
Content-Type: application/json

{
  "municipalityId": {{municipalityId}},
  "phone": "{{testPhone}}"
}
```

**📝 Action après** : Noter le `devCode` dans les logs

### 4.4 Vérifier Code SMS
```
POST {{baseUrl}}/api/auth/verify-code
Content-Type: application/json

{
  "municipalityId": {{municipalityId}},
  "phone": "{{testPhone}}",
  "code": "123456",
  "fullName": "Amavi Test"
}
```

**📝 Action après** : Copier `data.token` dans `{{citizenToken}}`

### 4.5 Login Admin
```
POST {{baseUrl}}/api/auth/admin/login
Content-Type: application/json

{
  "municipalityId": {{municipalityId}},
  "phone": "+22890222222"
}
```

**📝 Action après** : Copier `data.token` dans `{{adminToken}}`

---

## 📁 Dossier 5 : Authentification (Protégé)

### 5.1 Mon Profil
```
GET {{baseUrl}}/api/auth/profile
Authorization: Bearer {{citizenToken}}
```

### 5.2 Mettre à Jour Profil
```
PUT {{baseUrl}}/api/auth/profile
Authorization: Bearer {{citizenToken}}
Content-Type: application/json

{
  "fullName": "Kokou Mensah Modifié",
  "email": "kokou@email.tg"
}
```

### 5.3 Vérifier Token
```
GET {{baseUrl}}/api/auth/verify-token
Authorization: Bearer {{citizenToken}}
```

### 5.4 Déconnexion
```
POST {{baseUrl}}/api/auth/logout
Authorization: Bearer {{citizenToken}}
```

---

## 📁 Dossier 6 : Signalements (À venir - Phase 3)

### 6.1 Créer un Signalement
```
POST {{baseUrl}}/api/reports
Authorization: Bearer {{citizenToken}}
Content-Type: application/json

{
  "categoryId": 1,
  "title": "Nid de poule avenue de la Libération",
  "description": "Gros nid de poule dangereux pour les véhicules",
  "address": "Avenue de la Libération, près du rond-point",
  "latitude": 6.1319,
  "longitude": 1.2228
}
```

### 6.2 Lister Mes Signalements
```
GET {{baseUrl}}/api/reports/my-reports
Authorization: Bearer {{citizenToken}}
```

### 6.3 Lister Tous les Signalements (Citoyen)
```
GET {{baseUrl}}/api/reports?status=pending&sort=priority
Authorization: Bearer {{citizenToken}}
```

### 6.4 Détails d'un Signalement
```
GET {{baseUrl}}/api/reports/1
Authorization: Bearer {{citizenToken}}
```

### 6.5 Modifier Mon Signalement
```
PUT {{baseUrl}}/api/reports/1
Authorization: Bearer {{citizenToken}}
Content-Type: application/json

{
  "title": "Titre modifié",
  "description": "Description modifiée"
}
```

### 6.6 Supprimer Mon Signalement
```
DELETE {{baseUrl}}/api/reports/1
Authorization: Bearer {{citizenToken}}
```

### 6.7 Upload Photo
```
POST {{baseUrl}}/api/reports/1/photos
Authorization: Bearer {{citizenToken}}
Content-Type: multipart/form-data

photo: [fichier image]
```

---

## 📁 Dossier 7 : Appuis (À venir - Phase 4)

### 7.1 Ajouter mon Appui
```
POST {{baseUrl}}/api/reports/1/support
Authorization: Bearer {{citizenToken}}
```

### 7.2 Retirer mon Appui
```
DELETE {{baseUrl}}/api/reports/1/support
Authorization: Bearer {{citizenToken}}
```

### 7.3 Voir les Appuis d'un Signalement
```
GET {{baseUrl}}/api/reports/1/supports
Authorization: Bearer {{citizenToken}}
```

---

## 📁 Dossier 8 : Admin (À venir - Phase 5)

### 8.1 Dashboard Statistiques
```
GET {{baseUrl}}/api/admin/dashboard
Authorization: Bearer {{adminToken}}
```

### 8.2 Changer Statut Signalement
```
PUT {{baseUrl}}/api/admin/reports/1/status
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "status": "in_progress",
  "adminNotes": "Équipe envoyée sur place"
}
```

### 8.3 Résoudre Signalement
```
PUT {{baseUrl}}/api/admin/reports/1/resolve
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "resolutionNotes": "Nid de poule réparé le 27/01/2025"
}
```

### 8.4 Rejeter Signalement
```
PUT {{baseUrl}}/api/admin/reports/1/reject
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "resolutionNotes": "Signalement en doublon avec #123"
}
```

### 8.5 Gérer Catégories - Liste
```
GET {{baseUrl}}/api/admin/categories
Authorization: Bearer {{adminToken}}
```

### 8.6 Gérer Catégories - Créer
```
POST {{baseUrl}}/api/admin/categories
Authorization: Bearer {{adminToken}}
Content-Type: application/json

{
  "name": "Éclairage public",
  "description": "Problèmes de lampadaires",
  "icon": "light",
  "color": "#F59E0B"
}
```

---

## 📁 Dossier 9 : Notifications (À venir - Phase 6)

### 9.1 Mes Notifications
```
GET {{baseUrl}}/api/notifications
Authorization: Bearer {{citizenToken}}
```

### 9.2 Notifications Non Lues
```
GET {{baseUrl}}/api/notifications/unread
Authorization: Bearer {{citizenToken}}
```

### 9.3 Marquer comme Lu
```
PUT {{baseUrl}}/api/notifications/1/read
Authorization: Bearer {{citizenToken}}
```

### 9.4 Marquer Toutes comme Lues
```
PUT {{baseUrl}}/api/notifications/read-all
Authorization: Bearer {{citizenToken}}
```

---

## 🧪 Tests Rapides

### Workflow Complet Citoyen

**1. Login**
```bash
# Générer token
POST /api/auth/login/fingerprint
→ Copier token
```

**2. Voir Catégories** (Phase 3)
```bash
GET /api/categories
```

**3. Créer Signalement** (Phase 3)
```bash
POST /api/reports
```

**4. Upload Photo** (Phase 3)
```bash
POST /api/reports/:id/photos
```

**5. Appuyer Signalement** (Phase 4)
```bash
POST /api/reports/:id/support
```

---

## 📝 Scripts Pre-request (Postman)

### Générer Token Super Admin
```javascript
// Dans Tests d'un endpoint auth
if (pm.response.code === 200) {
    const token = pm.response.json().data.token;
    pm.environment.set("superAdminToken", token);
}
```

### Auto-refresh Token
```javascript
// Dans Pre-request Script
const token = pm.environment.get("citizenToken");
if (!token || isTokenExpired(token)) {
    // Relogin automatique
    pm.sendRequest({
        url: pm.environment.get("baseUrl") + "/api/auth/login/fingerprint",
        method: 'POST',
        header: {'Content-Type': 'application/json'},
        body: {
            mode: 'raw',
            raw: JSON.stringify({
                municipalityId: pm.environment.get("municipalityId"),
                deviceFingerprint: pm.environment.get("testFingerprint")
            })
        }
    }, (err, res) => {
        pm.environment.set("citizenToken", res.json().data.token);
    });
}
```

---

## 🎯 Import Collection

### Format Thunder Client

Créer un fichier `thunder-collection.json` :

```json
{
  "clientName": "Thunder Client",
  "collectionName": "Logiciel 311",
  "requests": [
    {
      "name": "Health Check",
      "method": "GET",
      "url": "{{baseUrl}}/health"
    },
    {
      "name": "Login Fingerprint",
      "method": "POST",
      "url": "{{baseUrl}}/api/auth/login/fingerprint",
      "body": {
        "municipalityId": "{{municipalityId}}",
        "deviceFingerprint": "{{testFingerprint}}",
        "fullName": "Test User"
      }
    }
  ]
}
```

---

## ✅ Checklist Tests

- [ ] Health check
- [ ] Valider licence
- [ ] Login fingerprint
- [ ] Login SMS
- [ ] Login admin
- [ ] Profil CRUD
- [ ] Générer licence (super admin)
- [ ] Lister licences (super admin)
- [ ] Renouveler licence
- [ ] Rate limiting auth

---

**💡 Astuce** : Utiliser les environnements pour basculer entre dev/staging/prod facilement !
