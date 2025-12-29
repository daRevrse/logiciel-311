const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Format personnalisé pour les logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // Ajouter les métadonnées si présentes
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }

    // Ajouter la stack trace pour les erreurs
    if (stack) {
      log += `\n${stack}`;
    }

    return log;
  })
);

// Configuration de rotation quotidienne
const dailyRotateTransport = new DailyRotateFile({
  filename: path.join(process.env.LOG_DIR || 'logs', 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m', // Taille max par fichier
  maxFiles: '14d', // Conserver 14 jours
  format: logFormat
});

// Configuration des erreurs séparées
const errorRotateTransport = new DailyRotateFile({
  filename: path.join(process.env.LOG_DIR || 'logs', 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d', // Conserver 30 jours pour erreurs
  level: 'error',
  format: logFormat
});

// Créer le logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    dailyRotateTransport,
    errorRotateTransport
  ],
  // Gestion des rejections/exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || 'logs', 'exceptions.log')
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.env.LOG_DIR || 'logs', 'rejections.log')
    })
  ]
});

// En développement, logger aussi dans la console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Méthodes utilitaires
logger.logRequest = (req, message = 'Requête reçue') => {
  logger.info(message, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    municipalityId: req.municipalityId,
    userId: req.user?.id
  });
};

logger.logError = (error, req = null) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    ...(req && {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      municipalityId: req.municipalityId,
      userId: req.user?.id
    })
  };

  logger.error('Erreur détectée', errorInfo);
};

module.exports = logger;
