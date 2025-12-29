# 🚀 Guide de Démarrage Rapide

## Prérequis
- Node.js 18+
- MySQL 8.0+
- npm

## Installation en 5 étapes

### 1️⃣ MySQL - Créer la base de données
```bash
mysql -u root -p
```
```sql
CREATE DATABASE logiciel_311_dev;
EXIT;
```

### 2️⃣ Backend - Configuration
```bash
cd backend
npm install
copy .env.example .env
```

Éditer `.env` - Minimum requis:
```env
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=logiciel_311_dev
JWT_SECRET=changez_moi_123456789
PORT=5000
```

### 3️⃣ Backend - Migrations et démarrage
```bash
npm run db:migrate
npm start
```
Vous devriez voir: `Server running on port 5000`

### 4️⃣ Frontend - Configuration (nouveau terminal)
```bash
cd frontend
npm install
npm run dev
```
Vous devriez voir: `Local: http://localhost:3000/`

### 5️⃣ Test - Ouvrir l'application
Ouvrir: **http://localhost:3000**

## ✅ Premier test

1. Vous serez redirigé vers `/login`
2. Entrer votre nom (ex: "Jean Dupont")  
3. Cliquer "Se connecter avec cet appareil"
4. Vous êtes connecté! 🎉

## 📝 Créer des données de test

### Option A: Via script SQL
```bash
mysql -u root -p logiciel_311_dev
```
```sql
-- Municipalité
INSERT INTO municipalities (name, contact_email, contact_phone, address, created_at, updated_at)
VALUES ('Lomé', 'contact@lome.tg', '+228 90 00 00 00', 'Lomé, Togo', NOW(), NOW());

-- License
INSERT INTO licenses (municipality_id, license_key, status, start_date, end_date, max_users, max_reports_per_month, features, created_at, updated_at)
VALUES (1, 'LOME-2024-ABCD-1234', 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), 1000, 5000, '{"notifications": true}', NOW(), NOW());

-- Catégorie
INSERT INTO categories (municipality_id, name, description, icon, color, created_at, updated_at)
VALUES (1, 'Voirie', 'Routes et trottoirs', 'road', '#3B82F6', NOW(), NOW());
```

### Option B: Via API (Postman/curl)

**1. Créer un admin:**
```bash
curl -X POST http://localhost:5000/api/auth/admin/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@lome.tg\",\"password\":\"Admin123!\",\"full_name\":\"Admin Lomé\",\"municipality_id\":1,\"role\":\"admin\"}"
```

**2. Se connecter:**
```bash
curl -X POST http://localhost:5000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@lome.tg\",\"password\":\"Admin123!\"}"
```

Copier le `token` reçu.

**3. Créer un signalement:**
```bash
curl -X POST http://localhost:5000/api/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -d "{\"title\":\"Test signalement\",\"description\":\"Description test\",\"address\":\"Lomé\",\"category_id\":1}"
```

## 🔍 Vérifications

### Backend OK?
```bash
curl http://localhost:5000
```
Doit retourner du JSON avec "status": "running"

### Frontend OK?
Ouvrir http://localhost:3000 - doit afficher la page de connexion

### Base de données OK?
```bash
mysql -u root -p logiciel_311_dev -e "SHOW TABLES;"
```
Doit afficher ~10 tables

## ⚠️ Problèmes courants

### "Cannot connect to database"
- Vérifier MySQL démarré
- Vérifier mot de passe dans `.env`

### "Port 5000 already in use"  
Changer PORT dans backend/.env

### Page blanche frontend
- F12 pour voir les erreurs
- Vérifier que backend est démarré

## 📚 Documentation complète

- **Backend**: Voir `backend/PHASE*_TESTING.md`
- **Frontend**: Voir `frontend/FRONTEND_COMPLETE.md`  
- **Projet**: Voir `PROJECT_STATUS.md`

## 🎯 Prochaines étapes

1. ✅ Créer des signalements
2. ✅ Tester les appuis
3. ✅ Tester l'interface admin
4. ✅ Configurer les notifications email

Bon test! 🚀
