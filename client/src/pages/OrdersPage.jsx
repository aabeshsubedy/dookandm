import { useState } from 'react';
import { Plus, LayoutGrid, List as ListIcon, Download } from 'lucide-react';
import { ORDER_STATUSES, PAYMENT_TYPES, PAYMENT_TYPE_LABELS, planHasFeature, FEATURES } from '@dokaandm/shared';
import { Page, PageHeader } from '../components/layout/PageHeader.jsx';
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

  const { data: listData, isLoading: listLoading } = useOrders({ status, paymentType: payment });
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
    } catch {
      toast.error('Export failed');
    }
  };

  // Board needs a wider, unconstrained content rail so columns can fit / scroll.
  const isBoard = view === 'board' && hasKanban;

  return (
    <Page wide={isBoard}>
      <PageHeader
        title="Orders"
        description="Track every order from capture to delivery."
        action={
          <div className="flex items-center gap-2">
            {hasExport && (
              <Button variant="secondary" onClick={exportCsv}>
                <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export</span>
              </Button>
            )}
            <Button variant="primary" onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4" /> New order
            </Button>
          </div>
        }
      />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {hasKanban ? (
          <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
            <ToggleBtn active={view === 'board'} onClick={() => setView('board')} icon={LayoutGrid} label="Board" />
            <ToggleBtn active={view === 'list'} onClick={() => setView('list')} icon={ListIcon} label="List" />
          </div>
        ) : (
          <div />
        )}

        {view === 'list' && (
          <div className="flex items-center gap-2">
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 w-auto text-sm">
              <option value="">All statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s[0].toUpperCase() + s.slice(1)}
                </option>
              ))}
            </Select>
            <Select value={payment} onChange={(e) => setPayment(e.target.value)} className="h-9 w-auto text-sm">
              <option value="">All payments</option>
              {PAYMENT_TYPES.map((p) => (
                <option key={p} value={p}>
                  {PAYMENT_TYPE_LABELS[p]}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

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
