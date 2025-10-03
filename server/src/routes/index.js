const { Router } = require('express');
const itemsRouter = require('./items');
const sessionsRouter = require('./sessions');
const dashboardRouter = require('./dashboard');
const adminRouter = require('./admin');
const customOrdersRouter = require('./customOrders');
const filamentRouter = require('./filament');
const printQueueRouter = require('./printQueue');
const expensesRouter = require('./expenses');

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

router.use('/items', itemsRouter);
router.use('/sessions', sessionsRouter);
router.use('/dashboard', dashboardRouter);
router.use('/admin', adminRouter);
router.use('/custom-orders', customOrdersRouter);
router.use('/filament', filamentRouter);
router.use('/print-queue', printQueueRouter);
router.use('/expenses', expensesRouter);

module.exports = router;
