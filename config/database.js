import mongoose from 'mongoose';

export default async () => {
  await mongoose
    .connect(process.env.DATABASE, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
      useCreateIndex: true,
    })
    .then(() => console.log('#MongoDB connected'))
    .catch((e) => console.log('Database connection error =>', e));
};
