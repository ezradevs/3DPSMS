const { Router } = require('express');
const { resetDatabase } = require('../db');
const { clearUploadsDirectory, ensureUploadsDir } = require('../utils/files');

const router = Router();

router.post('/reset', (_req, res, next) => {
  try {
    clearUploadsDirectory();
    ensureUploadsDir();
    resetDatabase();
    res.json({ message: 'Database and uploads reset successfully.' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
