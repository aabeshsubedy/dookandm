import { Search, Inbox as InboxIcon, Filter } from 'lucide-react';
import { Avatar } from '../../components/common/Avatar.jsx';
import { ChannelDot } from '../../components/common/ChannelBadge.jsx';
import { RiskBadge } from '../../components/common/RiskBadge.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { cn } from '../../lib/cn.js';
import { inboxTime } from '../../lib/format.js';

const filterTabs = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
];

export function ConversationList({
  conversations,
  isLoading,
  activeId,
  onSelect,
  search,
  onSearch,
  filter,
  onFilter,
  listRef,
}) {
  return (
    <div className="flex h-full flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-3 pb-2.5 pt-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search…  (/)"
            className="input-base h-9 pl-8 text-sm"
            aria-label="Search conversations"
          />
        </div>
        <div className="mt-2 flex items-center gap-1 overflow-x-auto">
          {filterTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => onFilter(t.key)}
              className={cn(
                'shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                filter === t.key
                  ? 'bg-brand text-brand-fg'
                  : 'bg-surface-2 text-fg-secondary hover:text-fg'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <ConversationSkeletons />
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={filter === 'all' ? InboxIcon : Filter}
            title={filter === 'all' ? 'No conversations yet' : 'Nothing matches'}
            description={
              filter === 'all'
                ? 'Connect a channel and DMs appear here in real time.'
                : 'Try a different filter or search.'
            }
            className="py-10"
          />
        ) : (
          <ul>
            {conversations.map((c) => (
              <ConversationRow
                key={c._id}
                conversation={c}
                active={c._id === activeId}
                onSelect={() => onSelect(c)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ConversationRow({ conversation: c, active, onSelect }) {
  const name = c.customer?.name || c.participantHandle || 'Unknown';
  const risk = c.customer?.riskCache?.label;
  return (
    <li>
      <button
        onClick={onSelect}
        className={cn(
          'flex w-full items-start gap-3 border-b border-border px-3 py-2.5 text-left transition-colors',
          active ? 'bg-brand-soft' : 'hover:bg-surface-2',
          c.unread && !active && 'bg-surface-2/50'
        )}
      >
        <div className="relative">
          <Avatar name={name} size="md" />
          <span className="absolute -bottom-0.5 -right-0.5">
            <ChannelDot type={c.channelType} />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span
              className={cn(
                'truncate text-sm',
                c.unread ? 'font-semibold text-fg' : 'font-medium text-fg-secondary'
              )}
            >
              {name}
            </span>
            <span className="shrink-0 text-2xs text-fg-muted">{inboxTime(c.lastMessageAt)}</span>
          </div>
          <p className={cn('mt-0.5 truncate text-xs', c.unread ? 'text-fg-secondary' : 'text-fg-muted')}>
            {c.lastMessageDirection === 'outbound' && <span className="text-fg-muted">You: </span>}
            {c.lastMessageSnippet || 'No messages'}
          </p>
          <div className="mt-1 flex items-center gap-1.5">
            {c.hasOrder && (
              <span className="rounded bg-surface-2 px-1.5 py-0.5 text-2xs font-medium text-fg-secondary">
                Order
              </span>
            )}
            {risk && risk !== 'new' && <RiskBadge label={risk} />}
          </div>
        </div>
        {c.unread && (
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" aria-label="Unread" />
        )}
      </button>
    </li>
  );
}

function ConversationSkeletons() {
  return (
    <div className="space-y-1 p-3">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 py-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
