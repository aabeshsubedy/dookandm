import axios from 'axios';

/**
 * API client. The access token lives in memory only (never localStorage) and is
 * injected per request. On a 401 we attempt a single silent refresh (httpOnly
 * cookie) and retry; if that fails, we broadcast a logout.
 */
let accessToken = null;
let onUnauthorized = () => {};

export function setAccessToken(token) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post('/api/auth/refresh', {}, { withCredentials: true })
      .then((res) => {
        const token = res.data?.data?.accessToken;
        setAccessToken(token);
        return token;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Don't try to refresh the refresh/login endpoints themselves.
    const isAuthCall = original?.url?.includes('/auth/refresh') || original?.url?.includes('/auth/login');

    if (status === 401 && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        const token = await refreshAccessToken();
        if (token) {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        }
      } catch {
        // fall through to logout
      }
      onUnauthorized();
    }
    return Promise.reject(error);
  }
);

/** Normalize an axios error into a friendly message + code. */
export function apiError(error) {
  const data = error?.response?.data?.error;
  return {
    code: data?.code || 'ERROR',
    message: data?.message || error?.message || 'Something went wrong',
    details: data?.details,
    status: error?.response?.status,
  };
}
