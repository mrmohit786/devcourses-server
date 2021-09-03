import { logger } from "../utils/logger";
export const notFound = (req, res, next) => {
  const error = new Error(`API Not Found - ${process.env.SERVER_API}${req.originalUrl}`);
  logger.warn(error);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  logger.error(err.message);
  res.status(statusCode).json({
    message: err.message,
    statusCode: statusCode
  });
};
