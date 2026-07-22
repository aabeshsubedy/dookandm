import {
  Search,
  Inbox as InboxIcon,
  Filter,
  Facebook,
  Instagram,
  ShoppingBag,
  X,
} from 'lucide-react';
import { Avatar } from '../../components/common/Avatar.jsx';
import { ChannelDot } from '../../components/common/ChannelBadge.jsx';
import { RiskBadge } from '../../components/common/RiskBadge.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { cn } from '../../lib/cn.js';
import { inboxTime } from '../../lib/format.js';

const filterTabs = [
  { key: 'all', label: 'All', short: 'All' },
  { key: 'unread', label: 'Unread', short: 'Unread' },
  { key: 'facebook', label: 'Facebook', short: 'FB', Icon: Facebook },
  { key: 'instagram', label: 'Instagram', short: 'IG', Icon: Instagram },
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
  const unreadTotal = conversations.reduce((n, c) => n + (c.unread ? c.unreadCount || 1 : 0), 0);

  return (
    <div className="flex h-full flex-col border-r border-border bg-surface">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-4 pb-3 pt-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-semibold tracking-tight text-fg">Inbox</h1>
            {unreadTotal > 0 && (
              <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-brand px-1.5 text-2xs font-semibold tabular-nums text-brand-fg">
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </span>
            )}
          </div>
          <span className="hidden text-2xs text-fg-muted sm:inline" title="Keyboard shortcuts">
            <kbd className="rounded border border-border bg-surface-2 px-1 py-0.5 font-sans text-2xs text-fg-muted">
              j
            </kbd>
            <span className="mx-0.5 text-fg-muted">/</span>
            <kbd className="rounded border border-border bg-surface-2 px-1 py-0.5 font-sans text-2xs text-fg-muted">
              k
            </kbd>
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
            strokeWidth={1.75}
          />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search conversations"
            className="input-base h-9 border-border bg-surface-2/60 pl-9 pr-16 text-sm placeholder:text-fg-muted focus:bg-surface"
            aria-label="Search conversations"
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {search ? (
              <button
                type="button"
                onClick={() => onSearch('')}
                className="rounded-md p-1 text-fg-muted transition-colors hover:bg-surface-3 hover:text-fg"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="hidden rounded border border-border bg-surface px-1.5 py-0.5 font-sans text-2xs text-fg-muted sm:inline">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Filters — segmented control */}
        <div
          className="mt-2.5 flex rounded-lg border border-border bg-surface-2/80 p-0.5"
          role="tablist"
          aria-label="Conversation filters"
        >
          {filterTabs.map((t) => {
            const active = filter === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onFilter(t.key)}
                className={cn(
                  'relative flex flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-1.5 text-2xs font-medium transition-all sm:text-xs',
                  active
                    ? 'bg-surface text-fg shadow-xs'
                    : 'text-fg-muted hover:text-fg-secondary'
                )}
              >
                {t.Icon && (
                  <t.Icon
                    className={cn(
                      'h-3 w-3 shrink-0',
                      active && t.key === 'facebook' && 'text-[#1877F2]',
                      active && t.key === 'instagram' && 'text-[#E1306C]'
                    )}
                    strokeWidth={1.75}
                  />
                )}
                <span>{t.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isLoading ? (
          <ConversationSkeletons />
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={filter === 'all' && !search ? InboxIcon : Filter}
            title={filter === 'all' && !search ? 'No conversations yet' : 'Nothing matches'}
            description={
              filter === 'all' && !search
                ? 'Connect a channel and DMs appear here in real time.'
                : 'Try a different filter or clear your search.'
            }
            className="py-12"
          />
        ) : (
          <ul className="py-1" role="listbox" aria-label="Conversations">
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
  const unreadCount = c.unreadCount > 1 ? c.unreadCount : null;

  return (
    <li role="option" aria-selected={active}>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'group relative flex w-full items-start gap-3 px-3 py-3 text-left transition-colors',
          'focus-visible:z-10',
          active
            ? 'bg-brand-soft'
            : c.unread
              ? 'bg-surface hover:bg-surface-2/80'
              : 'hover:bg-surface-2/60'
        )}
      >
        {/* Active rail */}
        <span
          className={cn(
            'absolute inset-y-1.5 left-0 w-0.5 rounded-full transition-colors',
            active ? 'bg-brand' : 'bg-transparent'
          )}
          aria-hidden
        />

        <div className="relative mt-0.5 shrink-0">
          <Avatar name={name} size="md" className="ring-2 ring-surface" />
          <span className="absolute -bottom-0.5 -right-0.5">
            <ChannelDot type={c.channelType} />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={cn(
                'truncate text-sm leading-tight',
                c.unread || active ? 'font-semibold text-fg' : 'font-medium text-fg'
              )}
            >
              {name}
            </span>
            <span
              className={cn(
                'shrink-0 text-2xs tabular-nums leading-tight',
                c.unread && !active ? 'font-medium text-brand' : 'text-fg-muted'
              )}
            >
              {inboxTime(c.lastMessageAt)}
            </span>
          </div>

          <div className="mt-0.5 flex items-center gap-1.5">
            <p
              className={cn(
                'min-w-0 flex-1 truncate text-xs leading-snug',
                c.unread ? 'font-medium text-fg-secondary' : 'text-fg-muted'
              )}
            >
              {c.lastMessageDirection === 'outbound' && (
                <span className="font-normal text-fg-muted">You · </span>
              )}
              {c.lastMessageSnippet || 'No messages yet'}
            </p>
            {c.unread && (
              <span
                className={cn(
                  'inline-flex shrink-0 items-center justify-center rounded-full bg-brand text-brand-fg',
                  unreadCount
                    ? 'h-4 min-w-[1rem] px-1 text-[10px] font-semibold tabular-nums'
                    : 'h-2 w-2'
                )}
                aria-label={unreadCount ? `${unreadCount} unread` : 'Unread'}
              >
                {unreadCount || null}
              </span>
            )}
          </div>

          {(c.hasOrder || (risk && risk !== 'new')) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              {c.hasOrder && (
                <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-2xs font-medium text-fg-secondary ring-1 ring-border/60">
                  <ShoppingBag className="h-2.5 w-2.5" strokeWidth={2} />
                  Order
                </span>
              )}
              {risk && risk !== 'new' && <RiskBadge label={risk} />}
            </div>
          )}
        </div>
      </button>
    </li>
  );
}

function ConversationSkeletons() {
  return (
    <div className="space-y-0 p-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-2 py-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2 pt-0.5">
            <div className="flex justify-between gap-4">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-3 w-10" />
            </div>
            <Skeleton className="h-3 w-full" />
            {i % 3 === 0 && <Skeleton className="h-4 w-14 rounded-md" />}
          </div>
        </div>
      ))}
    </div>
  );
}
