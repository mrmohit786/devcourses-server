import express from 'express';
import {
  makeInstructor, getAccountStatus, currentInstructor, instructorCourses,
} from '../controllers/instructor.controller';
import { requireSignIn } from '../middlewares';

const router = express.Router();

router.post('/make-instructor', requireSignIn, makeInstructor);
router.post('/get-account-status', requireSignIn, getAccountStatus);
router.post('/get-account-status', requireSignIn, getAccountStatus);
router.get('/current-instructor', requireSignIn, currentInstructor);
router.get('/instructor-courses', requireSignIn, instructorCourses);

module.exports = router;
