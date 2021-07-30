import AWS from 'aws-sdk';
import { nanoid } from 'nanoid';

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

    const base64Data = new Buffer.from(
      image.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    );

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
