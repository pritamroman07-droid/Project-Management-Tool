const { body, param, query, validationResult } = require('express-validator');

/**
 * Run validation results and return 400 if errors exist
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// --- Auth validators ---
const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 50 }),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate,
];

const loginValidator = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

// --- Project validators ---
const projectValidator = [
  body('name').trim().notEmpty().withMessage('Project name is required').isLength({ max: 100 }),
  body('status')
    .optional()
    .isIn(['planning', 'active', 'on_hold', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  validate,
];

// --- Task validators ---
const taskValidator = [
  body('title').trim().notEmpty().withMessage('Task title is required').isLength({ max: 200 }),
  body('status').optional().isIn(['todo', 'inprogress', 'review', 'done']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('project').notEmpty().withMessage('Project ID is required').isMongoId().withMessage('Invalid project ID'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  validate,
];

// --- Comment validators ---
const commentValidator = [
  body('content').trim().notEmpty().withMessage('Comment content is required').isLength({ max: 2000 }),
  validate,
];

// --- Pagination query validator ---
const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  validate,
];

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  projectValidator,
  taskValidator,
  commentValidator,
  paginationValidator,
};
