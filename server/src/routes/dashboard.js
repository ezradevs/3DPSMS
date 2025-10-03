const { Router } = require('express');
const dashboardService = require('../services/dashboardService');

const router = Router();

router.get('/', (_req, res, next) => {
  try {
    const data = dashboardService.getDashboardSummary();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
