const express = require('express');
const router = express.Router();
const TransactionController = require('../controllers/transactionController');
const TransferController = require('../controllers/transferController');
const { checkAuth } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimiter');

router.use(checkAuth);

// Specific routes FIRST — before /:id wildcards
router.post('/transfer', writeLimiter, TransferController.createTransfer);
router.put('/transfer/:id', writeLimiter, TransferController.updateTransfer);
router.delete('/transfer/:id', writeLimiter, TransferController.deleteTransfer);

// Generic CRUD after
router.get('/', TransactionController.getTransactions);
router.post('/', writeLimiter, TransactionController.createTransaction);
router.get('/:id', TransactionController.getTransaction);
router.put('/:id', writeLimiter, TransactionController.updateTransaction);
router.delete('/:id', writeLimiter, TransactionController.deleteTransaction);

module.exports = router;