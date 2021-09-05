import express from 'express';
import cors from 'cors';
import { readdirSync } from 'fs';
import csrf from 'csurf';
import cookieParser from 'cookie-parser';
import compression from 'compression';

import database from './config/database';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { morganLogger } from './utils/logger';

require('dotenv').config();

const csrfProtection = csrf({ cookie: true });

// create express app
const app = express();

// connect database
database();

// apply middleware
app.use(cors());
app.use(express.json({ limit: '5mb' })); // data available in JSON format
app.use(compression());
app.use(morganLogger); // api logger
app.use(cookieParser());

// auto load routes
readdirSync('./routes').map((route) => app.use('/api', require(`./routes/${route}`)));

// csrf
app.use(csrfProtection);

app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use(notFound);
app.use(errorHandler);

// listen
app.listen(process.env.PORT, () => console.log(`#Server running in ${process.env.NODE_ENV} mode on PORT ${process.env.PORT}`));
