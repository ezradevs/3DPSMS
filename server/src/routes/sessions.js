const { Router } = require('express');
const sessionsService = require('../services/sessionsService');
const salesService = require('../services/salesService');

const router = Router();

router.get('/', (_req, res, next) => {
  try {
    const sessions = sessionsService.listSessions();
    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const session = sessionsService.getSessionById(Number(req.params.id));
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }
    res.json(session);
  } catch (error) {
    next(error);
  }
});

router.post('/', (req, res, next) => {
  try {
    const { title, location, sessionDate, weather } = req.body;
    if (!title) {
      res.status(400).json({ message: 'Title is required' });
      return;
    }
    const session = sessionsService.createSession({ title, location, sessionDate, weather });
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/close', (req, res, next) => {
  try {
    const session = sessionsService.closeSession(Number(req.params.id));
    res.json(session);
  } catch (error) {
    next(error);
  }
});

router.get('/:id/sales', (req, res, next) => {
  try {
    const sales = salesService.getSalesForSession(Number(req.params.id));
    res.json(sales);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/sales', (req, res, next) => {
  try {
    const { itemId, quantity, unitPrice, note, paymentMethod, cashReceived, soldAt } = req.body;
    if (!itemId) {
      res.status(400).json({ message: 'itemId is required' });
      return;
    }

    const sale = salesService.recordSale({
      sessionId: Number(req.params.id),
      itemId: Number(itemId),
      quantity: Number(quantity),
      unitPrice: unitPrice !== undefined ? Number(unitPrice) : undefined,
      note: note || null,
      paymentMethod,
      cashReceived: cashReceived !== undefined && cashReceived !== null && cashReceived !== ''
        ? Number(cashReceived)
        : undefined,
      soldAt: soldAt || undefined,
    });

    res.status(201).json(sale);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
