import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  Phone,
  Plus,
  StickyNote,
  Tag,
  Bell,
  X,
  CalendarClock,
  ShoppingBag,
  TrendingUp,
  Package,
  ChevronRight,
  Check,
} from 'lucide-react';
import { CUSTOMER_TAG_PRESETS, planHasFeature, FEATURES } from '@dokaandm/shared';
import { Page } from '../components/layout/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input, Textarea } from '../components/ui/Input.jsx';
import { DatePicker } from '../components/ui/DatePicker.jsx';
import { Avatar } from '../components/common/Avatar.jsx';
import { RiskBadge } from '../components/common/RiskBadge.jsx';
import { OrderStatusBadge, PaymentBadge } from '../components/common/StatusBadge.jsx';
import { ChannelBadge } from '../components/common/ChannelBadge.jsx';
import { CodRiskPanel } from '../features/orders/CodRiskPanel.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import {
  useCustomer,
  useUpdateCustomer,
  useAddNote,
  useCreateReminder,
  useUpdateReminder,
} from '../hooks/data.js';
import { useAuthStore } from '../store/authStore.js';
import { nprLabel, fullDate, relativeTime } from '../lib/format.js';
import { toast } from '../store/toastStore.js';
import { apiError } from '../lib/api.js';
import { cn } from '../lib/cn.js';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = useCustomer(id);
  const plan = useAuthStore((s) => s.plan);
  const hasCrm = planHasFeature(plan?.plan || 'free', FEATURES.CRM);
  const hasRisk = planHasFeature(plan?.plan || 'free', FEATURES.COD_RISK);

  if (isLoading) {
    return (
      <Page>
        <DetailSkeleton />
      </Page>
    );
  }

  if (!data?.customer) {
    return (
      <Page>
        <div className="rounded-2xl border border-border bg-surface shadow-xs">
          <EmptyState
            title="Customer not found"
            description="It may have been removed or you don’t have access."
            action={
              <Link to="/customers">
                <Button variant="secondary" size="sm">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to customers
                </Button>
              </Link>
            }
          />
        </div>
      </Page>
    );
  }

  const { customer, orders = [], reminders = [] } = data;
  const name = customer.name || customer.phones?.[0] || 'Unnamed';
  const risk = customer.riskCache?.label;

  return (
    <Page>
      <Link
        to="/customers"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        All customers
      </Link>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        {/* Sidebar */}
        <div className="space-y-4 lg:col-span-1">
          {/* Profile hero */}
          <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
            <div className="border-b border-border/70 px-5 py-5">
              <div className="flex items-start gap-3.5">
                <Avatar name={name} size="lg" className="ring-2 ring-border" />
                <div className="min-w-0 flex-1 pt-0.5">
                  <h1 className="truncate text-lg font-semibold tracking-tight text-fg">{name}</h1>
                  {customer.phones?.map((p) => (
                    <p
                      key={p}
                      className="mt-1 flex items-center gap-1.5 text-sm text-fg-secondary"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0 text-fg-muted" strokeWidth={1.75} />
                      <span className="truncate">{p}</span>
                    </p>
                  ))}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {risk && <RiskBadge label={risk} size="md" />}
                    {customer.isProvisional && <BadgeSoft>Provisional</BadgeSoft>}
                  </div>
                </div>
              </div>

              {customer.channelIdentities?.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {customer.channelIdentities.map((ci, i) => (
                    <ChannelBadge key={i} type={ci.type} size="sm" withLabel />
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-px bg-border">
              <StatCell
                icon={ShoppingBag}
                label="Orders"
                value={String(customer.stats?.totalOrders || 0)}
              />
              <StatCell
                icon={TrendingUp}
                label="Total spent"
                value={nprLabel(customer.stats?.lifetimeValuePaisa || 0)}
              />
            </div>
          </section>

          {hasRisk && (
            <section className="rounded-2xl border border-border bg-surface p-4 shadow-xs sm:p-5">
              <SectionHead
                title="COD risk"
                action={risk ? <RiskBadge label={risk} /> : null}
              />
              <div className="mt-3">
                <CodRiskPanel customerId={customer._id} />
              </div>
            </section>
          )}

          <TagsCard customer={customer} disabled={!hasCrm} />
        </div>

        {/* Main column */}
        <div className="space-y-4 lg:col-span-2">
          {hasCrm && <NotesCard customer={customer} />}
          {hasCrm && <RemindersCard customerId={customer._id} reminders={reminders} />}
          <OrdersCard orders={orders} />
        </div>
      </div>
    </Page>
  );
}

/* ── Cards ──────────────────────────────────────────────────────────────── */

function TagsCard({ customer, disabled }) {
  const update = useUpdateCustomer();
  const [input, setInput] = useState('');
  const tags = customer.tags || [];

  const save = async (next) => {
    try {
      await update.mutateAsync({ id: customer._id, tags: next });
    } catch (err) {
      toast.error(apiError(err).message);
    }
  };

  const add = (t) => {
    const val = (t || input).trim();
    if (!val || tags.includes(val)) return;
    save([...tags, val]);
    setInput('');
  };
  const remove = (t) => save(tags.filter((x) => x !== t));

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-xs sm:p-5">
      <SectionHead
        icon={Tag}
        title="Tags"
      />
      {disabled ? (
        <p className="mt-3 text-sm text-fg-muted">Tags are available on paid plans.</p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.length === 0 && (
              <span className="text-sm text-fg-muted">No tags yet — use presets or add your own.</span>
            )}
            {tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand"
              >
                {t}
                <button
                  type="button"
                  onClick={() => remove(t)}
                  className="rounded p-0.5 transition-colors hover:bg-brand/10 hover:text-danger"
                  aria-label={`Remove ${t}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Input
              className="h-9 text-sm"
              placeholder="Add a tag…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
            />
            <Button size="sm" variant="secondary" onClick={() => add()}>
              Add
            </Button>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1">
            {CUSTOMER_TAG_PRESETS.filter((p) => !tags.includes(p)).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => add(p)}
                className="rounded-md border border-border bg-bg px-2 py-0.5 text-2xs font-medium text-fg-secondary transition-colors hover:border-border-strong hover:text-fg"
              >
                + {p}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function NotesCard({ customer }) {
  const addNote = useAddNote();
  const [body, setBody] = useState('');
  const notes = [...(customer.notes || [])].reverse();

  const submit = async () => {
    if (!body.trim()) return;
    try {
      await addNote.mutateAsync({ id: customer._id, body: body.trim() });
      setBody('');
    } catch (err) {
      toast.error(apiError(err).message);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-xs sm:p-5">
      <SectionHead icon={StickyNote} title="Notes" />
      <div className="mt-3 flex gap-2">
        <Textarea
          rows={2}
          placeholder="Remember something about this customer…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="flex-1"
        />
        <Button
          variant="primary"
          size="icon"
          onClick={submit}
          loading={addNote.isPending}
          disabled={!body.trim()}
          className="h-10 w-10 shrink-0 self-end"
          aria-label="Add note"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-4 space-y-2">
        {notes.length === 0 ? (
          <p className="rounded-xl bg-bg px-3 py-4 text-center text-sm text-fg-muted">
            No notes yet.
          </p>
        ) : (
          notes.map((n) => (
            <div
              key={n._id}
              className="rounded-xl border border-border/70 bg-bg px-3.5 py-2.5"
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{n.body}</p>
              <p className="mt-1.5 text-2xs text-fg-muted">
                {relativeTime(n.createdAt)}
                {n.editedAt && ' · edited'}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function RemindersCard({ customerId, reminders }) {
  const create = useCreateReminder();
  const update = useUpdateReminder();
  const { register, handleSubmit, reset, setValue, watch } = useForm({
    defaultValues: { title: '', dueAt: '' },
  });
  const dueAt = watch('dueAt');
  const open = reminders.filter((r) => r.status === 'open');

  const submit = async (values) => {
    if (!values.title?.trim() || !values.dueAt) return;
    try {
      await create.mutateAsync({
        title: values.title.trim(),
        dueAt: values.dueAt,
        customerId,
      });
      reset({ title: '', dueAt: '' });
      toast.success('Reminder set');
    } catch (err) {
      toast.error(apiError(err).message);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-xs sm:p-5">
      <SectionHead icon={Bell} title="Follow-up reminders" />
      <form
        onSubmit={handleSubmit(submit)}
        className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
      >
        <Input
          className="h-9 flex-1 text-sm"
          placeholder="e.g. Ping when new stock arrives"
          {...register('title')}
        />
        <DatePicker
          value={dueAt}
          onChange={(v) => setValue('dueAt', v)}
          className="sm:w-48"
          placeholder="Due date"
        />
        <Button type="submit" variant="secondary" size="sm" loading={create.isPending}>
          Set
        </Button>
      </form>
      <div className="mt-4 space-y-2">
        {open.length === 0 ? (
          <p className="rounded-xl bg-bg px-3 py-4 text-center text-sm text-fg-muted">
            No open reminders.
          </p>
        ) : (
          open.map((r) => {
            const overdue = new Date(r.dueAt) < new Date();
            return (
              <div
                key={r._id}
                className={cn(
                  'flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                  overdue
                    ? 'border-warning/25 bg-warning-soft/40'
                    : 'border-border bg-bg'
                )}
              >
                <button
                  type="button"
                  onClick={() => update.mutate({ id: r._id, status: 'done' })}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-border text-transparent transition-colors hover:border-brand hover:bg-brand-soft hover:text-brand"
                  aria-label="Complete reminder"
                >
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{r.title}</p>
                  <p
                    className={cn(
                      'mt-0.5 flex items-center gap-1 text-2xs',
                      overdue ? 'font-medium text-warning' : 'text-fg-muted'
                    )}
                  >
                    <CalendarClock className="h-3 w-3" strokeWidth={1.75} />
                    {fullDate(r.dueAt).split(' · ')[0]}
                    {overdue && ' · overdue'}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function OrdersCard({ orders }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-xs sm:p-5">
      <SectionHead
        icon={Package}
        title="Order history"
        action={
          orders.length > 0 ? (
            <span className="text-xs tabular-nums text-fg-muted">{orders.length}</span>
          ) : null
        }
      />
      {orders.length === 0 ? (
        <p className="mt-3 rounded-xl bg-bg px-3 py-6 text-center text-sm text-fg-muted">
          No orders yet for this customer.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {orders.map((o) => (
            <li key={o._id}>
              <Link
                to="/orders"
                className="flex items-center gap-3 rounded-xl border border-border bg-bg px-3 py-2.5 transition-colors hover:border-border-strong hover:bg-surface-2/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold tabular-nums tracking-tight text-fg">
                      {o.orderNumber}
                    </span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-fg-muted">
                    {(o.items || []).map((i) => `${i.qty}× ${i.productName}`).join(', ') ||
                      'No items'}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-fg">
                    {nprLabel(o.totalPaisa)}
                  </p>
                  <div className="mt-1 flex justify-end">
                    <PaymentBadge type={o.paymentType} />
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-fg-muted opacity-40" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ── Atoms ──────────────────────────────────────────────────────────────── */

function SectionHead({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-fg">
        {Icon && (
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-surface-2 text-fg-muted">
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
          </span>
        )}
        {title}
      </h2>
      {action}
    </div>
  );
}

function StatCell({ icon: Icon, label, value }) {
  return (
    <div className="bg-surface px-4 py-3.5 text-center">
      <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-fg-muted" strokeWidth={1.75} />
      <p className="truncate text-base font-semibold tabular-nums tracking-tight text-fg">
        {value}
      </p>
      <p className="mt-0.5 text-2xs font-medium uppercase tracking-wider text-fg-muted">{label}</p>
    </div>
  );
}

function BadgeSoft({ children }) {
  return (
    <span className="inline-flex items-center rounded-md bg-surface-2 px-2 py-0.5 text-xs font-medium text-fg-secondary">
      {children}
    </span>
  );
}

function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading customer">
      <Skeleton className="mb-5 h-4 w-28" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="mt-4 h-16 w-full rounded-lg" />
          </div>
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
        <div className="space-y-4 lg:col-span-2">
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-36 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
