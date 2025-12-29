# 🔐 Guide de Test - Authentification

Tests complets du système d'authentification (Phase 2).

---

## 📋 Prérequis

1. ✅ Serveur démarré (`npm run dev`)
2. ✅ Données de test chargées (`npm run seed`)
3. ✅ Municipalité de Lomé créée (ID: 2)

---

## 🎯 Méthodes d'Authentification Disponibles

### 1. Device Fingerprinting (MVP - Recommandé)
- ✅ Simple et rapide
- ✅ Pas besoin de SMS
- ✅ Parfait pour MVP
- ⚠️ Moins sécurisé (OK pour signalements citoyens)

### 2. Téléphone + SMS
- ✅ Plus sécurisé
- ✅ Vérification utilisateur réel
- ⚠️ Nécessite intégration SMS (à venir)
- 💡 Code visible en dev pour tests

### 3. Admin (avec mot de passe)
- ✅ Pour administrateurs
- ⚠️ Hash password à implémenter
- 💡 Pour MVP, utilise juste téléphone

---

## 🧪 Tests : Méthode 1 - Device Fingerprinting

### Test 1.1 : Première Connexion (Nouveau Citoyen)

```bash
curl -X POST http://localhost:5000/api/auth/login/fingerprint \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "deviceFingerprint": "unique-device-fingerprint-001",
    "fullName": "Kokou Mensah"
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Compte créé avec succès",
  "data": {
    "user": {
      "id": 6,
      "fullName": "Kokou Mensah",
      "role": "citizen",
      "municipalityId": 2
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "isNewUser": true
  }
}
```

**📝 Copiez le token retourné !**

---

### Test 1.2 : Reconnexion (Utilisateur Existant)

Même fingerprint = même utilisateur :

```bash
curl -X POST http://localhost:5000/api/auth/login/fingerprint \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "deviceFingerprint": "unique-device-fingerprint-001"
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": 6,
      "fullName": "Kokou Mensah",
      "role": "citizen",
      "municipalityId": 2
    },
    "token": "eyJhbGciOi...",
    "isNewUser": false
  }
}
```

---

### Test 1.3 : Vérifier le Token

```bash
curl http://localhost:5000/api/auth/verify-token \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Token valide",
  "data": {
    "userId": 6,
    "municipalityId": 2,
    "role": "citizen"
  }
}
```

---

### Test 1.4 : Récupérer le Profil

```bash
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "fullName": "Kokou Mensah",
    "phone": null,
    "email": null,
    "role": "citizen",
    "isActive": true,
    "lastLogin": "2025-01-27T...",
    "municipality": {
      "id": 2,
      "name": "Commune de Lomé",
      "region": "Maritime",
      "logoUrl": null
    },
    "createdAt": "2025-01-27T..."
  }
}
```

---

### Test 1.5 : Mettre à Jour le Profil

```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -d '{
    "fullName": "Kokou Mensah Jr.",
    "email": "kokou@email.tg"
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Profil mis à jour",
  "data": {
    "id": 6,
    "fullName": "Kokou Mensah Jr.",
    "email": "kokou@email.tg"
  }
}
```

---

## 📱 Tests : Méthode 2 - Téléphone + SMS

### Test 2.1 : Demander un Code de Vérification

```bash
curl -X POST http://localhost:5000/api/auth/request-code \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "phone": "+22890999999"
  }'
```

**Résultat attendu (DEV) :**
```json
{
  "success": true,
  "message": "Code de vérification envoyé au +22890999999",
  "data": {
    "isNewUser": true,
    "devCode": "123456"
  }
}
```

**📝 En production, `devCode` n'apparaît pas. Le code est envoyé par SMS.**

**📋 Logs serveur :**
```
info: 📱 CODE SMS pour +22890999999: 123456
```

---

### Test 2.2 : Vérifier le Code et Connecter

```bash
curl -X POST http://localhost:5000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "phone": "+22890999999",
    "code": "123456",
    "fullName": "Amavi Koffi"
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Compte créé avec succès",
  "data": {
    "user": {
      "id": 7,
      "fullName": "Amavi Koffi",
      "phone": "+22890999999",
      "role": "citizen",
      "municipalityId": 2
    },
    "token": "eyJhbGciOi...",
    "isNewUser": true
  }
}
```

---

### Test 2.3 : Reconnexion avec Même Téléphone

```bash
# 1. Redemander un code
curl -X POST http://localhost:5000/api/auth/request-code \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "phone": "+22890999999"
  }'

# 2. Vérifier le nouveau code
curl -X POST http://localhost:5000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "phone": "+22890999999",
    "code": "654321"
  }'
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "Connexion réussie",
  "data": {
    "user": {
      "id": 7,
      "fullName": "Amavi Koffi",
      "phone": "+22890999999",
      "role": "citizen",
      "municipalityId": 2
    },
    "token": "eyJhbGciOi...",
    "isNewUser": false
  }
}
```

---

## 👨‍💼 Tests : Login Admin

### Test 3.1 : Login Admin Lomé

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
      "phone": "+22890222222",
      "role": "admin",
      "municipalityId": 2
    },
    "token": "eyJhbGciOi..."
  }
}
```

---

### Test 3.2 : Login Super Admin

```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 1,
    "phone": "+22890000000"
  }'
```

---

## ❌ Tests d'Erreurs

### Erreur 1 : Municipality ID Manquant

```bash
curl -X POST http://localhost:5000/api/auth/login/fingerprint \
  -H "Content-Type: application/json" \
  -d '{
    "deviceFingerprint": "test-device"
  }'
```

**Résultat :**
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [
    {
      "msg": "ID municipalité invalide",
      "param": "municipalityId"
    }
  ]
}
```

---

### Erreur 2 : Format Téléphone Invalide

```bash
curl -X POST http://localhost:5000/api/auth/request-code \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "phone": "123"
  }'
```

**Résultat :**
```json
{
  "success": false,
  "message": "Erreur de validation",
  "errors": [
    {
      "msg": "Format téléphone invalide",
      "param": "phone"
    }
  ]
}
```

---

### Erreur 3 : Code SMS Invalide

```bash
curl -X POST http://localhost:5000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "phone": "+22890999999",
    "code": "000000"
  }'
```

**Résultat :**
```json
{
  "success": false,
  "message": "Code invalide ou expiré"
}
```

---

### Erreur 4 : Code Expiré (> 10 minutes)

Attendre 10 minutes après avoir demandé un code, puis essayer de le vérifier.

**Résultat :**
```json
{
  "success": false,
  "message": "Code invalide ou expiré"
}
```

---

### Erreur 5 : Token Manquant

```bash
curl http://localhost:5000/api/auth/profile
```

**Résultat :**
```json
{
  "success": false,
  "message": "Token d'authentification manquant"
}
```

---

### Erreur 6 : Token Invalide

```bash
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer token_invalide_123"
```

**Résultat :**
```json
{
  "success": false,
  "message": "Token invalide"
}
```

---

### Erreur 7 : Licence Expirée

Désactiver la licence de Lomé :

```sql
UPDATE licenses SET is_active = 0 WHERE id = 2;
```

Puis essayer de se connecter :

```bash
curl -X POST http://localhost:5000/api/auth/login/fingerprint \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "deviceFingerprint": "test-device"
  }'
```

**Résultat :**
```json
{
  "success": false,
  "message": "Licence invalide ou expirée pour cette municipalité"
}
```

**🔧 Réactiver la licence :**
```sql
UPDATE licenses SET is_active = 1 WHERE id = 2;
```

---

## 🔒 Tests Rate Limiting

### Test Rate Limit Auth (5 tentatives / 15 min)

Faire 6 requêtes rapides :

```bash
for i in {1..6}; do
  curl -X POST http://localhost:5000/api/auth/login/fingerprint \
    -H "Content-Type: application/json" \
    -d '{"municipalityId": 2, "deviceFingerprint": "test-'$i'"}' \
    && echo ""
done
```

**Résultat attendu (6ème requête) :**
```json
{
  "success": false,
  "message": "Trop de tentatives de connexion. Compte temporairement bloqué."
}
```

---

## 📊 Vérification en Base de Données

### Voir les Nouveaux Utilisateurs

```sql
SELECT
  id,
  full_name,
  phone,
  device_fingerprint,
  role,
  last_login,
  created_at
FROM users
WHERE municipality_id = 2
ORDER BY id DESC;
```

---

### Voir les Codes de Vérification Actifs

```sql
SELECT
  id,
  phone,
  verification_code,
  verification_expires_at,
  TIMESTAMPDIFF(MINUTE, NOW(), verification_expires_at) as minutes_restantes
FROM users
WHERE verification_code IS NOT NULL
  AND verification_expires_at > NOW();
```

---

### Voir les Activity Logs

```sql
SELECT
  action,
  user_id,
  ip_address,
  created_at
FROM activity_logs
WHERE action IN ('login_fingerprint', 'verify_code_login', 'admin_login')
ORDER BY created_at DESC
LIMIT 10;
```

---

## ✅ Checklist de Validation

- [ ] Login fingerprint nouveau utilisateur
- [ ] Login fingerprint utilisateur existant
- [ ] Demande code SMS
- [ ] Vérification code SMS (nouveau)
- [ ] Vérification code SMS (existant)
- [ ] Login admin
- [ ] Récupération profil
- [ ] Mise à jour profil
- [ ] Vérification token
- [ ] Déconnexion
- [ ] Erreurs validation correctes
- [ ] Rate limiting fonctionne
- [ ] Licence vérifiée à chaque login
- [ ] Logs créés dans activity_logs
- [ ] Codes SMS expirés rejetés

---

## 🔄 Workflow Complet Citoyen

### Scénario 1 : Nouveau Citoyen (Device Fingerprinting)

```bash
# 1. Première visite sur l'app
# Frontend génère fingerprint côté client

# 2. Connexion
curl -X POST http://localhost:5000/api/auth/login/fingerprint \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "deviceFingerprint": "generated-fingerprint-abc123",
    "fullName": "Nouveau Citoyen"
  }'

# 3. Sauvegarder le token côté client
TOKEN="eyJhbGciOi..."

# 4. Utiliser le token pour les requêtes
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Scénario 2 : Nouveau Citoyen (SMS)

```bash
# 1. Demander un code
curl -X POST http://localhost:5000/api/auth/request-code \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "phone": "+22890888888"
  }'

# 2. Récupérer le code (en dev, visible dans réponse)
# En production, arrive par SMS

# 3. Vérifier et créer compte
curl -X POST http://localhost:5000/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{
    "municipalityId": 2,
    "phone": "+22890888888",
    "code": "123456",
    "fullName": "Nouveau Citoyen SMS"
  }'

# 4. Sauvegarder le token
TOKEN="eyJhbGciOi..."
```

---

## 🎯 Prochaines Étapes

Avec l'authentification fonctionnelle, tu peux maintenant :

1. **Créer des signalements** (Phase 3)
2. **Ajouter des appuis** (Phase 4)
3. **Dashboard admin** (Phase 5)

**✅ L'authentification est 100% opérationnelle !**

---

**💡 Astuce** : Utilise Postman/Thunder Client pour sauvegarder les tokens et faciliter les tests !
