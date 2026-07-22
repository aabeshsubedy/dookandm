import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';

const unwrap = (res) => res.data.data;

/* ─────────────── Plan ─────────────── */
export function usePlan() {
  return useQuery({ queryKey: ['plan'], queryFn: () => api.get('/plan').then(unwrap) });
}
export function usePlanCatalog() {
  return useQuery({ queryKey: ['plan', 'catalog'], queryFn: () => api.get('/plan/catalog').then(unwrap) });
}

/* ─────────────── Conversations / Inbox ─────────────── */
export function useConversations(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== undefined && v !== '' && v !== false) params.set(k, v);
  });
  return useQuery({
    queryKey: ['conversations', filters],
    queryFn: () => api.get(`/conversations?${params}`).then((r) => r.data),
    refetchInterval: 20000,
  });
}

export function useConversation(id) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => api.get(`/conversations/${id}`).then(unwrap),
    enabled: !!id,
  });
}

export function useMessages(conversationId) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () => api.get(`/conversations/${conversationId}/messages?limit=100`).then((r) => r.data),
    enabled: !!conversationId,
  });
}

export function useSendMessage(conversationId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text) =>
      api.post(`/conversations/${conversationId}/messages`, { text }).then(unwrap),
    onMutate: async (text) => {
      await qc.cancelQueries({ queryKey: ['messages', conversationId] });
      const prev = qc.getQueryData(['messages', conversationId]);
      const optimistic = {
        _id: `tmp-${Date.now()}`,
        direction: 'outbound',
        text,
        status: 'queued',
        createdAt: new Date().toISOString(),
        optimistic: true,
      };
      qc.setQueryData(['messages', conversationId], (old) => ({
        ...(old || { data: [] }),
        data: [...(old?.data || []), optimistic],
      }));
      return { prev };
    },
    onError: (_err, _text, ctx) => {
      if (ctx?.prev) qc.setQueryData(['messages', conversationId], ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['messages', conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useUpdateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/conversations/${id}`, body).then(unwrap),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

/* ─────────────── Orders ─────────────── */
export function useOrders(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => api.get(`/orders?${params}`).then((r) => r.data),
  });
}

export function useOrderBoard() {
  return useQuery({ queryKey: ['orders', 'board'], queryFn: () => api.get('/orders/board').then(unwrap) });
}

export function useOrder(id) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => api.get(`/orders/${id}`).then(unwrap),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/orders', body).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['plan'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['conversation'] });
    },
  });
}

export function useChangeOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => api.patch(`/orders/${id}/status`, { status }).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['customer'] });
    },
  });
}

/* ─────────────── Customers ─────────────── */
export function useCustomers(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
  return useQuery({
    queryKey: ['customers', filters],
    queryFn: () => api.get(`/customers?${params}`).then((r) => r.data),
  });
}

export function useCustomer(id) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => api.get(`/customers/${id}`).then(unwrap),
    enabled: !!id,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/customers', body).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] });
      qc.invalidateQueries({ queryKey: ['plan'] });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/customers/${id}`, body).then(unwrap),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['customer', id] });
      qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useAddNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => api.post(`/customers/${id}/notes`, { body }).then(unwrap),
    onSuccess: (_d, { id }) => qc.invalidateQueries({ queryKey: ['customer', id] }),
  });
}

/* ─────────────── Reminders ─────────────── */
export function useReminders(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => v && params.set(k, v));
  return useQuery({
    queryKey: ['reminders', filters],
    queryFn: () => api.get(`/reminders?${params}`).then((r) => r.data),
  });
}

export function useCreateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => api.post('/reminders', body).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] });
      qc.invalidateQueries({ queryKey: ['customer'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateReminder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => api.patch(`/reminders/${id}`, body).then(unwrap),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reminders'] });
      qc.invalidateQueries({ queryKey: ['customer'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/* ─────────────── Dashboard ─────────────── */
export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => api.get('/dashboard/summary').then(unwrap),
  });
}
export function useDashboardRevenue() {
  return useQuery({
    queryKey: ['dashboard', 'revenue'],
    queryFn: () => api.get('/dashboard/revenue').then(unwrap),
  });
}

/* ─────────────── Channels ─────────────── */
export function useChannels() {
  return useQuery({ queryKey: ['channels'], queryFn: () => api.get('/channels').then(unwrap) });
}

/* ─────────────── auth actions ─────────────── */
export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/auth/logout'),
    onSettled: () => {
      clearSession();
      qc.clear();
    },
  });
}

// re-export for pages that need infinite scrolling later
export { useInfiniteQuery };
