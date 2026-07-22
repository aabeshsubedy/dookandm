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
  Sparkles,
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
import { Page, PageHeader } from '../components/layout/PageHeader.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input } from '../components/ui/Input.jsx';
import { Calendar } from '../components/ui/Calendar.jsx';
import { DatePicker } from '../components/ui/DatePicker.jsx';
import { UpgradeGate } from '../components/common/UpgradeGate.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { LoadingPanel } from '../components/ui/Skeleton.jsx';
import { useReminders, useCreateReminder, useUpdateReminder } from '../hooks/data.js';
import { cn } from '../lib/cn.js';
import { fullDate } from '../lib/format.js';
import { toast } from '../store/toastStore.js';
import { apiError } from '../lib/api.js';

const listTabs = [
  { key: 'open', label: 'Open' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Due today' },
  { key: 'done', label: 'Done' },
];

export default function RemindersPage() {
  return (
    <Page>
      <PageHeader title="Reminders" description="Never forget a customer follow-up." />
      <UpgradeGate
        feature={FEATURES.CRM}
        title="Unlock reminders"
        description="Set follow-ups like 'ping when new stock arrives'."
      >
        <RemindersContent />
      </UpgradeGate>
    </Page>
  );
}

function RemindersContent() {
  const [view, setView] = useState('list'); // list | calendar
  const [tab, setTab] = useState('open');
  const [month, setMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Calendar needs open items; list uses tab filters.
  const listFilter =
    tab === 'open' ? { status: 'open' } : tab === 'done' ? { status: 'done' } : { due: tab };
  const { data: listData, isLoading: listLoading } = useReminders(listFilter);
  const { data: openData, isLoading: openLoading } = useReminders({ status: 'open' });

  const create = useCreateReminder();
  const update = useUpdateReminder();

  const listReminders = listData?.data || [];
  const openReminders = openData?.data || [];

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
      .filter((r) => r.dueAt && isValid(parseISO(r.dueAt)) && isSameDay(parseISO(r.dueAt), selectedDay))
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
    <div className="mt-5 space-y-4">
      {/* Create bar */}
      <Card>
        <div className="border-b border-border bg-surface-2/40 px-4 py-2.5">
          <div className="flex items-center gap-2 text-xs font-medium text-fg-muted">
            <Sparkles className="h-3.5 w-3.5 text-brand" />
            Quick add follow-up
          </div>
        </div>
        <CardBody>
          <form
            onSubmit={submit}
            className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <Input
              className="min-w-0 flex-1"
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
            <Button type="submit" variant="primary" loading={create.isPending} className="shrink-0">
              <Plus className="h-4 w-4" /> Add
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* View switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
          <ViewTab
            active={view === 'list'}
            onClick={() => setView('list')}
            icon={List}
            label="List"
          />
          <ViewTab
            active={view === 'calendar'}
            onClick={() => setView('calendar')}
            icon={CalendarDays}
            label="Calendar"
          />
        </div>

        {view === 'list' && (
          <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
            {listTabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  tab === t.key
                    ? 'bg-brand text-brand-fg'
                    : 'text-fg-secondary hover:bg-surface-2'
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
        <LoadingPanel />
      ) : listReminders.length === 0 ? (
        <Card>
          <EmptyState icon={Bell} title="Nothing here" description="No reminders in this view." />
        </Card>
      ) : (
        <div className="space-y-2">
          {listReminders.map((r) => (
            <ReminderRow
              key={r._id}
              reminder={r}
              onComplete={() => update.mutate({ id: r._id, status: 'done' })}
            />
          ))}
        </div>
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
      {/* Calendar panel */}
      <Card className="relative overflow-hidden lg:col-span-3">
        {/* Futuristic frame accents */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-brand/40" />
        <div className="pointer-events-none absolute left-0 top-0 h-16 w-px bg-brand/30" />
        <div className="pointer-events-none absolute right-0 top-0 h-16 w-px bg-brand/20" />

        <CardBody className="p-5 sm:p-6">
          <Calendar
            month={month}
            selected={selectedDay}
            onSelect={onSelectDay}
            onMonthChange={onMonthChange}
            markers={markers}
          />

          {/* Legend */}
          <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-border pt-4 text-2xs text-fg-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-brand" /> Has reminders
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-danger" /> Overdue day
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full ring-1 ring-brand bg-brand-soft" /> Today
            </span>
          </div>
        </CardBody>
      </Card>

      {/* Day agenda */}
      <Card className="flex flex-col lg:col-span-2">
        <div className="border-b border-border px-4 py-3.5">
          <p className="text-2xs font-semibold uppercase tracking-wider text-fg-muted">Agenda</p>
          <p className="mt-0.5 text-base font-semibold text-fg">{dayLabel}</p>
          <p className="text-xs text-fg-muted">
            {dayReminders.length === 0
              ? 'No open follow-ups'
              : `${dayReminders.length} open follow-up${dayReminders.length === 1 ? '' : 's'}`}
          </p>
        </div>

        <div className="min-h-[280px] flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <LoadingPanel label="Loading…" />
          ) : dayReminders.length === 0 ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center px-4 text-center">
              <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-surface-2 text-fg-muted">
                <CalendarDays className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-fg">Clear day</p>
              <p className="mt-1 text-xs text-fg-muted">
                Select another date or add a reminder above.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {dayReminders.map((r) => {
                const overdue =
                  r.status === 'open' && isBefore(startOfDay(parseISO(r.dueAt)), startOfDay(new Date()));
                return (
                  <li
                    key={r._id}
                    className={cn(
                      'rounded-xl border border-border bg-surface p-3 transition-colors hover:bg-surface-2/50',
                      overdue && 'border-danger/30 bg-danger-soft/40'
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={() => onComplete(r._id)}
                        className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-border text-transparent transition-colors hover:border-brand hover:text-brand"
                        aria-label="Mark done"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-fg">{r.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-2xs text-fg-muted">
                          <span className={cn(overdue && 'font-medium text-danger')}>
                            {overdue ? 'Overdue' : 'Open'}
                          </span>
                          {r.customer && (
                            <Link
                              to={`/customers/${r.customer._id}`}
                              className="link-accent inline-flex items-center gap-1"
                            >
                              <User className="h-3 w-3" />
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
      </Card>
    </div>
  );
}

function ReminderRow({ reminder: r, onComplete }) {
  const overdue = r.status === 'open' && new Date(r.dueAt) < new Date();
  return (
    <Card>
      <div className="flex items-center gap-3 p-4">
        {r.status === 'open' ? (
          <button
            onClick={onComplete}
            className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-border text-transparent transition-colors hover:border-brand hover:text-brand"
            aria-label="Mark done"
          >
            <Check className="h-3 w-3" />
          </button>
        ) : (
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success text-white">
            <Check className="h-3 w-3" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              'text-sm font-medium',
              r.status === 'done' ? 'text-fg-muted line-through' : 'text-fg'
            )}
          >
            {r.title}
          </p>
          <div className="mt-0.5 flex items-center gap-3 text-2xs">
            <span
              className={cn('flex items-center gap-1', overdue ? 'text-danger' : 'text-fg-muted')}
            >
              <CalendarClock className="h-3 w-3" /> {fullDate(r.dueAt).split(' · ')[0]}
              {overdue && ' · overdue'}
            </span>
            {r.customer && (
              <Link
                to={`/customers/${r.customer._id}`}
                className="link-accent flex items-center gap-1"
              >
                <User className="h-3 w-3" /> {r.customer.name || r.customer.phones?.[0]}
              </Link>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function ViewTab({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
        active ? 'bg-brand text-brand-fg' : 'text-fg-secondary hover:bg-surface-2'
      )}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}
