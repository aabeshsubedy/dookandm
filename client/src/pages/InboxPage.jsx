import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Inbox as InboxIcon, Keyboard } from 'lucide-react';
import { ConversationList } from '../features/inbox/ConversationList.jsx';
import { MessageThread } from '../features/inbox/MessageThread.jsx';
import { InboxContextPanel } from '../features/inbox/InboxContextPanel.jsx';
import { OrderFormModal } from '../features/orders/OrderFormModal.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import {
  useConversations,
  useConversation,
  useUpdateConversation,
} from '../hooks/data.js';
import { useDebounced } from '../hooks/useDebounced.js';

export default function InboxPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [orderOpen, setOrderOpen] = useState(false);

  const debouncedSearch = useDebounced(search, 300);
  const listRef = useRef(null);
  const composerRef = useRef(null);

  const filters = useMemo(() => {
    const f = { q: debouncedSearch || undefined };
    if (filter === 'unread') f.unread = 'true';
    if (filter === 'facebook') f.channelType = 'facebook';
    if (filter === 'instagram') f.channelType = 'instagram';
    return f;
  }, [filter, debouncedSearch]);

  const { data, isLoading } = useConversations(filters);
  const conversations = useMemo(() => data?.data || [], [data]);
  const { data: activeConversation } = useConversation(conversationId);
  const updateConversation = useUpdateConversation();

  // Mark read on open.
  useEffect(() => {
    if (activeConversation?.conversation?.unread) {
      updateConversation.mutate({ id: conversationId, unread: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, activeConversation?.conversation?.unread]);

  const selectConversation = (c) => navigate(`/inbox/${c._id}`);

  // Keyboard navigation: j/k move, Enter open, / search, r reply.
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';
      if (e.key === '/' && !typing) {
        e.preventDefault();
        document.querySelector('input[aria-label="Search conversations"]')?.focus();
        return;
      }
      if (typing) return;
      const idx = conversations.findIndex((c) => c._id === conversationId);
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = conversations[Math.min(conversations.length - 1, Math.max(0, idx) + 1)];
        if (next) navigate(`/inbox/${next._id}`);
      } else if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = conversations[Math.max(0, (idx < 0 ? 0 : idx) - 1)];
        if (prev) navigate(`/inbox/${prev._id}`);
      } else if (e.key === 'r' && conversationId) {
        e.preventDefault();
        composerRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [conversations, conversationId, navigate]);

  const conv = activeConversation?.conversation;
  const orders = activeConversation?.orders || [];

  return (
    <div className="flex h-full w-full min-w-0 bg-bg">
      {/* List — hidden on mobile when a thread is open */}
      <div
        className={`${
          conversationId ? 'hidden lg:flex' : 'flex'
        } w-full shrink-0 flex-col lg:w-[22rem] xl:w-[24rem]`}
      >
        <ConversationList
          conversations={conversations}
          isLoading={isLoading}
          activeId={conversationId}
          onSelect={selectConversation}
          search={search}
          onSearch={setSearch}
          filter={filter}
          onFilter={setFilter}
          listRef={listRef}
        />
      </div>

      {/* Thread — fills remaining width */}
      <div
        className={`${
          conversationId ? 'flex' : 'hidden lg:flex'
        } min-w-0 flex-1 flex-col border-r border-border/0`}
      >
        {conv ? (
          <MessageThread
            conversation={conv}
            onBack={() => navigate('/inbox')}
            onCreateOrder={() => setOrderOpen(true)}
            composerRef={composerRef}
          />
        ) : (
          <div className="hidden h-full w-full flex-1 flex-col items-center justify-center bg-bg lg:flex">
            <EmptyState
              icon={InboxIcon}
              title="Select a conversation"
              description="Pick a chat from the list to reply, capture an order, or review COD risk."
              action={
                <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-fg-muted shadow-xs">
                  <Keyboard className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                  <span>
                    <kbd className="rounded border border-border bg-surface-2 px-1 py-px font-sans">j</kbd>
                    {' / '}
                    <kbd className="rounded border border-border bg-surface-2 px-1 py-px font-sans">k</kbd>
                    {' navigate · '}
                    <kbd className="rounded border border-border bg-surface-2 px-1 py-px font-sans">/</kbd>
                    {' search · '}
                    <kbd className="rounded border border-border bg-surface-2 px-1 py-px font-sans">r</kbd>
                    {' reply'}
                  </span>
                </div>
              }
            />
          </div>
        )}
      </div>

      {/* Context sidebar */}
      {conv && (
        <InboxContextPanel
          conversation={conv}
          orders={orders}
          onCreateOrder={() => setOrderOpen(true)}
        />
      )}

      {conv && (
        <OrderFormModal
          open={orderOpen}
          onClose={() => setOrderOpen(false)}
          prefill={{
            conversationId: conv._id,
            customerName: conv.customer?.name || conv.participantHandle || '',
            phone: conv.customer?.phones?.[0] || '',
          }}
        />
      )}
    </div>
  );
}
