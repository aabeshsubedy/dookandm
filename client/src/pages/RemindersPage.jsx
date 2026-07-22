import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell,
  Plus,
  CalendarClock,
  Check,
  User,
  List,
  CalendarDays,
} from 'lucide-react';
import {
  format,
  isSameDay,
  parseISO,
  startOfDay,
  isBefore,
  isToday,
  isValid,
} from 'date-fns';
import { FEATURES } from '@dokaandm/shared';
import { Page } from '../components/layout/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Calendar } from '../components/ui/Calendar.jsx';
import { DatePicker } from '../components/ui/DatePicker.jsx';
import { UpgradeGate } from '../components/common/UpgradeGate.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useReminders, useCreateReminder, useUpdateReminder } from '../hooks/data.js';
import { cn } from '../lib/cn.js';
import { fullDate } from '../lib/format.js';
import { toast } from '../store/toastStore.js';
import { apiError } from '../lib/api.js';

const listTabs = [
  { key: 'open', label: 'Open' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Today' },
  { key: 'done', label: 'Done' },
];

export default function RemindersPage() {
  return (
    <Page>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Reminders</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Follow-ups for restocks, callbacks, and customer pings
          </p>
        </div>
      </header>
      <UpgradeGate
        feature={FEATURES.CRM}
        title="Unlock reminders"
        description="Set follow-ups like “ping when new stock arrives”."
      >
        <RemindersContent />
      </UpgradeGate>
    </Page>
  );
}

function RemindersContent() {
  const [view, setView] = useState('list');
  const [tab, setTab] = useState('open');
  const [month, setMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState(format(new Date(), 'yyyy-MM-dd'));

  const listFilter =
    tab === 'open' ? { status: 'open' } : tab === 'done' ? { status: 'done' } : { due: tab };
  const { data: listData, isLoading: listLoading } = useReminders(listFilter);
  const { data: openData, isLoading: openLoading } = useReminders({ status: 'open' });

  const create = useCreateReminder();
  const update = useUpdateReminder();

  const listReminders = listData?.data || [];
  const openReminders = useMemo(() => openData?.data || [], [openData?.data]);

  const markers = useMemo(() => {
    const map = {};
    const now = startOfDay(new Date());
    openReminders.forEach((r) => {
      if (!r.dueAt) return;
      const d = parseISO(r.dueAt);
      if (!isValid(d)) return;
      const key = format(d, 'yyyy-MM-dd');
      const overdue = r.status === 'open' && isBefore(startOfDay(d), now);
      if (!map[key]) map[key] = { count: 0, overdue: false };
      map[key].count += 1;
      if (overdue) map[key].overdue = true;
    });
    return map;
  }, [openReminders]);

  const dayReminders = useMemo(() => {
    if (!selectedDay) return [];
    return openReminders
      .filter(
        (r) => r.dueAt && isValid(parseISO(r.dueAt)) && isSameDay(parseISO(r.dueAt), selectedDay)
      )
      .sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  }, [openReminders, selectedDay]);

  const submit = async (e) => {
    e?.preventDefault();
    if (!title.trim() || !dueAt) {
      toast.error('Add a title and due date');
      return;
    }
    try {
      await create.mutateAsync({ title: title.trim(), dueAt });
      setTitle('');
      toast.success('Reminder created');
      if (dueAt && isValid(parseISO(dueAt))) {
        setSelectedDay(parseISO(dueAt));
        setMonth(parseISO(dueAt));
      }
    } catch (err) {
      toast.error(apiError(err).message);
    }
  };

  return (
    <div className="mt-6 space-y-4">
      {/* Quick add */}
      <section className="rounded-2xl border border-border bg-surface shadow-xs">
        <div className="border-b border-border/70 px-4 py-3 sm:px-5">
          <p className="text-sm font-semibold tracking-tight text-fg">Add follow-up</p>
          <p className="mt-0.5 text-xs text-fg-muted">Title + due date — attach a customer later from their profile if needed.</p>
        </div>
        <form
          onSubmit={submit}
          className="flex flex-col gap-2.5 p-4 sm:flex-row sm:items-center sm:px-5 sm:py-4"
        >
          <Input
            className="h-9 min-w-0 flex-1 text-sm"
            placeholder="What do you need to remember?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <DatePicker
            value={dueAt}
            onChange={setDueAt}
            className="relative z-20 w-full sm:w-48"
            placeholder="Due date"
          />
          <Button type="submit" variant="primary" size="sm" loading={create.isPending} className="shrink-0">
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Add
          </Button>
        </form>
      </section>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-lg border border-border bg-surface-2/80 p-0.5 shadow-xs"
          role="tablist"
          aria-label="Reminders view"
        >
          <SegmentTab
            active={view === 'list'}
            onClick={() => setView('list')}
            icon={List}
            label="List"
          />
          <SegmentTab
            active={view === 'calendar'}
            onClick={() => setView('calendar')}
            icon={CalendarDays}
            label="Calendar"
          />
        </div>

        {view === 'list' && (
          <div
            className="inline-flex rounded-lg border border-border bg-surface-2/80 p-0.5 shadow-xs"
            role="tablist"
            aria-label="Filter reminders"
          >
            {listTabs.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'rounded-md px-2.5 py-1.5 text-xs font-medium transition-all sm:px-3 sm:text-sm',
                  tab === t.key
                    ? 'bg-surface text-fg shadow-xs'
                    : 'text-fg-muted hover:text-fg-secondary'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {view === 'calendar' ? (
        <CalendarView
          month={month}
          onMonthChange={setMonth}
          selectedDay={selectedDay}
          onSelectDay={(d) => {
            setSelectedDay(d);
            setDueAt(format(d, 'yyyy-MM-dd'));
          }}
          markers={markers}
          dayReminders={dayReminders}
          isLoading={openLoading}
          onComplete={(id) => update.mutate({ id, status: 'done' })}
        />
      ) : listLoading ? (
        <ReminderSkeletons />
      ) : listReminders.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface shadow-xs">
          <EmptyState
            icon={Bell}
            title="Nothing here"
            description={
              tab === 'done'
                ? 'Completed reminders will show here.'
                : 'Add a follow-up above, or switch filters.'
            }
            className="py-12"
          />
        </div>
      ) : (
        <ul className="space-y-2">
          {listReminders.map((r) => (
            <li key={r._id}>
              <ReminderRow
                reminder={r}
                onComplete={() => update.mutate({ id: r._id, status: 'done' })}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CalendarView({
  month,
  onMonthChange,
  selectedDay,
  onSelectDay,
  markers,
  dayReminders,
  isLoading,
  onComplete,
}) {
  const dayLabel = selectedDay
    ? isToday(selectedDay)
      ? 'Today'
      : format(selectedDay, 'EEEE, MMM d')
    : 'Select a day';

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs lg:col-span-3">
        <div className="p-5 sm:p-6">
          <Calendar
            month={month}
            selected={selectedDay}
            onSelect={onSelectDay}
            onMonthChange={onMonthChange}
            markers={markers}
          />
          <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border/70 pt-4 text-2xs text-fg-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand" /> Has reminders
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-warning" /> Overdue day
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand-soft ring-1 ring-brand" /> Today
            </span>
          </div>
        </div>
      </section>

      <section className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-xs lg:col-span-2">
        <div className="border-b border-border/70 px-4 py-3.5 sm:px-5">
          <p className="text-2xs font-semibold uppercase tracking-wider text-fg-muted">Agenda</p>
          <p className="mt-0.5 text-base font-semibold tracking-tight text-fg">{dayLabel}</p>
          <p className="text-xs text-fg-muted">
            {dayReminders.length === 0
              ? 'No open follow-ups'
              : `${dayReminders.length} open follow-up${dayReminders.length === 1 ? '' : 's'}`}
          </p>
        </div>

        <div className="min-h-[280px] flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="space-y-2 p-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : dayReminders.length === 0 ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center px-4 text-center">
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-surface-2 text-fg-muted">
                <CalendarDays className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <p className="text-sm font-medium text-fg">Clear day</p>
              <p className="mt-1 text-xs text-fg-muted">
                Pick another date or add a reminder above.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {dayReminders.map((r) => {
                const overdue =
                  r.status === 'open' &&
                  isBefore(startOfDay(parseISO(r.dueAt)), startOfDay(new Date()));
                return (
                  <li
                    key={r._id}
                    className={cn(
                      'rounded-xl border px-3 py-3 transition-colors',
                      overdue
                        ? 'border-warning/25 bg-warning-soft/40'
                        : 'border-border bg-bg hover:bg-surface-2/40'
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <CompleteButton onClick={() => onComplete(r._id)} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-fg">{r.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-2xs text-fg-muted">
                          <span className={cn(overdue && 'font-medium text-warning')}>
                            {overdue ? 'Overdue' : 'Open'}
                          </span>
                          {r.customer && (
                            <Link
                              to={`/customers/${r.customer._id}`}
                              className="inline-flex items-center gap-1 font-medium text-brand hover:text-brand-hover"
                            >
                              <User className="h-3 w-3" strokeWidth={1.75} />
                              {r.customer.name || r.customer.phones?.[0]}
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function ReminderRow({ reminder: r, onComplete }) {
  const overdue = r.status === 'open' && new Date(r.dueAt) < new Date();
  const done = r.status === 'done';

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border bg-surface px-4 py-3.5 shadow-xs transition-colors',
        overdue && !done
          ? 'border-warning/25 bg-warning-soft/30'
          : 'border-border hover:border-border-strong'
      )}
    >
      {done ? (
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success text-white">
          <Check className="h-3 w-3" strokeWidth={2.5} />
        </span>
      ) : (
        <CompleteButton onClick={onComplete} />
      )}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm font-medium',
            done ? 'text-fg-muted line-through' : 'text-fg'
          )}
        >
          {r.title}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs">
          <span
            className={cn(
              'inline-flex items-center gap-1',
              overdue && !done ? 'font-medium text-warning' : 'text-fg-muted'
            )}
          >
            <CalendarClock className="h-3 w-3" strokeWidth={1.75} />
            {fullDate(r.dueAt).split(' · ')[0]}
            {overdue && !done && ' · overdue'}
          </span>
          {r.customer && (
            <Link
              to={`/customers/${r.customer._id}`}
              className="inline-flex items-center gap-1 font-medium text-brand hover:text-brand-hover"
            >
              <User className="h-3 w-3" strokeWidth={1.75} />
              {r.customer.name || r.customer.phones?.[0]}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function CompleteButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-border text-transparent transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
      aria-label="Mark done"
    >
      <Check className="h-3 w-3" strokeWidth={2.5} />
    </button>
  );
}

function SegmentTab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:text-sm',
        active ? 'bg-surface text-fg shadow-xs' : 'text-fg-muted hover:text-fg-secondary'
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
    </button>
  );
}

function ReminderSkeletons() {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5"
        >
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
