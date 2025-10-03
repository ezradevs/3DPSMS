const { Router } = require('express');
const expensesService = require('../services/expensesService');

const router = Router();

router.get('/', (req, res, next) => {
  try {
    const { payer, assignee, category } = req.query;
    const expenses = expensesService.listExpenses({ payer, assignee, category });
    res.json(expenses);
  } catch (error) {
    next(error);
  }
});

router.post('/', (req, res, next) => {
  try {
    const expense = expensesService.createExpense(req.body || {});
    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', (req, res, next) => {
  try {
    const expense = expensesService.updateExpense(Number(req.params.id), req.body || {});
    res.json(expense);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    expensesService.deleteExpense(Number(req.params.id));
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
