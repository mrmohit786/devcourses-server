import express from 'express';
import cors from 'cors';
import { readdirSync } from 'fs';
import mongoose from 'mongoose';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';
import compression from 'compression';
require('dotenv').config();

import { httpLogger } from './logger';
import { errorHandler, notFound } from './middlewares/errorHandler';

const csrfProtection = csrf({ cookie: true });

// create express app
const app = express();

// connect database
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => console.log('#MongoDB connected'))
  .catch((e) => console.log('Database connection error =>', e));

// apply middleware
app.use(cors());
app.use(express.json({ limit: '5mb' })); // data available in JSON format
app.use(compression());
app.use(httpLogger); // api logger
app.use(cookieParser());

// auto load routes
readdirSync('./routes').map((route) => app.use('/api', require(`./routes/${route}`)));

//csrf
app.use(csrfProtection);

app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use(notFound);
app.use(errorHandler);

// listen
app.listen(process.env.PORT, () =>
  console.log(`#Server running in ${process.env.NODE_ENV} mode on PORT ${process.env.PORT}`)
);
