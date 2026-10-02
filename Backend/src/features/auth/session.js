import { config, isProd } from '../../config.js';
import { publicUser } from './user.model.js';
import { issueRefreshToken, signAccessToken } from './tokens.js';

export const REFRESH_COOKIE = 'pb_refresh';
const COOKIE_PATH = '/api/v1/auth';

export function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    path: COOKIE_PATH,
    maxAge: config.REFRESH_TOKEN_TTL_DAYS * 86_400_000,
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, { path: COOKIE_PATH });
}

export const accessTokenFor = (user) => signAccessToken(String(user._id), { demo: Boolean(user.isDemo) });

// Signs the user in: a refresh token in an httpOnly cookie, an access token in the body.
export async function startSession(res, user) {
  setRefreshCookie(res, await issueRefreshToken(String(user._id)));
  return { accessToken: accessTokenFor(user), user: publicUser(user) };
}
