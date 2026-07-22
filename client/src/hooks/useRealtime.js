import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getAccessToken } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { toast } from '../store/toastStore.js';

/**
 * Subscribe to the server SSE stream for live updates. On relevant events we
 * invalidate the affected queries so the UI refreshes, and surface a toast for
 * newly-arrived inbound messages.
 */
export function useRealtime() {
  const qc = useQueryClient();
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    if (status !== 'authenticated') return undefined;
    const token = getAccessToken();
    if (!token) return undefined;

    const es = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);

    const refetchInbox = () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    };

    es.addEventListener('message.new', (e) => {
      const data = safeParse(e.data);
      refetchInbox();
      if (data?.conversationId) {
        qc.invalidateQueries({ queryKey: ['messages', data.conversationId] });
      }
      if (data?.direction === 'inbound') {
        toast.message(data.snippet || 'New message received', 'New message');
      }
    });

    es.addEventListener('message.sent', (e) => {
      const data = safeParse(e.data);
      if (data?.conversationId) qc.invalidateQueries({ queryKey: ['messages', data.conversationId] });
    });

    es.addEventListener('order.created', () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    });
    es.addEventListener('order.updated', () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    });

    es.onerror = () => {
      // EventSource auto-reconnects; nothing to do.
    };

    return () => es.close();
  }, [status, qc]);
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
