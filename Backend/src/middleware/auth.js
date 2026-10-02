import { HttpError } from '../lib/errors.js';
import { readAccessToken } from '../features/auth/tokens.js';

export const requireAuth = (req, _res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new HttpError(401, 'Missing access token', 'unauthenticated');

  const session = readAccessToken(token);
  if (!session) throw new HttpError(401, 'Access token expired or invalid', 'token_expired');

  req.userId = session.userId;
  req.isDemo = session.demo;
  next();
};
