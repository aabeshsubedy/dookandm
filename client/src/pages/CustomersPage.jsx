import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Plus, Search, Users, Phone } from 'lucide-react';
import { Page, PageHeader } from '../components/layout/PageHeader.jsx';
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
import { apiError } from '../lib/api.js';
import { toast } from '../store/toastStore.js';
import { nprLabel, relativeTime } from '../lib/format.js';

export default function CustomersPage() {
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const q = useDebounced(search, 300);
  const { data, isLoading } = useCustomers({ q });
  const customers = data?.data || [];

  return (
    <Page>
      <PageHeader
        title="Customers"
        description="Everyone who messaged or ordered — remembered across channels."
        action={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" /> Add customer
          </Button>
        }
      />

      <div className="relative mt-5 max-w-md">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
        <Input
          className="pl-8"
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="mt-3 h-4 w-2/3" />
                <Skeleton className="mt-2 h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Users}
              title={q ? 'No matches' : 'No customers yet'}
              description={
                q
                  ? 'Try a different name or phone number.'
                  : 'Customers appear when you capture an order or receive a DM.'
              }
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customers.map((c) => (
              <Link
                key={c._id}
                to={`/customers/${c._id}`}
                className="card p-4 transition-colors hover:border-border-strong hover:bg-surface-2/40"
              >
                <div className="flex items-start justify-between">
                  <Avatar name={c.name || c.phones?.[0]} size="md" />
                  {c.riskCache?.label && c.riskCache.label !== 'new' && (
                    <RiskBadge label={c.riskCache.label} />
                  )}
                </div>
                <p className="mt-3 truncate font-medium text-fg">{c.name || 'Unnamed'}</p>
                {c.phones?.[0] && (
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-fg-muted">
                    <Phone className="h-3.5 w-3.5" /> {c.phones[0]}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-fg-muted">
                  <span>{c.stats?.totalOrders || 0} orders</span>
                  <span className="font-medium text-fg-secondary">
                    {nprLabel(c.stats?.lifetimeValuePaisa || 0)}
                  </span>
                </div>
                {c.tags?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.tags.slice(0, 3).map((t) => (
                      <Badge key={t} tone="ocean">
                        {t}
                      </Badge>
                    ))}
                  </div>
                )}
                {c.stats?.lastOrderAt && (
                  <p className="mt-2 text-2xs text-fg-muted">
                    Last order {relativeTime(c.stats.lastOrderAt)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateCustomerModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </Page>
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
      toast.error(e.message, e.code === 'PLAN_QUOTA_EXCEEDED' ? 'Customer limit reached' : 'Could not add');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add customer"
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
        <Field label="Note" hint="Optional">
          <Input placeholder="e.g. Prefers COD, repeat buyer" {...register('note')} />
        </Field>
      </form>
    </Modal>
  );
}
