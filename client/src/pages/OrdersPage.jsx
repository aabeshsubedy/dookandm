import { useState } from 'react';
import { Plus, LayoutGrid, List as ListIcon, Download } from 'lucide-react';
import {
  ORDER_STATUSES,
  PAYMENT_TYPES,
  PAYMENT_TYPE_LABELS,
  planHasFeature,
  FEATURES,
} from '@dokaandm/shared';
import { Page } from '../components/layout/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Select } from '../components/ui/Input.jsx';
import { OrderBoard } from '../features/orders/OrderBoard.jsx';
import { OrderList } from '../features/orders/OrderList.jsx';
import { OrderDetailDrawer } from '../features/orders/OrderDetailDrawer.jsx';
import { OrderFormModal } from '../features/orders/OrderFormModal.jsx';
import { useOrders, useOrderBoard } from '../hooks/data.js';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../lib/api.js';
import { cn } from '../lib/cn.js';
import { toast } from '../store/toastStore.js';

export default function OrdersPage() {
  const plan = useAuthStore((s) => s.plan);
  const hasKanban = planHasFeature(plan?.plan || 'free', FEATURES.KANBAN);
  const hasExport = planHasFeature(plan?.plan || 'free', FEATURES.CSV_EXPORT);

  const [view, setView] = useState(hasKanban ? 'board' : 'list');
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState('');
  const [openId, setOpenId] = useState(null);
  const [newOpen, setNewOpen] = useState(false);

  const { data: listData, isLoading: listLoading } = useOrders({
    status,
    paymentType: payment,
  });
  const { data: boardData, isLoading: boardLoading } = useOrderBoard();
  const orders = listData?.data || [];

  const exportCsv = async () => {
    try {
      const res = await api.get('/orders/export.csv', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'orders.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  const isBoard = view === 'board' && hasKanban;

  return (
    <Page wide={isBoard}>
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Orders</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Capture to delivery · COD risk at confirmation
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasExport && (
            <Button variant="secondary" size="sm" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={() => setNewOpen(true)}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            New order
          </Button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {hasKanban ? (
          <div
            className="inline-flex rounded-lg border border-border bg-surface-2/80 p-0.5 shadow-xs"
            role="tablist"
            aria-label="Orders view"
          >
            <ToggleBtn
              active={view === 'board'}
              onClick={() => setView('board')}
              icon={LayoutGrid}
              label="Board"
            />
            <ToggleBtn
              active={view === 'list'}
              onClick={() => setView('list')}
              icon={ListIcon}
              label="List"
            />
          </div>
        ) : (
          <p className="text-xs text-fg-muted">List view · upgrade for kanban board</p>
        )}

        {view === 'list' && (
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-9 w-auto min-w-[8.5rem] bg-surface text-sm"
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </Select>
            <Select
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              className="h-9 w-auto min-w-[8.5rem] bg-surface text-sm"
              aria-label="Filter by payment"
            >
              <option value="">All payments</option>
              {PAYMENT_TYPES.map((p) => (
                <option key={p} value={p}>
                  {PAYMENT_TYPE_LABELS[p]}
                </option>
              ))}
            </Select>
            {(status || payment) && (
              <button
                type="button"
                onClick={() => {
                  setStatus('');
                  setPayment('');
                }}
                className="text-xs font-medium text-fg-muted transition-colors hover:text-brand"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mt-4 min-w-0 w-full">
        {isBoard ? (
          <OrderBoard board={boardData?.board} isLoading={boardLoading} onOpen={setOpenId} />
        ) : (
          <OrderList orders={orders} isLoading={listLoading} onOpen={setOpenId} />
        )}
      </div>

      <OrderDetailDrawer orderId={openId} open={!!openId} onClose={() => setOpenId(null)} />
      <OrderFormModal open={newOpen} onClose={() => setNewOpen(false)} />
    </Page>
  );
}

function ToggleBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:text-sm',
        active
          ? 'bg-surface text-fg shadow-xs'
          : 'text-fg-muted hover:text-fg-secondary'
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
    </button>
  );
}
