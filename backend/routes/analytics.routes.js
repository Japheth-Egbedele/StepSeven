const express = require('express');
const analyticsRouter = express.Router(); // Change 'router' to 'analyticsRouter'
const { checkAuth } = require('../middleware/auth');
const AnalyticsController = require('../controllers/analyticsController');

analyticsRouter.use(checkAuth);

analyticsRouter.get('/expenses-by-category', AnalyticsController.getExpensesByCategory);
analyticsRouter.get('/monthly-cashflow', AnalyticsController.getMonthlyCashFlow);
analyticsRouter.get('/networth-trend', AnalyticsController.getNetWorthTrend);
analyticsRouter.get('/budget-comparison', AnalyticsController.getBudgetComparison);
analyticsRouter.get('/spending-trends', AnalyticsController.getSpendingTrends);
module.exports = analyticsRouter;