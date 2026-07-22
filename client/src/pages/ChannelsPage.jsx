import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Facebook,
  Instagram,
  Plug,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Webhook,
} from 'lucide-react';
import { Page } from '../components/layout/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { PasswordConfirmModal } from '../components/ui/PasswordConfirmModal.jsx';
import { useChannels } from '../hooks/data.js';
import { api, apiError } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { toast } from '../store/toastStore.js';
import { useQueryClient } from '@tanstack/react-query';
import { relativeTime } from '../lib/format.js';
import { cn } from '../lib/cn.js';

const metaMessages = {
  connected: ['success', 'Channel connected successfully.'],
  no_pages: ['info', 'No Pages found on that account.'],
  denied: ['error', 'Connection was cancelled.'],
  error: ['error', 'Could not connect. Please try again.'],
  invalid_state: ['error', 'Session expired — please retry.'],
};

export default function ChannelsPage() {
  const { data, isLoading } = useChannels();
  const plan = useAuthStore((s) => s.plan);
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();

  /** @type {[{ type: 'connect' } | { type: 'disconnect', id: string, name?: string } | null, Function]} */
  const [pending, setPending] = useState(null);

  useEffect(() => {
    const meta = params.get('meta');
    if (meta && metaMessages[meta]) {
      const [variant, msg] = metaMessages[meta];
      toast[variant === 'error' ? 'error' : variant === 'success' ? 'success' : 'info'](msg);
      qc.invalidateQueries({ queryKey: ['channels'] });
      params.delete('meta');
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const channels = data?.channels || [];
  const metaConfigured = data?.metaConfigured;
  const channelLimit = plan?.limits?.channels;
  const unlimited = channelLimit == null;
  const usagePct = unlimited
    ? 0
    : Math.min(100, Math.round((channels.length / Math.max(channelLimit, 1)) * 100));

  const runConnect = async () => {
    try {
      const res = await api.get('/channels/oauth/url');
      window.location.href = res.data.data.url;
    } catch (err) {
      const e = apiError(err);
      if (e.code === 'PLAN_QUOTA_EXCEEDED') toast.error(e.message, 'Channel limit reached');
      else toast.error(e.message, 'Cannot connect');
      throw err;
    }
  };

  const runDisconnect = async (id) => {
    try {
      await api.delete(`/channels/${id}`);
      toast.success('Channel disconnected');
      qc.invalidateQueries({ queryKey: ['channels'] });
    } catch (err) {
      toast.error(apiError(err).message);
      throw err;
    }
  };

  const sync = async (id) => {
    try {
      await api.post(`/channels/${id}/sync`);
      toast.success('Sync started');
    } catch (err) {
      toast.error(apiError(err).message);
    }
  };

  const confirmPending = async () => {
    if (!pending) return;
    if (pending.type === 'connect') {
      await runConnect();
      return;
    }
    if (pending.type === 'disconnect') {
      await runDisconnect(pending.id);
    }
  };

  return (
    <Page>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Accounts</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Connect Facebook Pages and Instagram business profiles
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setPending({ type: 'connect' })}>
          <Plug className="h-3.5 w-3.5" strokeWidth={1.75} />
          Connect channel
        </Button>
      </header>

      {!metaConfigured && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-warning/25 bg-warning-soft/60 px-4 py-3.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-warning-soft text-warning">
            <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-fg">Meta is not configured on this server</p>
            <p className="mt-0.5 leading-relaxed text-fg-secondary">
              Add <code className="rounded-md bg-surface px-1.5 py-0.5 text-2xs font-mono">META_APP_ID</code>{' '}
              and{' '}
              <code className="rounded-md bg-surface px-1.5 py-0.5 text-2xs font-mono">
                META_APP_SECRET
              </code>{' '}
              to enable live connections. Demo data still works without them.
            </p>
          </div>
        </div>
      )}

      {!unlimited && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5 shadow-xs">
          <span className="text-xs text-fg-secondary">
            <span className="font-semibold tabular-nums text-fg">{channels.length}</span>
            <span className="text-fg-muted">
              {' '}
              / {channelLimit} channel{channelLimit === 1 ? '' : 's'}
            </span>
            <span className="text-fg-muted"> · {plan?.label || 'Free'} plan</span>
          </span>
          <div className="h-1.5 min-w-[6rem] max-w-xs flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                usagePct >= 90 ? 'bg-danger/70' : usagePct >= 80 ? 'bg-warning/70' : 'bg-brand/65'
              )}
              style={{ width: `${usagePct}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-5">
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xs"
              >
                <Skeleton className="h-11 w-11 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : channels.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface shadow-xs">
            <EmptyState
              icon={Plug}
              title="No channels connected"
              description="Connect Facebook or Instagram so DMs land in your unified inbox."
              action={
                <Button variant="primary" size="sm" onClick={() => setPending({ type: 'connect' })}>
                  <Plug className="h-3.5 w-3.5" />
                  Connect channel
                </Button>
              }
              className="py-14"
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {channels.map((c) => (
              <ChannelCard
                key={c._id}
                channel={c}
                onSync={() => sync(c._id)}
                onDisconnect={() =>
                  setPending({ type: 'disconnect', id: c._id, name: c.name })
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Help strip */}
      <div className="mt-6 rounded-2xl border border-border bg-surface px-4 py-4 shadow-xs sm:px-5">
        <p className="text-sm font-semibold text-fg">How connections work</p>
        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-fg-secondary">
          <li className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-fg-muted" />
            You connect via Meta OAuth — we never see your Facebook password.
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-fg-muted" />
            Messages arrive through webhooks into the unified inbox.
          </li>
          <li className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-fg-muted" />
            Disconnect anytime. Existing conversations and orders stay in DokaanDM.
          </li>
        </ul>
      </div>

      <PasswordConfirmModal
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={confirmPending}
        title={pending?.type === 'disconnect' ? 'Disconnect account' : 'Connect Meta account'}
        description={
          pending?.type === 'disconnect'
            ? `Enter your password to disconnect${pending.name ? ` “${pending.name}”` : ''}.`
            : 'Enter your password to continue connecting a Facebook or Instagram account.'
        }
        confirmLabel={pending?.type === 'disconnect' ? 'Disconnect' : 'Continue'}
      />
    </Page>
  );
}

function ChannelCard({ channel: c, onSync, onDisconnect }) {
  const isIg = c.type === 'instagram';
  const active = c.status === 'active';

  return (
    <article
      className={cn(
        'flex items-start gap-3.5 rounded-2xl border border-border bg-surface p-4 shadow-xs',
        'transition-colors hover:border-border-strong'
      )}
    >
      <div
        className={cn(
          'grid h-11 w-11 shrink-0 place-items-center rounded-xl',
          isIg
            ? 'bg-[#E1306C]/10 text-[#E1306C] dark:bg-[#E1306C]/15 dark:text-[#f472b6]'
            : 'bg-[#1877F2]/10 text-[#1877F2] dark:bg-[#1877F2]/15 dark:text-[#4b9bff]'
        )}
      >
        {isIg ? (
          <Instagram className="h-5 w-5" strokeWidth={1.75} />
        ) : (
          <Facebook className="h-5 w-5" strokeWidth={1.75} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold tracking-tight text-fg">{c.name}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs font-medium',
              active ? 'bg-success-soft text-success' : 'bg-surface-2 text-fg-muted'
            )}
          >
            {active && <CheckCircle2 className="h-3 w-3" strokeWidth={2} />}
            {active ? 'Active' : c.status}
          </span>
          <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-2xs font-medium capitalize text-fg-muted">
            {isIg ? 'Instagram' : 'Facebook'}
          </span>
          {c.webhookSubscribed && (
            <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-2xs text-fg-muted">
              <Webhook className="h-3 w-3" strokeWidth={1.75} />
              Webhooks
            </span>
          )}
        </div>
        <p className="mt-2 text-2xs text-fg-muted">Connected {relativeTime(c.createdAt)}</p>
      </div>

      <div className="flex shrink-0 flex-col gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={onSync}
          aria-label="Sync channel"
          title="Sync"
        >
          <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.75} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-fg-muted hover:text-danger"
          onClick={onDisconnect}
          aria-label="Disconnect channel"
          title="Disconnect"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
        </Button>
      </div>
    </article>
  );
}
