const express = require('express');
const budgetRouter = express.Router();
const BudgetController = require('../controllers/budgetController');
const { checkAuth } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimiter');
budgetRouter.use(checkAuth);

budgetRouter.get('/summary/:year/:month', BudgetController.getSummary);
budgetRouter.get('/comparison/:year/:month', BudgetController.getComparison);
budgetRouter.get('/', BudgetController.getAll);
budgetRouter.post('/', writeLimiter, BudgetController.create);
budgetRouter.put('/:id', writeLimiter, BudgetController.update);
budgetRouter.delete('/:id', writeLimiter, BudgetController.delete);

module.exports = budgetRouter;
