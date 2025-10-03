const { Router } = require('express');
const filamentService = require('../services/filamentService');

const router = Router();

router.get('/spools', (_req, res, next) => {
  try {
    const spools = filamentService.listSpools();
    res.json(spools);
  } catch (error) {
    next(error);
  }
});

router.get('/spools/:id', (req, res, next) => {
  try {
    const spool = filamentService.getSpoolById(Number(req.params.id));
    if (!spool) {
      res.status(404).json({ message: 'Spool not found' });
      return;
    }
    res.json(spool);
  } catch (error) {
    next(error);
  }
});

router.post('/spools', (req, res, next) => {
  try {
    const spool = filamentService.createSpool(req.body || {});
    res.status(201).json(spool);
  } catch (error) {
    next(error);
  }
});

router.put('/spools/:id', (req, res, next) => {
  try {
    const spool = filamentService.updateSpool(Number(req.params.id), req.body || {});
    res.json(spool);
  } catch (error) {
    next(error);
  }
});

router.get('/spools/:id/usage', (req, res, next) => {
  try {
    const usageEntries = filamentService.listUsage(Number(req.params.id));
    res.json(usageEntries);
  } catch (error) {
    next(error);
  }
});

router.post('/spools/:id/usage', (req, res, next) => {
  try {
    const { usage, spool } = filamentService.logUsage(Number(req.params.id), req.body || {});
    res.status(201).json({ usage, spool });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
