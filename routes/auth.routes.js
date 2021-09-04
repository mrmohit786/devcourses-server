import express from 'express';
import {
  login,
  register,
  logout,
  currentUser,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import { requireSignIn } from '../middlewares';
import {
  validateForgotPassword,
  validateLogin,
  validateRegister,
  validateResetPassword,
} from '../validators/auth.validator';

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/logout', logout);
router.get('/current-user', requireSignIn, currentUser);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);

module.exports = router;
