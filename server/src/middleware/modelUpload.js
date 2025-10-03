const multer = require('multer');
const path = require('path');
const fs = require('fs');

const modelsDir = path.join(__dirname, '..', '..', 'uploads', 'models');

if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

const allowedExtensions = ['.stl', '.obj', '.3mf', '.amf', '.zip'];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, modelsDir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname || '') || '.stl';
    cb(null, `${unique}${extension}`);
  },
});

function fileFilter(_req, file, cb) {
  const extension = path.extname(file.originalname || '').toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    cb(Object.assign(new Error('Only STL/OBJ/3MF/AMF/ZIP files are allowed'), { status: 400 }));
    return;
  }
  cb(null, true);
}

const uploadModel = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
});

module.exports = {
  uploadModel,
  modelsDir,
  allowedExtensions,
};
