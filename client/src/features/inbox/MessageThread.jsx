import { useEffect, useRef, useState } from 'react';
import {
  Send,
  ArrowLeft,
  ShoppingBag,
  Loader2,
  AlertCircle,
  MessageSquare,
  Check,
  CheckCheck,
  Phone,
} from 'lucide-react';
import { isToday, isYesterday, format, differenceInMinutes } from 'date-fns';
import { Avatar } from '../../components/common/Avatar.jsx';
import { ChannelBadge } from '../../components/common/ChannelBadge.jsx';
import { RiskBadge } from '../../components/common/RiskBadge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { LoadingPanel } from '../../components/ui/Skeleton.jsx';
import { cn } from '../../lib/cn.js';
import { fullDate } from '../../lib/format.js';
import { useMessages, useSendMessage } from '../../hooks/data.js';

function dayLabel(date) {
  const d = new Date(date);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMM d');
}

/** Group messages for visual clustering + day separators. */
function buildMessageGroups(messages) {
  const groups = [];
  let currentDay = null;
  let cluster = null;

  messages.forEach((m) => {
    const day = dayLabel(m.createdAt);
    if (day !== currentDay) {
      currentDay = day;
      groups.push({ type: 'day', id: `day-${day}-${m._id}`, label: day });
      cluster = null;
    }

    const prev = cluster?.messages[cluster.messages.length - 1];
    const sameDirection = prev && prev.direction === m.direction;
    const closeInTime =
      prev && Math.abs(differenceInMinutes(new Date(m.createdAt), new Date(prev.createdAt))) < 8;

    if (sameDirection && closeInTime) {
      cluster.messages.push(m);
    } else {
      cluster = { type: 'cluster', id: m._id, direction: m.direction, messages: [m] };
      groups.push(cluster);
    }
  });

  return groups;
}

export function MessageThread({ conversation, onBack, onCreateOrder, composerRef }) {
  const { data, isLoading } = useMessages(conversation?._id);
  const sendMessage = useSendMessage(conversation?._id);
  const [text, setText] = useState('');
  const scrollRef = useRef(null);
  const messages = data?.data || [];
  const groups = buildMessageGroups(messages);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: messages.length > 20 ? 'auto' : 'smooth' });
  }, [messages.length, conversation?._id]);

  // Auto-grow textarea
  useEffect(() => {
    const el = composerRef?.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [text, composerRef]);

  const name = conversation?.customer?.name || conversation?.participantHandle || 'Unknown';
  const phone = conversation?.customer?.phones?.[0];
  const handle = conversation?.participantHandle;
  const risk = conversation?.customer?.riskCache?.label;
  const canSend = Boolean(text.trim()) && !sendMessage.isPending;

  const submit = (e) => {
    e?.preventDefault();
    const value = text.trim();
    if (!value || sendMessage.isPending) return;
    setText('');
    sendMessage.mutate(value);
  };

  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="flex h-full w-full min-w-0 flex-1 flex-col bg-bg">
      {/* Thread header */}
      <header className="flex w-full shrink-0 items-center gap-3 border-b border-border bg-surface px-3 py-2.5 sm:px-4">
        <button
          type="button"
          className="rounded-lg p-1.5 text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg lg:hidden"
          onClick={onBack}
          aria-label="Back to conversations"
        >
          <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>

        <div className="relative shrink-0">
          <Avatar name={name} size="sm" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <p className="truncate text-sm font-semibold tracking-tight text-fg">{name}</p>
            <ChannelBadge type={conversation.channelType} size="sm" withLabel />
            {risk && risk !== 'new' && <RiskBadge label={risk} />}
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-fg-muted">
            {phone ? (
              <>
                <Phone className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                <span className="truncate">{phone}</span>
              </>
            ) : (
              <span className="truncate">@{handle || 'unknown'}</span>
            )}
            {conversation.hasOrder && (
              <>
                <span className="text-border-strong">·</span>
                <span className="inline-flex items-center gap-1 text-fg-secondary">
                  <ShoppingBag className="h-3 w-3" /> Has order
                </span>
              </>
            )}
          </p>
        </div>

        <Button size="sm" variant="primary" onClick={onCreateOrder} className="shrink-0 shadow-xs">
          <ShoppingBag className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Create order</span>
          <span className="sm:hidden">Order</span>
        </Button>
      </header>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="inbox-thread-scroll min-h-0 w-full flex-1 overflow-y-auto overscroll-contain"
      >
        {isLoading ? (
          <LoadingPanel label="Loading messages…" />
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-fg-muted">
              <MessageSquare className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-medium text-fg">No messages yet</p>
              <p className="mt-1 max-w-xs text-xs text-fg-muted">
                When this customer messages you, the thread will show up here. You can still create an
                order anytime.
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-3 px-3 py-5 sm:px-6">
            {groups.map((g) =>
              g.type === 'day' ? (
                <DaySeparator key={g.id} label={g.label} />
              ) : (
                <MessageCluster key={g.id} direction={g.direction} messages={g.messages} />
              )
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border bg-surface px-3 py-3 sm:px-4">
        <form onSubmit={submit} className="mx-auto w-full max-w-3xl">
          <div
            className={cn(
              'flex items-end gap-2 rounded-2xl border border-border bg-bg p-1.5 shadow-xs transition-shadow',
              'focus-within:border-brand/40 focus-within:ring-2 focus-within:ring-brand/15'
            )}
          >
            <textarea
              ref={composerRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Write a reply…"
              className={cn(
                'max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-fg',
                'placeholder:text-fg-muted focus:outline-none'
              )}
              aria-label="Message reply"
            />
            <Button
              type="submit"
              variant="primary"
              size="icon"
              className={cn(
                'mb-0.5 mr-0.5 h-9 w-9 shrink-0 rounded-xl transition-opacity',
                !canSend && 'opacity-40'
              )}
              disabled={!canSend}
              aria-label="Send message"
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="mt-1.5 flex items-center justify-between px-1">
            <p className="text-2xs text-fg-muted">
              <kbd className="rounded border border-border bg-surface-2 px-1 py-px font-sans">⌘</kbd>
              <span className="mx-0.5">+</span>
              <kbd className="rounded border border-border bg-surface-2 px-1 py-px font-sans">Enter</kbd>
              <span className="ml-1.5 hidden sm:inline">to send</span>
            </p>
            {sendMessage.isError && (
              <p className="text-2xs font-medium text-danger">Failed to send — try again</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function DaySeparator({ label }) {
  return (
    <div className="flex items-center gap-3 py-2" role="separator" aria-label={label}>
      <div className="h-px flex-1 bg-border" />
      <span className="shrink-0 rounded-full border border-border bg-surface px-2.5 py-0.5 text-2xs font-medium text-fg-muted shadow-xs">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function MessageCluster({ direction, messages }) {
  const outbound = direction === 'outbound';
  return (
    <div className={cn('flex flex-col gap-0.5', outbound ? 'items-end' : 'items-start')}>
      {messages.map((m, i) => (
        <MessageBubble
          key={m._id}
          message={m}
          outbound={outbound}
          isFirst={i === 0}
          isLast={i === messages.length - 1}
          showMeta={i === messages.length - 1}
        />
      ))}
    </div>
  );
}

function MessageBubble({ message: m, outbound, isFirst, isLast, showMeta }) {
  const radius = outbound
    ? cn(
        'rounded-2xl',
        isFirst && isLast && 'rounded-br-md',
        isFirst && !isLast && 'rounded-br-md',
        !isFirst && isLast && 'rounded-tr-md rounded-br-md',
        !isFirst && !isLast && 'rounded-r-md'
      )
    : cn(
        'rounded-2xl',
        isFirst && isLast && 'rounded-bl-md',
        isFirst && !isLast && 'rounded-bl-md',
        !isFirst && isLast && 'rounded-tl-md rounded-bl-md',
        !isFirst && !isLast && 'rounded-l-md'
      );

  return (
    <div className={cn('flex max-w-[min(85%,28rem)] flex-col', outbound ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'px-3.5 py-2 text-sm leading-relaxed shadow-xs',
          radius,
          outbound
            ? 'bg-brand text-brand-fg'
            : 'border border-border bg-surface text-fg'
        )}
      >
        {m.text ? (
          <p className="whitespace-pre-wrap break-words">{m.text}</p>
        ) : (
          <p className={cn('italic', outbound ? 'text-white/70' : 'text-fg-muted')}>[attachment]</p>
        )}
      </div>
      {showMeta && (
        <div
          className={cn(
            'mt-1 flex items-center gap-1 px-1 text-2xs tabular-nums',
            outbound ? 'text-fg-muted' : 'text-fg-muted'
          )}
          title={fullDate(m.createdAt)}
        >
          <span>
            {new Date(m.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
          {outbound && <DeliveryStatus status={m.status} />}
        </div>
      )}
    </div>
  );
}

function DeliveryStatus({ status }) {
  if (status === 'queued' || status === 'sending') {
    return <Loader2 className="h-3 w-3 animate-spin text-fg-muted" aria-label="Sending" />;
  }
  if (status === 'failed') {
    return <AlertCircle className="h-3 w-3 text-danger" aria-label="Failed" />;
  }
  if (status === 'delivered' || status === 'read') {
    return <CheckCheck className="h-3 w-3 text-brand" aria-label="Delivered" />;
  }
  // sent / default
  return <Check className="h-3 w-3 text-fg-muted" aria-label="Sent" />;
}
