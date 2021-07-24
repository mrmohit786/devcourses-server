import { validationResult } from 'express-validator';
import User from '../models/user';
import { hashPassword, comparePassword } from '../utils/auth';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array().map(error => error.msg)[0];
      return res.status(422).json({
        error: error,
      });
    }

    const { name, email, password } = req.body;

    const userExist = await User.findOne({ email }).exec();
    if (userExist) {
      return res.status(400).json({ error: 'Email is taken' });
    }

    const hashedPassword = await hashPassword(password);

    await new User({ name, email, password: hashedPassword }).save();

    res.status(201).json({ message: 'Register successfully' });
  } catch (error) {
    console.log('error register controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array().map(error => error.msg)[0];
      return res.status(422).json({
        error: error,
      });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).exec();
    if (!user) {
      return res.status(400).json({ error: 'Wrong credentials' });
    }

    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.status(400).json({ error: 'Wrong credentials' });
    }
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    user.password = undefined;
    res.cookie('token', token, { httpOnly: true }); // , secure: true works on https
    res.json(user);
  } catch (error) {
    console.log('error login controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie('token');
    return res.status(201).json({ message: 'Logout successfully' });
  } catch (error) {
    console.log('error logout controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const currentUser = async (req, res) => {
  try {
    await User.findById(req.user._id).select('-password').exec();
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.log('error currentUser controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const sendTestEmail = async (req, res) => {
  console.log('send email using SES');
  res.json({ ok: true });
};
