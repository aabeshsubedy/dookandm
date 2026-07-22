import { create } from 'zustand';

let seq = 0;

/** Lightweight toast system (custom, matches the design system). */
export const useToastStore = create((set, get) => ({
  toasts: [],
  push: ({ title, message, variant = 'default', duration = 4000 }) => {
    const id = ++seq;
    set((s) => ({ toasts: [...s.toasts, { id, title, message, variant }] }));
    if (duration) setTimeout(() => get().dismiss(id), duration);
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export const toast = {
  success: (message, title) => useToastStore.getState().push({ message, title, variant: 'success' }),
  error: (message, title) => useToastStore.getState().push({ message, title, variant: 'danger' }),
  info: (message, title) => useToastStore.getState().push({ message, title, variant: 'info' }),
  message: (message, title) => useToastStore.getState().push({ message, title, variant: 'default' }),
};
