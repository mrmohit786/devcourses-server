import { check } from 'express-validator';

export const validateRegister = [
  check('name', 'Name is required')
    .notEmpty()
    .isLength({
      min: 4,
      max: 32,
    })
    .withMessage('Name must be between 3 to 32 characters'),
  check('email').isEmail().withMessage('Must be a valid email address'),
  check('password', 'Password is required').notEmpty(),
  check('password')
    .isLength({
      min: 6,
    })
    .withMessage('Password must contain at least 6 characters'),
];

export const validateLogin = [
  check('email').isEmail().withMessage('Must be a valid email address'),
  check('password', 'Password is required').notEmpty(),
  check('password')
    .isLength({
      min: 6,
    })
    .withMessage('Password must contain at least 6 characters'),
];
