import mongoose from 'mongoose';
import { ZodError, z } from 'zod';
import { logger } from './logger.js';

export class HttpError extends Error {
  constructor(status, message, code, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const notFound = (what = 'Resource') => new HttpError(404, `${what} not found`, 'not_found');
export const forbidden = (message = 'You do not have permission to do that') =>
  new HttpError(403, message, 'forbidden');

export const errorHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { message: err.message, code: err.code, ...err.details } });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      error: { message: 'Invalid request', code: 'validation_failed', fields: z.flattenError(err).fieldErrors },
    });
    return;
  }
  // A malformed ObjectId in a URL is indistinguishable from a missing record to the caller.
  if (err instanceof mongoose.Error.CastError) {
    res.status(404).json({ error: { message: 'Resource not found', code: 'not_found' } });
    return;
  }

  logger.error({ err, path: req.path }, 'unhandled error');
  res.status(500).json({ error: { message: 'Something went wrong', code: 'internal' } });
};
