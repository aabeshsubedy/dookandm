import { create } from 'zustand';
import { setAccessToken } from '../lib/api.js';

/** Auth/session state. The access token is mirrored into the api module. */
export const useAuthStore = create((set) => ({
  seller: null,
  plan: null,
  status: 'loading', // 'loading' | 'authenticated' | 'anonymous'

  setSession: ({ seller, accessToken, plan }) => {
    if (accessToken !== undefined) setAccessToken(accessToken);
    set((s) => ({
      seller: seller ?? s.seller,
      plan: plan ?? s.plan,
      status: 'authenticated',
    }));
  },

  setPlan: (plan) => set({ plan }),

  clearSession: () => {
    setAccessToken(null);
    set({ seller: null, plan: null, status: 'anonymous' });
  },

  setAnonymous: () => set({ status: 'anonymous' }),
}));
