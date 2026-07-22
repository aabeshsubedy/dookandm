import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Search,
  Users,
  Phone,
  X,
  ChevronRight,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { Page } from '../components/layout/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input, Field } from '../components/ui/Input.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Avatar } from '../components/common/Avatar.jsx';
import { RiskBadge } from '../components/common/RiskBadge.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useCustomers, useCreateCustomer } from '../hooks/data.js';
import { useDebounced } from '../hooks/useDebounced.js';
import { useAuthStore } from '../store/authStore.js';
import { apiError } from '../lib/api.js';
import { toast } from '../store/toastStore.js';
import { nprLabel, relativeTime } from '../lib/format.js';
import { cn } from '../lib/cn.js';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const q = useDebounced(search, 300);
  const { data, isLoading } = useCustomers({ q });
  const customers = data?.data || [];
  const plan = useAuthStore((s) => s.plan);
  const limit = plan?.limits?.customers;
  const used = plan?.usage?.customers ?? 0;
  const unlimited = limit == null;
  const usagePct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));

  return (
    <Page>
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Customers</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Phone-keyed memory across Facebook &amp; Instagram · COD risk included
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Add customer
        </Button>
      </header>

      {/* Quiet plan usage */}
      {!unlimited && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5 shadow-xs">
          <span className="text-xs text-fg-secondary">
            <span className="font-semibold tabular-nums text-fg">{used}</span>
            <span className="text-fg-muted"> / {limit} customers</span>
            <span className="text-fg-muted"> · {plan?.label || 'Free'} plan</span>
          </span>
          <div className="h-1.5 min-w-[6rem] max-w-xs flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                usagePct >= 90 ? 'bg-danger/70' : usagePct >= 80 ? 'bg-warning/70' : 'bg-brand/65'
              )}
              style={{ width: `${usagePct}%` }}
            />
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mt-5 max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
          strokeWidth={1.75}
        />
        <Input
          className="h-9 border-border bg-surface pl-9 pr-9 text-sm"
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search customers"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-muted hover:bg-surface-2 hover:text-fg"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="mt-4">
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border bg-surface p-4 shadow-xs">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-11 w-11 rounded-full" />
                  <div className="flex-1 space-y-2 pt-1">
                    <Skeleton className="h-3.5 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="mt-4 h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface shadow-xs">
            <EmptyState
              icon={Users}
              title={q ? 'No matches' : 'No customers yet'}
              description={
                q
                  ? 'Try a different name or phone number.'
                  : 'Customers appear when you capture an order or receive a DM — or add one manually.'
              }
              action={
                !q && (
                  <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
                    <Plus className="h-3.5 w-3.5" />
                    Add customer
                  </Button>
                )
              }
              className="py-14"
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customers.map((c) => (
              <CustomerCard key={c._id} customer={c} />
            ))}
          </div>
        )}
      </div>

      <CreateCustomerModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </Page>
  );
}

function CustomerCard({ customer: c }) {
  const name = c.name || 'Unnamed';
  const phone = c.phones?.[0];
  const risk = c.riskCache?.label;
  const orders = c.stats?.totalOrders || 0;
  const ltv = c.stats?.lifetimeValuePaisa || 0;

  return (
    <Link
      to={`/customers/${c._id}`}
      className={cn(
        'group flex flex-col rounded-2xl border border-border bg-surface p-4 shadow-xs',
        'transition-all duration-150 hover:border-border-strong hover:shadow-sm'
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar name={c.name || phone} size="md" className="ring-2 ring-border/60" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold tracking-tight text-fg">{name}</p>
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-fg-muted opacity-0 transition-opacity group-hover:opacity-50" />
          </div>
          {phone ? (
            <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-fg-muted">
              <Phone className="h-3 w-3 shrink-0" strokeWidth={1.75} />
              {phone}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-fg-muted">No phone yet</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {risk && risk !== 'new' && <RiskBadge label={risk} />}
            {c.isProvisional && <Badge tone="neutral">Provisional</Badge>}
            {c.tags?.slice(0, 2).map((t) => (
              <Badge key={t} tone="ocean">
                {t}
              </Badge>
            ))}
            {(c.tags?.length || 0) > 2 && (
              <span className="text-2xs text-fg-muted">+{c.tags.length - 2}</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/70 pt-3">
        <div className="rounded-lg bg-bg px-2.5 py-2">
          <p className="flex items-center gap-1 text-2xs text-fg-muted">
            <ShoppingBag className="h-3 w-3" strokeWidth={1.75} />
            Orders
          </p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-fg">{orders}</p>
        </div>
        <div className="rounded-lg bg-bg px-2.5 py-2">
          <p className="flex items-center gap-1 text-2xs text-fg-muted">
            <TrendingUp className="h-3 w-3" strokeWidth={1.75} />
            Total spent
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-fg">
            {nprLabel(ltv)}
          </p>
        </div>
      </div>

      {c.stats?.lastOrderAt && (
        <p className="mt-2.5 text-2xs text-fg-muted">
          Last order {relativeTime(c.stats.lastOrderAt)}
        </p>
      )}
    </Link>
  );
}

function CreateCustomerModal({ open, onClose }) {
  const create = useCreateCustomer();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const submit = async (values) => {
    try {
      await create.mutateAsync(values);
      toast.success('Customer added');
      reset();
      onClose();
    } catch (err) {
      const e = apiError(err);
      toast.error(
        e.message,
        e.code === 'PLAN_QUOTA_EXCEEDED' ? 'Customer limit reached' : 'Could not add'
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add customer"
      description="Create a profile manually. Phone is the identity key across channels."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit(submit)} loading={create.isPending}>
            Add customer
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <Field label="Name">
          <Input placeholder="Full name" {...register('name')} />
        </Field>
        <Field label="Phone" required error={errors.phone && 'A valid phone is required'}>
          <Input
            placeholder="98XXXXXXXX"
            invalid={!!errors.phone}
            {...register('phone', { required: true })}
          />
        </Field>
        <Field label="Note" hint="Optional · saved as the first CRM note">
          <Input placeholder="e.g. Prefers COD, repeat buyer" {...register('note')} />
        </Field>
      </form>
    </Modal>
  );
}
