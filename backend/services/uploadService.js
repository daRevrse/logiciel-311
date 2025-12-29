const multer = require('multer');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

/**
 * Service d'upload de fichiers (photos)
 * Utilise Multer pour gérer les uploads
 */

class UploadService {
  constructor() {
    // Configuration du stockage
    this.storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'reports');

        // Créer le dossier s'il n'existe pas
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        // Format: municipalityId_reportId_timestamp_random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = `${req.municipalityId}_${req.params.reportId || 'temp'}_${uniqueSuffix}${ext}`;
        cb(null, filename);
      }
    });

    // Filtres de fichiers
    this.fileFilter = (req, file, cb) => {
      const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/jpg,image/png,image/webp').split(',');

      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`Type de fichier non autorisé. Formats acceptés: ${allowedTypes.join(', ')}`), false);
      }
    };

    // Configuration Multer
    this.upload = multer({
      storage: this.storage,
      fileFilter: this.fileFilter,
      limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB par défaut
        files: 5 // Maximum 5 fichiers à la fois
      }
    });
  }

  /**
   * Middleware pour upload d'une seule photo
   */
  single(fieldName = 'photo') {
    return this.upload.single(fieldName);
  }

  /**
   * Middleware pour upload multiple (max 5)
   */
  multiple(fieldName = 'photos', maxCount = 5) {
    return this.upload.array(fieldName, maxCount);
  }

  /**
   * Génère l'URL publique d'une photo
   * @param {string} filename
   * @returns {string}
   */
  getPhotoUrl(filename) {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
    return `${baseUrl}/uploads/reports/${filename}`;
  }

  /**
   * Supprime un fichier physique
   * @param {string} photoUrl
   * @returns {Promise<boolean>}
   */
  async deleteFile(photoUrl) {
    try {
      // Extraire le nom du fichier de l'URL
      const filename = path.basename(photoUrl);
      const filePath = path.join(__dirname, '..', 'uploads', 'reports', filename);

      // Vérifier si le fichier existe
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Fichier supprimé: ${filename}`);
        return true;
      }

      logger.warn(`Fichier non trouvé: ${filename}`);
      return false;
    } catch (error) {
      logger.error('Erreur suppression fichier:', error);
      throw error;
    }
  }

  /**
   * Valide une image (dimensions, taille, etc.)
   * @param {string} filePath
   * @returns {Promise<Object>}
   */
  async validateImage(filePath) {
    try {
      // TODO: Utiliser sharp ou jimp pour valider dimensions
      // Pour MVP, on vérifie juste l'existence

      const stats = fs.statSync(filePath);

      return {
        valid: true,
        size: stats.size,
        sizeFormatted: this.formatBytes(stats.size)
      };
    } catch (error) {
      logger.error('Erreur validation image:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Formate les bytes en format lisible
   * @param {number} bytes
   * @returns {string}
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Nettoie les fichiers temporaires (> 24h)
   * À exécuter via cron job
   */
  async cleanupTempFiles() {
    try {
      const uploadDir = path.join(__dirname, '..', 'uploads', 'reports');
      const files = fs.readdirSync(uploadDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 heures

      let deletedCount = 0;

      files.forEach(file => {
        const filePath = path.join(uploadDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;

        // Supprimer si plus de 24h et nom contient 'temp'
        if (age > maxAge && file.includes('temp')) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      });

      logger.info(`Nettoyage uploads: ${deletedCount} fichier(s) temporaire(s) supprimé(s)`);

      return deletedCount;
    } catch (error) {
      logger.error('Erreur nettoyage uploads:', error);
      throw error;
    }
  }
}

module.exports = new UploadService();
