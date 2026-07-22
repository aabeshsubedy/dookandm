import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Phone, Plus, StickyNote, Tag, Bell, X, CalendarClock } from 'lucide-react';
import { CUSTOMER_TAG_PRESETS, planHasFeature, FEATURES } from '@dokaandm/shared';
import { Page } from '../components/layout/PageHeader.jsx';
import { Card, CardBody } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input, Textarea } from '../components/ui/Input.jsx';
import { DatePicker } from '../components/ui/DatePicker.jsx';
import { Avatar } from '../components/common/Avatar.jsx';
import { RiskBadge } from '../components/common/RiskBadge.jsx';
import { OrderStatusBadge, PaymentBadge } from '../components/common/StatusBadge.jsx';
import { ChannelBadge } from '../components/common/ChannelBadge.jsx';
import { CodRiskPanel } from '../features/orders/CodRiskPanel.jsx';
import { LoadingPanel } from '../components/ui/Skeleton.jsx';
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

export default function CustomerDetailPage() {
  const { id } = useParams();
  const { data, isLoading } = useCustomer(id);
  const plan = useAuthStore((s) => s.plan);
  const hasCrm = planHasFeature(plan?.plan || 'free', FEATURES.CRM);
  const hasRisk = planHasFeature(plan?.plan || 'free', FEATURES.COD_RISK);

  if (isLoading)
    return (
      <Page>
        <LoadingPanel />
      </Page>
    );
  if (!data?.customer) {
    return (
      <Page>
        <EmptyState title="Customer not found" description="It may have been removed." />
      </Page>
    );
  }

  const { customer, orders = [], reminders = [] } = data;
  const name = customer.name || customer.phones?.[0] || 'Unnamed';

  return (
    <Page>
      <Link
        to="/customers"
        className="mb-4 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg-secondary"
      >
        <ArrowLeft className="h-4 w-4" /> All customers
      </Link>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardBody className="text-center">
              <Avatar name={name} size="lg" className="mx-auto" />
              <h1 className="mt-3 text-xl font-semibold text-fg">{name}</h1>
              {customer.phones?.map((p) => (
                <p
                  key={p}
                  className="mt-0.5 flex items-center justify-center gap-1 text-sm text-fg-muted"
                >
                  <Phone className="h-3.5 w-3.5" /> {p}
                </p>
              ))}
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
                <div>
                  <p className="text-xl font-semibold text-fg">{customer.stats?.totalOrders || 0}</p>
                  <p className="text-2xs uppercase tracking-wide text-fg-muted">Orders</p>
                </div>
                <div>
                  <p className="text-xl font-semibold text-fg">
                    {nprLabel(customer.stats?.lifetimeValuePaisa || 0)}
                  </p>
                  <p className="text-2xs uppercase tracking-wide text-fg-muted">Lifetime</p>
                </div>
              </div>
              {customer.channelIdentities?.length > 0 && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  {customer.channelIdentities.map((ci, i) => (
                    <ChannelBadge key={i} type={ci.type} size="sm" />
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {hasRisk && (
            <Card>
              <CardBody>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg">
                  COD Risk {customer.riskCache?.label && <RiskBadge label={customer.riskCache.label} />}
                </h3>
                <CodRiskPanel customerId={customer._id} />
              </CardBody>
            </Card>
          )}

          <TagsCard customer={customer} disabled={!hasCrm} />
        </div>

        <div className="space-y-4 lg:col-span-2">
          {hasCrm && <NotesCard customer={customer} />}
          {hasCrm && <RemindersCard customerId={customer._id} reminders={reminders} />}
          <OrdersCard orders={orders} />
        </div>
      </div>
    </Page>
  );
}

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
    <Card>
      <CardBody>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg">
          <Tag className="h-4 w-4 text-fg-muted" /> Tags
        </h3>
        {disabled ? (
          <p className="text-sm text-fg-muted">Tags are available on paid plans.</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {tags.length === 0 && <span className="text-sm text-fg-muted">No tags yet</span>}
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-md bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand"
                >
                  {t}
                  <button onClick={() => remove(t)} className="hover:text-danger" aria-label={`Remove ${t}`}>
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
            <div className="mt-2 flex flex-wrap gap-1">
              {CUSTOMER_TAG_PRESETS.filter((p) => !tags.includes(p)).map((p) => (
                <button
                  key={p}
                  onClick={() => add(p)}
                  className="rounded-md bg-surface-2 px-2 py-0.5 text-2xs text-fg-secondary hover:text-fg"
                >
                  + {p}
                </button>
              ))}
            </div>
          </>
        )}
      </CardBody>
    </Card>
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
    <Card>
      <CardBody>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg">
          <StickyNote className="h-4 w-4 text-fg-muted" /> Notes
        </h3>
        <div className="flex gap-2">
          <Textarea
            rows={2}
            placeholder="Remember something about this customer…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <Button variant="primary" onClick={submit} loading={addNote.isPending} className="self-start">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          {notes.length === 0 ? (
            <p className="text-sm text-fg-muted">No notes yet.</p>
          ) : (
            notes.map((n) => (
              <div key={n._id} className="rounded-lg bg-surface-2 px-3 py-2">
                <p className="whitespace-pre-wrap text-sm text-fg">{n.body}</p>
                <p className="mt-1 text-2xs text-fg-muted">
                  {relativeTime(n.createdAt)}
                  {n.editedAt && ' · edited'}
                </p>
              </div>
            ))
          )}
        </div>
      </CardBody>
    </Card>
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
      await create.mutateAsync({ title: values.title.trim(), dueAt: values.dueAt, customerId });
      reset({ title: '', dueAt: '' });
      toast.success('Reminder set');
    } catch (err) {
      toast.error(apiError(err).message);
    }
  };

  return (
    <Card>
      <CardBody>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-fg">
          <Bell className="h-4 w-4 text-fg-muted" /> Follow-up reminders
        </h3>
        <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-2 sm:flex-row">
          <Input className="flex-1" placeholder="e.g. Ping when new stock arrives" {...register('title')} />
          <DatePicker
            value={dueAt}
            onChange={(v) => setValue('dueAt', v)}
            className="sm:w-48"
            placeholder="Due date"
          />
          <Button type="submit" variant="secondary" loading={create.isPending}>
            Set
          </Button>
        </form>
        <div className="mt-4 space-y-2">
          {open.length === 0 ? (
            <p className="text-sm text-fg-muted">No open reminders.</p>
          ) : (
            open.map((r) => {
              const overdue = new Date(r.dueAt) < new Date();
              return (
                <div
                  key={r._id}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                >
                  <button
                    onClick={() => update.mutate({ id: r._id, status: 'done' })}
                    className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-border hover:border-brand"
                    aria-label="Complete reminder"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-fg">{r.title}</p>
                    <p
                      className={`flex items-center gap-1 text-2xs ${overdue ? 'text-danger' : 'text-fg-muted'}`}
                    >
                      <CalendarClock className="h-3 w-3" /> {fullDate(r.dueAt).split(' · ')[0]}
                      {overdue && ' · overdue'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardBody>
    </Card>
  );
}

function OrdersCard({ orders }) {
  return (
    <Card>
      <CardBody>
        <h3 className="mb-3 text-sm font-semibold text-fg">Order history</h3>
        {orders.length === 0 ? (
          <p className="text-sm text-fg-muted">No orders yet.</p>
        ) : (
          <div className="space-y-2">
            {orders.map((o) => (
              <div
                key={o._id}
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-fg">{o.orderNumber}</span>
                    <OrderStatusBadge status={o.status} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-fg-muted">
                    {o.items.map((i) => `${i.qty}× ${i.productName}`).join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-fg">{nprLabel(o.totalPaisa)}</p>
                  <PaymentBadge type={o.paymentType} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
