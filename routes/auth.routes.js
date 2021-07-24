import express from 'express';
import {
  login,
  register,
  logout,
  currentUser,
  sendTestEmail,
} from '../controllers/auth.controllers';
import { requireSignIn } from '../middlewares';
import { validateLogin, validateRegister } from '../validators/auth.validator';

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/logout', logout);
router.get('/current-user', requireSignIn, currentUser);
router.get('/send-email', sendTestEmail);

module.exports = router;
