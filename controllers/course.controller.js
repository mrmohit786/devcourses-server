import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';
import Course from '../models/course';
import slugify from 'slugify';
import { readFileSync } from 'fs';

const awsConfig = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  apiVersion: process.env.AWS_API_VERSION,
};

const S3 = new AWS.S3(awsConfig);

export const uploadImage = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).send('No image');
    }

    const base64Data = new Buffer.from(image.replace(/^data:image\/\w+;base64,/, ''), 'base64');

    const type = image.split(';')[0].split('/')[1];

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `${nanoid()}.${type}`,
      Body: base64Data,
      ACL: 'public-read',
      ContentEncoding: 'base64',
      ContentType: `image/${type}`,
    };

    S3.upload(params, (err, data) => {
      if (err) {
        console.log(err);
        return res.sendStatus(400);
      }
      console.log(data);
      res.status(200).send(data);
    });
  } catch (error) {
    console.log('uploadImage controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const removeImage = async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).send('No image');
    }

    const params = {
      Bucket: image.Bucket,
      Key: image.Key,
    };

    S3.deleteObject(params, (err, data) => {
      if (err) {
        console.log(err);
        return res.sendStatus(400);
      }

      res.send({ ok: true });
    });
  } catch (error) {
    console.log('removeImage controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const create = async (req, res) => {
  try {
    const { image, name, description, category, paid, price } = req.body;
    const alreadyExist = await Course.findOne({
      slug: slugify(name.toLowerCase()),
    });

    if (alreadyExist) {
      return res.status(400).send('Title is taken');
    }

    const course = await new Course({
      slug: slugify(name),
      instructor: req.user._id,
      image,
      name,
      description,
      category,
      paid,
      price,
    }).save();

    res.status(201).json(course);
  } catch (error) {
    console.log('course create controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const read = async (req, res) => {
  try {
    const course = await Course.findOne({
      slug: req.params.slug,
    })
      .populate('instructor', '_id name')
      .exec();

    return res.json(course);
  } catch (error) {
    console.log('course create controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const uploadVideo = async (req, res) => {
  try {
    const { video } = req.files;
    const { instructorId } = req.params;

    if (req.user._id !== instructorId) {
      return res.status(401).send('Unauthorized');
    }

    if (!video) {
      return res.status(400).send('No video');
    }

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `${nanoid()}.${video.type.split('/')[1]}`,
      ACL: 'public-read',
      Body: readFileSync(video.path),
      ContentType: video.type,
    };

    S3.upload(params, (error, data) => {
      if (error) {
        console.log(error);
        return res.sendStatus(400);
      }

      return res.send(data);
    });
  } catch (error) {
    console.log('uploadVideo controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const removeVideo = async (req, res) => {
  try {
    const { video } = req.body;
    const { instructorId } = req.params;

    if (req.user._id !== instructorId) {
      return res.status(401).send('Unauthorized');
    }

    if (!video) {
      return res.status(400).send('No video');
    }

    const params = {
      Bucket: video.Bucket,
      Key: video.Key,
    };

    S3.deleteObject(params, (err, data) => {
      if (err) {
        console.log(err);
        return res.sendStatus(400);
      }

      res.send({ ok: true });
    });
  } catch (error) {
    console.log('removeVideo controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const addLesson = async (req, res) => {
  try {
    const { instructorId, slug } = req.params;
    const { title, content, video } = req.body;

    if (req.user._id !== instructorId) {
      return res.status(401).send('Unauthorized');
    }

    const updatedCourse = await Course.findOneAndUpdate(
      { slug },
      {
        $push: {
          lessons: {
            title,
            content,
            video,
            slug: slugify(title),
          },
        },
      },
      { new: true }
    )
      .populate('instructor', '_id name')
      .exec();

    return res.status(200).json(updatedCourse);
  } catch (error) {
    console.log('createLesson controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const update = async (req, res) => {
  try {
    const { slug } = req.params;
    const course = await Course.findOne({ slug }).exec();

    if (!course) {
      return res.status(400).send('No course found');
    }

    if (req.user._id !== course.instructor.toString()) {
      return res.status(400).send('Unauthorized');
    }

    const updated = await Course.findOneAndUpdate({ slug }, req.body, { new: true }).exec();
    res.json(updated);
  } catch (error) {
    console.log('update course controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const removeLesson = async (req, res) => {
  try {
    const { slug, lessonId } = req.params;
    const course = await Course.findOne({ slug }).exec();

    if (!course) {
      return res.status(404).send('No course found');
    }

    if (req.user._id !== course.instructor.toString()) {
      return res.status(400).send('Unauthorized');
    }

    const deleted = await Course.findByIdAndUpdate(course._id, {
      $pull: { lessons: { _id: lessonId } },
    }).exec();

    res.json({ ok: true });
  } catch (error) {
    console.log('remove lesson controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const updateLesson = async (req, res) => {
  try {
    const { slug } = req.params;
    const { _id, title, content, video, free_preview } = req.body;
    const course = await Course.findOne({ slug }).select('instructor').exec();
    if (!course) {
      return res.status(404).send('No course found');
    }

    if (req.user._id !== course.instructor.toString()) {
      return res.status(400).send('Unauthorized');
    }

    const updated = await Course.updateOne(
      { 'lessons._id': _id },
      {
        $set: {
          'lessons.$.title': title,
          'lessons.$.content': content,
          'lessons.$.video': video,
          'lessons.$.free_preview': free_preview,
        },
      },
      { new: true }
    ).exec();

    res.json({ ok: true });
  } catch (error) {
    console.log('update lesson controller ->', error);
    return res.status(500).json({ error: 'Something went wrong' });
  }
};

export const publishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).select('instructor').exec();
    if (!course) {
      return res.status(404).send('No course found');
    }

    if (req.user._id !== course.instructor.toString()) {
      return res.status(400).send('Unauthorized');
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { published: true },
      { new: true }
    ).exec();
    res.status(200).json(updatedCourse);
  } catch (error) {
    console.log('publish course controller ->', error);
    return res.status(500).json({ error: 'Failed to publish course' });
  }
};

export const unpublishCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const course = await Course.findById(courseId).select('instructor').exec();
    if (!course) {
      return res.status(404).send('No course found');
    }

    if (req.user._id !== course.instructor.toString()) {
      return res.status(400).send('Unauthorized');
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      { published: false },
      { new: true }
    ).exec();

    res.status(200).json(updatedCourse);
  } catch (error) {
    console.log('unpublish course controller ->', error);
    return res.status(500).json({ error: 'Failed to unpublish course' });
  }
};

export const list = async (req, res) => {
  const all = await Course.find({ published: true }).populate('instructor', '_id name').exec();
  res.json(all);
};
