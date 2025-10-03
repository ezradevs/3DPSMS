const { Router } = require('express');
const customOrdersService = require('../services/customOrdersService');

const router = Router();

router.get('/', (req, res, next) => {
  try {
    const { status } = req.query;
    const orders = customOrdersService.listOrders({ status });
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const order = customOrdersService.getOrderById(Number(req.params.id));
    if (!order) {
      res.status(404).json({ message: 'Order not found' });
      return;
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
});

router.post('/', (req, res, next) => {
  try {
    const order = customOrdersService.createOrder(req.body || {});
    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const order = customOrdersService.updateOrder(Number(req.params.id), req.body || {});
    res.json(order);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
