const CategoryController = require('../controllers/categoryController');
const express = require('express');
const categoryRouter = express.Router();
const { checkAuth } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidationErrors, validateObjectId } = require('../middleware/validation');
const { writeLimiter } = require('../middleware/rateLimiter');

// All routes require authentication
categoryRouter.use(checkAuth);

/**
 * Category validation rules
 */
const validateCategoryCreate = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Category name is required')
    .isLength({ max: 100 })
    .withMessage('Category name cannot exceed 100 characters'),

  body('type')
    .trim()
    .notEmpty()
    .withMessage('Category type is required')
    .isIn(['INCOME', 'EXPENSE'])
    .withMessage('Type must be INCOME or EXPENSE'),

  body('parent')
    .optional()
    .isMongoId()
    .withMessage('Parent must be a valid ID'),

  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex code'),

  handleValidationErrors
];

const validateCategoryUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category name must be 1-100 characters'),

  body('parent')
    .optional()
    .isMongoId()
    .withMessage('Parent must be a valid ID'),

  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('Color must be a valid hex code'),

  handleValidationErrors
];

// Routes
categoryRouter.get('/', CategoryController.getAll);
categoryRouter.post('/defaults', writeLimiter, CategoryController.createDefaults);
categoryRouter.get('/:id', validateObjectId('id'), CategoryController.getById);
categoryRouter.post('/', writeLimiter, validateCategoryCreate, CategoryController.create);
categoryRouter.put('/:id', writeLimiter, validateObjectId('id'), validateCategoryUpdate, CategoryController.update);
categoryRouter.delete('/:id', writeLimiter, validateObjectId('id'), CategoryController.delete);

module.exports = categoryRouter;