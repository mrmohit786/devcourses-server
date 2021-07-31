import express from 'express';
import formidable from 'express-formidable';

import {
  uploadImage,
  removeImage,
  uploadVideo,
  removeVideo,
  create,
  read,
  addLesson,
} from '../controllers/course.controller';
const router = express.Router();
import { isInstructor, requireSignIn } from '../middlewares';

// image
router.post('/course/upload-image', requireSignIn, uploadImage);
router.post('/course/remove-image', requireSignIn, removeImage);

// course
router.post('/course', requireSignIn, isInstructor, create);
router.get('/course/:slug', read);
// video
router.post(
  '/course/upload-video/:instructorId',
  requireSignIn,
  formidable(),
  uploadVideo
);
router.post('/course/remove-video/:instructorId', requireSignIn, removeVideo);

router.post('/course/lesson/:slug/:instructorId', requireSignIn, addLesson);

module.exports = router;
