import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';
import { hashPassword, comparePassword } from '../utils/auth';
import User from '../models/user';

const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
};

const SES = new AWS.SES(awsConfig);

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array().map((error) => error.msg)[0];
      return res.status(422).json({
        error,
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
      const error = errors.array().map((error) => error.msg)[0];
      return res.status(422).json({
        error,
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
    console.log('login controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie('token');
    return res.status(201).json({ message: 'Logout successfully' });
  } catch (error) {
    console.log('logout controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const currentUser = async (req, res) => {
  try {
    await User.findById(req.user._id).select('-password').exec();
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.log('currentUser controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array().map((error) => error.msg)[0];
      return res.status(422).json({
        error,
      });
    }

    const { email } = req.body;
    const shortCode = nanoid(6).toUpperCase();
    const user = await User.findOneAndUpdate(
      { email },
      { passwordResetCode: shortCode },
    );

    if (!user) return res.status(400).json({ error: 'User not found' });

    const params = {
      Source: process.env.EMAIL_FROM,
      Destination: {
        ToAddresses: [email],
      },
      ReplyToAddresses: [process.env.EMAIL_FROM],
      Message: {
        Body: {
          Html: {
            Charset: 'UTF-8',
            Data: `
              <html>
                <h1>Reset password</h1>
                <p>Please use this code to reset your password.</p>
                <h2 style="color: red">${shortCode}</h2>
                <i>devcourses.com</i>
              </html>
            `,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: 'devCourses | Reset password',
        },
      },
    };

    const emailSent = SES.sendEmail(params).promise();

    emailSent
      .then((data) => {
        console.log(data);
        res.status(200).json({ ok: true });
      })
      .catch((error) => {
        console.log(error);
        res.status(400).json({ error: error.message });
      });
  } catch (error) {
    console.log('forgotPassword controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array().map((error) => error.msg)[0];
      return res.status(422).json({
        error,
      });
    }
    const { email, code, newPassword } = req.body;
    const hashedPassword = await hashPassword(newPassword);

    await User.findOneAndUpdate(
      { email, passwordResetCode: code },
      { password: hashedPassword, passwordResetCode: '' },
    ).exec();

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.log('resetPassword controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};
