/**
 * Middleware d'upload d'images de branding municipalité.
 * Fournit deux instances Multer configurées :
 *  - logoUpload   : champ "logo",   max 2 MB, sauvegardé sous logo.<ext>
 *  - bannerUpload : champ "banner", max 5 MB, sauvegardé sous banner.<ext>
 *
 * Destination : backend/uploads/municipalities/:municipality_id/
 * (municipality_id est pris sur req.municipalityId, injecté par authenticateToken).
 *
 * Le nettoyage des anciens fichiers (extensions différentes) est effectué dans
 * le contrôleur après succès de l'écriture.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const ALLOWED_MIMETYPES = [
  'image/png',
  'image/jpeg'
];

const EXT_BY_MIMETYPE = {
  'image/png': '.png',
  'image/jpeg': '.jpg'
};

/**
 * Wrap a multer middleware to normalize error responses.
 * - multer.MulterError -> 400 { success:false, code, message }
 * - other errors       -> 400 { success:false, message }
 */
function handleMulterErrors(mw) {
  return (req, res, next) => {
    mw(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          code: err.code,
          message: err.message
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message
      });
    });
  };
}

function buildStorage(baseFilename) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const municipalityId = req.municipalityId;
      if (!municipalityId) {
        return cb(new Error('municipalityId manquant sur la requête'));
      }
      const dir = path.join(
        __dirname,
        '..',
        'uploads',
        'municipalities',
        String(municipalityId)
      );
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext =
        EXT_BY_MIMETYPE[file.mimetype] ||
        path.extname(file.originalname).toLowerCase() ||
        '';
      cb(null, `${baseFilename}${ext}`);
    }
  });
}

function fileFilter(req, file, cb) {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    return cb(null, true);
  }
  cb(
    new Error(
      `Type de fichier non autorisé. Formats acceptés : ${ALLOWED_MIMETYPES.join(', ')}`
    ),
    false
  );
}

const logoUpload = multer({
  storage: buildStorage('logo'),
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2 MB
});

const bannerUpload = multer({
  storage: buildStorage('banner'),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

module.exports = {
  logoUpload,
  bannerUpload,
  ALLOWED_MIMETYPES,
  handleMulterErrors
};
