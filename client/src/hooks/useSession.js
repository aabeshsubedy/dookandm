import { useEffect } from 'react';
import axios from 'axios';
import { api, setAccessToken, setUnauthorizedHandler } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';

/**
 * Bootstrap the session on app load: try to silently refresh the access token
 * (httpOnly cookie), then load the seller profile. Wires the global 401 handler.
 */
export function useSessionBootstrap() {
  const { setSession, clearSession, setAnonymous } = useAuthStore();

  useEffect(() => {
    setUnauthorizedHandler(() => clearSession());

    let cancelled = false;
    (async () => {
      try {
        const refreshRes = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const token = refreshRes.data?.data?.accessToken;
        if (!token) throw new Error('no token');
        setAccessToken(token);

        const me = await api.get('/auth/me');
        if (cancelled) return;
        setSession({
          seller: me.data.data.seller,
          plan: me.data.data.plan,
          accessToken: token,
        });
      } catch {
        if (!cancelled) setAnonymous();
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
