const fs = require('fs');
const path = require('path');

const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

function ensureUploadsDir() {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
}

function toRelativeUploadPath(filename) {
  return path.posix.join('uploads', filename);
}

function resolveUploadPath(filePath) {
  if (!filePath) return null;
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  const trimmed = filePath.startsWith('uploads/')
    ? filePath.slice('uploads/'.length)
    : filePath;
  return path.join(uploadsDir, trimmed);
}

function deleteFileSafe(filePath) {
  const absolutePath = resolveUploadPath(filePath);
  if (!absolutePath) return;
  if (!absolutePath.startsWith(uploadsDir)) {
    return;
  }
  if (fs.existsSync(absolutePath)) {
    fs.unlinkSync(absolutePath);
  }
}

function clearUploadsDirectory() {
  ensureUploadsDir();
  const entries = fs.readdirSync(uploadsDir);
  entries.forEach(entry => {
    const target = path.join(uploadsDir, entry);
    const stats = fs.statSync(target);
    if (stats.isDirectory()) {
      fs.rmSync(target, { recursive: true, force: true });
    } else {
      fs.unlinkSync(target);
    }
  });
}

module.exports = {
  ensureUploadsDir,
  toRelativeUploadPath,
  deleteFileSafe,
  resolveUploadPath,
  clearUploadsDirectory,
  uploadsDir,
};
