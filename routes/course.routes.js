import express from 'express';
import formidable from 'express-formidable';

import {
  uploadImage,
  removeImage,
  uploadVideo,
  removeVideo,
  list,
  create,
  read,
  addLesson,
  update,
  removeLesson,
  updateLesson,
  publishCourse,
  unpublishCourse,
  checkEnrollment,
  freeEnrollment,
} from '../controllers/course.controller';
const router = express.Router();
import { isInstructor, requireSignIn } from '../middlewares';

// image
router.post('/course/upload-image', requireSignIn, uploadImage);
router.post('/course/remove-image', requireSignIn, removeImage);

// course
router.post('/course', requireSignIn, isInstructor, create);
router.get('/course', list);
router.put('/course/:slug', requireSignIn, update);
router.get('/course/:slug', read);

// video
router.post('/course/upload-video/:instructorId', requireSignIn, formidable(), uploadVideo);
router.post('/course/remove-video/:instructorId', requireSignIn, removeVideo);

// publish/unpublish
router.put('/course/publish/:courseId', requireSignIn, publishCourse);
router.put('/course/unpublish/:courseId', requireSignIn, unpublishCourse);

// lessons
router.post('/course/lesson/:slug/:instructorId', requireSignIn, addLesson);
router.put('/course/lesson/:slug', requireSignIn, updateLesson);
router.put('/course/:slug/:lessonId', requireSignIn, removeLesson);

router.get('/check-enrollment/:courseId', requireSignIn, checkEnrollment);

// enrollment
router.post('/free-enrollment/:courseId', requireSignIn, freeEnrollment);

module.exports = router;
