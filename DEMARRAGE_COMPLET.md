# 🚀 Guide de Démarrage Complet - Logiciel 311

## ✅ Statut: Backend Fonctionnel!

Le backend démarre maintenant correctement et répond sur le port 5000.

---

## 📋 Étape 1: Créer les Données de Test

Exécutez le script SQL pour créer la municipalité, la license et les catégories:

```bash
mysql -u root -p logiciel_311_dev < backend/seed-test-data.sql
```

Ou manuellement via MySQL:

```sql
mysql -u root -p
USE logiciel_311_dev;

-- Municipalité
INSERT INTO municipalities (name, contact_email, contact_phone, address, created_at, updated_at)
VALUES ('Lomé', 'contact@lome.tg', '+228 90 00 00 00', 'Lomé, Togo', NOW(), NOW());

-- License
INSERT INTO licenses (municipality_id, license_key, status, start_date, end_date, max_users, max_reports_per_month, features, created_at, updated_at)
VALUES (1, 'LOME-2024-ABCD-1234', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 1000, 5000, '{"notifications": true}', NOW(), NOW());

UPDATE municipalities SET license_id = 1 WHERE id = 1;

-- Catégories
INSERT INTO categories (municipality_id, name, description, icon, color, created_at, updated_at) VALUES
(1, 'Voirie', 'Routes et trottoirs', 'road', '#3B82F6', NOW(), NOW()),
(1, 'Éclairage', 'Lampadaires', 'lightbulb', '#F59E0B', NOW(), NOW()),
(1, 'Propreté', 'Ordures et déchets', 'trash', '#10B981', NOW(), NOW());

EXIT;
```

---

## 📋 Étape 2: Démarrer le Backend

Le backend est déjà démarré! Si vous devez le redémarrer:

```bash
cd backend
npm start
```

Vous verrez:
```
✓ Connexion à la base de données établie
🚀 Serveur démarré sur le port 5000
```

Test:
```bash
curl http://localhost:5000
```

---

## 📋 Étape 3: Démarrer le Frontend

Dans un **nouveau terminal**:

```bash
cd frontend
npm run dev
```

Ouvrez votre navigateur: **http://localhost:3000**

---

## 🎯 Étape 4: Premier Test - Connexion Citoyenne

1. Vous serez automatiquement redirigé vers `/login`
2. L'option **"Appareil"** est sélectionnée par défaut
3. Entrez votre nom (ex: "Jean Dupont")
4. Cliquez sur **"Se connecter avec cet appareil"**
5. ✅ Vous êtes connecté!

### Ce qui se passe:
- Un hash SHA-256 unique de votre navigateur est généré
- Un nouveau compte citoyen est créé automatiquement
- Vous êtes authentifié avec un token JWT

---

## 📋 Étape 5: Créer un Signalement (via API pour le moment)

La page de création de signalement n'est pas encore développée dans le frontend. Utilisez l'API:

### 1. Se connecter en tant que citoyen

```bash
curl -X POST http://localhost:5000/api/auth/login/fingerprint \
  -H "Content-Type: application/json" \
  -d "{\"municipalityId\":1,\"deviceFingerprint\":\"test-device-123\",\"fullName\":\"Marie Koffi\"}"
```

Copiez le `token` de la réponse.

### 2. Créer un signalement

```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -d "{\"title\":\"Nid de poule Boulevard de la République\",\"description\":\"Grand nid de poule dangereux\",\"address\":\"Boulevard de la République, Lomé\",\"latitude\":6.1256,\"longitude\":1.2254,\"category_id\":1}"
```

### 3. Lister les signalements

```bash
curl -H "Authorization: Bearer VOTRE_TOKEN_ICI" http://localhost:5000/api/reports
```

---

## 📋 Étape 6: Créer un Administrateur

Via l'API:

```bash
curl -X POST http://localhost:5000/api/auth/admin/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@lome.tg\",\"password\":\"Admin123!\",\"full_name\":\"Admin Lomé\",\"municipality_id\":1,\"role\":\"admin\"}"
```

### Se connecter en tant qu'admin:

```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@lome.tg\",\"password\":\"Admin123!\"}"
```

---

## 🔍 Vérifications

### Backend fonctionne?
```bash
curl http://localhost:5000
# Doit retourner: {"message":"API Logiciel 311 - Signalement Citoyen Togo",...}
```

### Base de données OK?
```bash
mysql -u root -p logiciel_311_dev -e "SELECT COUNT(*) as total FROM municipalities;"
# Doit retourner: total = 1
```

### Frontend fonctionne?
Ouvrir: http://localhost:3000
Vous devriez voir la page de connexion

---

## ⚠️ Problèmes Courants

### Port 5000 déjà utilisé

```bash
# Windows
netstat -ano | findstr :5000
taskkill //F //PID <PID>

# Linux/Mac
lsof -i :5000
kill -9 <PID>
```

### Backend crash immédiatement

Vérifiez les logs:
```bash
tail -50 backend/logs/exceptions.log
```

### "Cannot connect to database"

Vérifiez:
1. MySQL est démarré
2. Le mot de passe dans `backend/.env` est correct
3. La base de données `logiciel_311_dev` existe

---

## 📚 Prochaines Étapes

### Pages Frontend à Développer (Phase 8)

1. **CreateReport.jsx** - Formulaire de création de signalement
2. **EditReport.jsx** - Modification de signalement
3. **MyReports.jsx** - Liste des signalements du citoyen
4. **Settings.jsx** - Paramètres utilisateur
5. **AdminReports.jsx** - Gestion admin des signalements
6. **AdminReportDetail.jsx** - Détail admin avec actions

### Fonctionnalités à Ajouter

1. **Carte interactive** (Leaflet ou Mapbox)
2. **Upload de photos** avec prévisualisation
3. **Notifications en temps réel**
4. **Export CSV/PDF**
5. **Graphiques** avec Chart.js

---

## 📖 Documentation

- **Backend**: Voir `backend/PHASE*_TESTING.md`
- **Frontend**: Voir `frontend/FRONTEND_COMPLETE.md`
- **Projet**: Voir `PROJECT_STATUS.md`
- **API**: Voir chaque `PHASE*_TESTING.md` pour les endpoints

---

## ✅ Résumé

- ✅ Backend démarré et fonctionnel
- ✅ Base de données créée et migrée
- ✅ Données de test disponibles
- ✅ Frontend démarré
- ✅ Connexion citoyenne fonctionnelle
- 🔨 Pages de création de signalement à développer

**L'application est prête pour les tests de base!** 🎉

Pour toute question, consultez les fichiers de documentation ou les logs d'erreur.

---

**Bon test!** 🚀
