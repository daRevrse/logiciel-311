# 🧪 Guide de Test - Logiciel 311

## 📋 Démarrage Rapide

### Étape 1: Configurer MySQL
```bash
# Créer la base de données
mysql -u root -p
CREATE DATABASE logiciel_311_dev;
EXIT;
```

### Étape 2: Backend
```bash
cd backend
npm install
copy .env.example .env
# Éditer .env avec vos informations MySQL
npm run db:migrate
npm start
```

### Étape 3: Frontend
```bash
cd frontend
npm install
npm run dev
```

### Étape 4: Accéder à l'application
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 🎯 Premier Test Simple

1. Ouvrir http://localhost:3000
2. Vous serez redirigé vers /login
3. Entrer votre nom et cliquer sur "Se connecter avec cet appareil"
4. Vous êtes connecté!

Pour plus de détails, voir les sections ci-dessous.
