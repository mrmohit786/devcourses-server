import queryString from 'query-string';
import User from '../models/user';
import Course from '../models/course';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export const makeInstructor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).exec();

    if (!user.stripe_account_id) {
      // create stripe account
      const account = await stripe.accounts.create({
        type: 'standard',
      });

      console.log('stripe account info', account);
      user.stripe_account_id = account.id;
      await user.save();
    }

    // create stripe onboarding link
    let accountLink = await stripe.accountLinks.create({
      account: user.stripe_account_id,
      refresh_url: process.env.STRIPE_REDIRECT_URL,
      return_url: process.env.STRIPE_REDIRECT_URL,
      type: 'account_onboarding',
    });

    // pre populate user email in stripe page
    accountLink = Object.assign(accountLink, {
      'stripe_user[email]': user.email,
    });

    return res
      .status(200)
      .send(`${accountLink.url}?${queryString.stringify(accountLink)}`);
  } catch (error) {
    console.log('error makeInstructor controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const getAccountStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).exec();
    const account = await stripe.accounts.retrieve(user.stripe_account_id);
    if (!account.charges_enabled) {
      return res.status(401).send('Unauthorized');
    }
    const statusUpdated = await User.findByIdAndUpdate(
      user._id,
      {
        stripe_seller: account,
        $addToSet: { role: 'Instructor' },
      },
      { new: true },
    )
      .select('-password')
      .exec();
    return res.status(200).json(statusUpdated);
  } catch (error) {
    console.log('error getAccountStatus controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const currentInstructor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password').exec();

    if (!user.role.includes('Instructor')) {
      return res.sendStatus(403);
    }
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.log('error currentInstructor controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const instructorCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id })
      .sort({
        createdAt: -1,
      })
      .exec();

    return res.status(200).json(courses);
  } catch (error) {
    console.log('error instructorCourses controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const studentCount = async (req, res) => {
  try {
    const users = await User.find({ courses: req.body.courseId })
      .select('_id')
      .exec();

    return res.status(200).json({ length: users.length });
  } catch (error) {
    console.log('error studentCount controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const instructorBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).exec();
    const balance = await stripe.balance.retrieve({
      stripeAccount: user.stripe_account_id,
    });
    res.json(balance);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const instructorPayoutSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).exec();
    const loginLink = await stripe.accounts.createLoginLink(
      user.stripe_seller.id,
      { redirect_url: process.env.STRIPE_SETTINGS_REDIRECT },
    );
    return res.json(loginLink.url);
  } catch (err) {
    console.log('stripe payout settings login link err =>', err);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};
