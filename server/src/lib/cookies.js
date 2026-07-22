import { env } from '../config/env.js';
import { refreshCookieMaxAgeMs } from '../services/tokenService.js';

export const REFRESH_COOKIE = 'dokaan_rt';

const baseOptions = () => ({
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAMESITE,
  domain: env.COOKIE_DOMAIN || undefined,
  path: '/api/auth',
});

export function setRefreshCookie(res, rawToken) {
  res.cookie(REFRESH_COOKIE, rawToken, { ...baseOptions(), maxAge: refreshCookieMaxAgeMs });
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, baseOptions());
}
