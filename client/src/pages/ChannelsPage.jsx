import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Facebook, Instagram, Plug, CheckCircle2, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { Page, PageHeader } from '../components/layout/PageHeader.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { LoadingPanel } from '../components/ui/Skeleton.jsx';
import { useChannels } from '../hooks/data.js';
import { api, apiError } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { toast } from '../store/toastStore.js';
import { useQueryClient } from '@tanstack/react-query';
import { relativeTime } from '../lib/format.js';

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

  const connect = async () => {
    try {
      const res = await api.get('/channels/oauth/url');
      window.location.href = res.data.data.url;
    } catch (err) {
      const e = apiError(err);
      if (e.code === 'PLAN_QUOTA_EXCEEDED') toast.error(e.message, 'Channel limit reached');
      else toast.error(e.message, 'Cannot connect');
    }
  };

  const disconnect = async (id) => {
    try {
      await api.delete(`/channels/${id}`);
      toast.success('Channel disconnected');
      qc.invalidateQueries({ queryKey: ['channels'] });
    } catch (err) {
      toast.error(apiError(err).message);
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

  return (
    <Page>
      <PageHeader
        title="Accounts"
        description="Connect Meta accounts — Facebook Pages and Instagram business profiles."
        action={
          <Button variant="primary" onClick={connect}>
            <Plug className="h-4 w-4" /> Connect channel
          </Button>
        }
      />

      {!metaConfigured && (
        <div className="mt-5 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-soft px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div className="text-sm text-fg">
            <p className="font-medium">Meta integration is not configured on this server.</p>
            <p className="mt-0.5 text-fg-secondary">
              Add <code className="rounded bg-surface px-1 text-xs">META_APP_ID</code> and{' '}
              <code className="rounded bg-surface px-1 text-xs">META_APP_SECRET</code> to enable live
              connections. Demo data still works.
            </p>
          </div>
        </div>
      )}

      {channelLimit != null && (
        <p className="mt-4 text-sm text-fg-muted">
          Using {channels.length} of {channelLimit} channel{channelLimit === 1 ? '' : 's'} on{' '}
          <span className="font-medium text-fg-secondary">{plan?.label}</span>.
        </p>
      )}

      <div className="mt-4">
        {isLoading ? (
          <LoadingPanel />
        ) : channels.length === 0 ? (
          <Card>
            <EmptyState
              icon={Plug}
              title="No channels connected"
              description="Connect Facebook or Instagram to receive DMs in your unified inbox."
              action={
                <Button variant="primary" onClick={connect}>
                  <Plug className="h-4 w-4" /> Connect channel
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {channels.map((c) => (
              <Card key={c._id}>
                <CardBody className="flex items-center gap-3">
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
                      c.type === 'instagram'
                        ? 'bg-[#E1306C]/10 text-[#E1306C] dark:bg-[#E1306C]/15 dark:text-[#f472b6]'
                        : 'bg-[#1877F2]/10 text-[#1877F2] dark:bg-[#1877F2]/15 dark:text-[#4b9bff]'
                    }`}
                  >
                    {c.type === 'instagram' ? (
                      <Instagram className="h-5 w-5" />
                    ) : (
                      <Facebook className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-fg">{c.name}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      {c.status === 'active' ? (
                        <Badge tone="good">
                          <CheckCircle2 className="h-3 w-3" /> Active
                        </Badge>
                      ) : (
                        <Badge tone="neutral">{c.status}</Badge>
                      )}
                      {c.webhookSubscribed && (
                        <span className="text-2xs text-fg-muted">Webhooks on</span>
                      )}
                    </div>
                    <p className="mt-1 text-2xs text-fg-muted">Connected {relativeTime(c.createdAt)}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button variant="ghost" size="icon" onClick={() => sync(c._id)} aria-label="Sync">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-fg-muted hover:text-danger"
                      onClick={() => disconnect(c._id)}
                      aria-label="Disconnect"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
