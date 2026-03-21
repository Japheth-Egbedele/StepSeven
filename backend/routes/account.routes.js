const express = require('express');
const router = express.Router();
const AccountController = require('../controllers/accountController');
const { checkAuth } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimiter');
const { validateObjectId } = require('../middleware/validation');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validation');

// All routes require authentication
router.use(checkAuth);

/**
 * Account validation rules
 */
const validateAccountCreate = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Account name is required')
    .isLength({ max: 100 })
    .withMessage('Account name cannot exceed 100 characters'),
  
  body('type')
    .trim()
    .notEmpty()
    .withMessage('Account type is required')
    .isIn(['ASSET', 'LIABILITY', 'EQUITY'])
    .withMessage('Type must be ASSET, LIABILITY, or EQUITY'),
  
  body('subType')
    .trim()
    .notEmpty()
    .withMessage('Account subtype is required')
    .isIn(['CASH', 'BANK', 'CREDIT_CARD', 'LOAN', 'INVESTMENT', 'INITIAL_BALANCE'])
    .withMessage('Invalid subtype'),
  
  body('balance')
    .optional()
    .isNumeric()
    .withMessage('Balance must be a number'),
  
  body('includeInTotal')
    .optional()
    .isBoolean()
    .withMessage('includeInTotal must be boolean'),
  
  body('currency')
    .optional()
    .isIn(['NGN', 'USD', 'EUR', 'GBP'])
    .withMessage('Invalid currency code'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex code'),
  
  handleValidationErrors
];

const validateAccountUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Account name must be 1-100 characters'),
  
  body('includeInTotal')
    .optional()
    .isBoolean()
    .withMessage('includeInTotal must be boolean'),
  
  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex code'),
  
  handleValidationErrors
];

router.get('/summary/net-worth', AccountController.getNetWorth);

// 3. General list route
router.get('/', AccountController.getAll);

// 4. Parameterized routes come LAST
router.get('/:id', validateObjectId('id'), AccountController.getById);
router.get('/:id/balance', validateObjectId('id'), AccountController.getBalance);

router.post('/', writeLimiter, validateAccountCreate, AccountController.create);
router.put('/:id', writeLimiter, validateObjectId('id'), validateAccountUpdate, AccountController.update);
router.delete('/:id', writeLimiter, validateObjectId('id'), AccountController.delete);
module.exports = router;