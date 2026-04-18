require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const logger = require('./utils/logger');

// Initialisation de l'application
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARES GLOBAUX
// ============================================

// CORS - Configuration sécurisée
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    // Autoriser les requêtes sans origin (comme mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Logger HTTP - Log toutes les requêtes
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// ============================================
// ROUTES DE SANTÉ
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'API Logiciel 311 - Signalement Citoyen Togo',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// ============================================
// ROUTES API
// ============================================

// Import des routes
const licenseRoutes = require('./routes/license.routes');
const authRoutes = require('./routes/auth.routes');
const reportRoutes = require('./routes/report.routes');
const supportRoutes = require('./routes/support.routes');
const adminRoutes = require('./routes/admin.routes');
const agentAdminRoutes = require('./routes/agent-admin.routes');
const notificationRoutes = require('./routes/notification.routes');
const publicRoutes = require('./routes/public.routes');

// Monter les routes
app.use('/api/public', publicRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', supportRoutes);
app.use('/api/admin/agents', agentAdminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// ============================================
// GESTION DES ERREURS
// ============================================

// Route 404
app.use((req, res) => {
  logger.warn(`Route non trouvée: ${req.method} ${req.path}`);
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
    path: req.path
  });
});

// Gestionnaire d'erreurs global
app.use((err, req, res, next) => {
  logger.logError(err, req);

  // Ne pas exposer les détails en production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur interne',
    ...(isDevelopment && { stack: err.stack })
  });
});

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================

const startServer = async () => {
  try {
    // Tester la connexion à la base de données
    const { sequelize } = require('./models');
    await sequelize.authenticate();
    logger.info('✓ Connexion à la base de données établie');

    app.listen(PORT, () => {
      logger.info(`🚀 Serveur démarré sur le port ${PORT}`);
      logger.info(`📍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('❌ Erreur au démarrage du serveur:', error);
    process.exit(1);
  }
};

// Gestion des signaux d'arrêt
process.on('SIGTERM', () => {
  logger.info('Signal SIGTERM reçu - Arrêt gracieux du serveur...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Signal SIGINT reçu - Arrêt gracieux du serveur...');
  process.exit(0);
});

// Démarrer le serveur
startServer();

module.exports = app;
