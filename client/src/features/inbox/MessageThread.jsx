import { useEffect, useRef, useState } from 'react';
import { Send, ArrowLeft, ShoppingBag, Loader2, AlertCircle, Info } from 'lucide-react';
import { Avatar } from '../../components/common/Avatar.jsx';
import { ChannelBadge } from '../../components/common/ChannelBadge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { LoadingPanel } from '../../components/ui/Skeleton.jsx';
import { cn } from '../../lib/cn.js';
import { fullDate } from '../../lib/format.js';
import { useMessages, useSendMessage } from '../../hooks/data.js';

export function MessageThread({ conversation, onBack, onCreateOrder, composerRef }) {
  const { data, isLoading } = useMessages(conversation?._id);
  const sendMessage = useSendMessage(conversation?._id);
  const [text, setText] = useState('');
  const scrollRef = useRef(null);
  const messages = data?.data || [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const name = conversation?.customer?.name || conversation?.participantHandle || 'Unknown';

  const submit = (e) => {
    e?.preventDefault();
    const value = text.trim();
    if (!value) return;
    setText('');
    sendMessage.mutate(value);
  };

  const onKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
  };

  return (
    <div className="flex h-full w-full min-w-0 flex-1 flex-col bg-bg">
      <div className="flex w-full items-center gap-3 border-b border-border bg-surface px-4 py-2.5">
        <button
          className="rounded-lg p-1 text-fg-secondary hover:bg-surface-2 lg:hidden"
          onClick={onBack}
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar name={name} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-fg">{name}</p>
            <ChannelBadge type={conversation.channelType} size="sm" />
          </div>
          <p className="truncate text-xs text-fg-muted">
            {conversation.customer?.phones?.[0] || `@${conversation.participantHandle || 'unknown'}`}
          </p>
        </div>
        <Button size="sm" variant="primary" onClick={onCreateOrder}>
          <ShoppingBag className="h-4 w-4" />
          <span className="hidden sm:inline">Create order</span>
        </Button>
      </div>

      <div ref={scrollRef} className="min-h-0 w-full flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {isLoading ? (
          <LoadingPanel label="Loading messages…" />
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-fg-muted">
            <Info className="h-5 w-5 opacity-50" />
            <p className="text-sm">No messages yet.</p>
          </div>
        ) : (
          <div className="w-full space-y-2">
            {messages.map((m) => (
              <MessageBubble key={m._id} message={m} />
            ))}
          </div>
        )}
      </div>

      <form onSubmit={submit} className="w-full border-t border-border bg-surface px-4 py-3 sm:px-6">
        <div className="flex w-full items-end gap-2">
          <textarea
            ref={composerRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Type a reply…  (⌘/Ctrl + Enter)"
            className="input-base max-h-32 min-h-[40px] w-full flex-1 resize-none py-2"
          />
          <Button
            type="submit"
            variant="primary"
            size="icon"
            className="h-10 w-10 shrink-0"
            disabled={!text.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message: m }) {
  const outbound = m.direction === 'outbound';
  return (
    <div className={cn('flex', outbound ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[min(85%,42rem)] rounded-xl px-3 py-2 text-sm',
          outbound
            ? 'rounded-br-sm bg-brand text-brand-fg'
            : 'rounded-bl-sm border border-border bg-surface text-fg'
        )}
      >
        {m.text ? (
          <p className="whitespace-pre-wrap break-words">{m.text}</p>
        ) : (
          <p className="italic opacity-70">[attachment]</p>
        )}
        <div
          className={cn(
            'mt-1 flex items-center justify-end gap-1 text-2xs',
            outbound ? 'text-white/70' : 'text-fg-muted'
          )}
          title={fullDate(m.createdAt)}
        >
          <span>
            {new Date(m.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </span>
          {outbound && m.status === 'queued' && <Loader2 className="h-3 w-3 animate-spin" />}
          {outbound && m.status === 'failed' && <AlertCircle className="h-3 w-3" />}
        </div>
      </div>
    </div>
  );
}
