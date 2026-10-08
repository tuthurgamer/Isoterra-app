const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');

// Journal photos (from a bac's page, the Journal or the gallery), stored in
// public/uploads/photos with their thumbnails, made on the phone, next to
// them. See lib/photos.js.
const photoDir = path.join(__dirname, '..', 'public', 'uploads', 'photos');
fs.mkdirSync(photoDir, { recursive: true });

const uploadPhoto = multer({
  storage: multer.diskStorage({
    destination: photoDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    }
  }),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, /^image\//.test(file.mimetype))
});

// Several photos at once: "photo" (the photos), "photo_thumb" (their
// thumbnails, in the same order) and, in the body, "photo_meta".
const uploadPhotos = uploadPhoto.fields([{ name: 'photo', maxCount: 30 }, { name: 'photo_thumb', maxCount: 30 }]);

module.exports = { uploadPhotos, photoDir };
