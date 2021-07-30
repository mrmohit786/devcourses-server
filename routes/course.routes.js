import express from 'express';

import { uploadImage, removeImage } from '../controllers/course.controller';
const router = express.Router();
import { requireSignIn } from '../middlewares';

router.post('/course/upload-image', requireSignIn, uploadImage);
router.post('/course/remove-image', requireSignIn, removeImage);

module.exports = router;
