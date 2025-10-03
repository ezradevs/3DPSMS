const multer = require('multer');
const path = require('path');
const { ensureUploadsDir, uploadsDir } = require('../utils/files');

ensureUploadsDir();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname || '') || '.png';
    cb(null, `${unique}${extension}`);
  },
});

function fileFilter(_req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    cb(Object.assign(new Error('Only image uploads are allowed'), { status: 400 }));
    return;
  }
  cb(null, true);
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB
  },
});

module.exports = upload;
