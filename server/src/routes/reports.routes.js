const express = require('express');
const router = express.Router();
const controller = require('../controllers/reports.controller');

router.get('/monthly-trend', controller.getMonthlyTrend);
router.get('/category-breakdown', controller.getCategoryBreakdown);
router.get('/budget-vs-actual', controller.getBudgetVsActual);
router.get('/fixed-vs-variable', controller.getFixedVsVariable);
router.get('/savings-progress', controller.getSavingsProgress);
router.get('/daily-spending', controller.getDailySpending);
router.get('/subscription-spending', controller.getSubscriptionSpending);
router.get('/cost-of-living', controller.getCostOfLiving);

module.exports = router;
