import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCorners,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { ORDER_STATUS_TRANSITIONS, RISK_LABELS } from '@dokaandm/shared';
import {
  GripVertical,
  Ban,
  Clock3,
  CheckCircle2,
  Truck,
  Package,
  RotateCcw,
} from 'lucide-react';
import { Avatar } from '../../components/common/Avatar.jsx';
import { RiskBadge } from '../../components/common/RiskBadge.jsx';
import { PaymentBadge } from '../../components/common/StatusBadge.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { CodRiskPanel } from './CodRiskPanel.jsx';
import { useChangeOrderStatus } from '../../hooks/data.js';
import { nprLabel } from '../../lib/format.js';
import { apiError } from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { cn } from '../../lib/cn.js';

const columnMeta = {
  pending: {
    label: 'Pending',
    icon: Clock3,
    accent: 'border-t-warning',
    tint: 'bg-warning/[0.04]',
    chip: 'bg-warning-soft text-warning',
  },
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle2,
    accent: 'border-t-brand',
    tint: 'bg-brand/[0.04]',
    chip: 'bg-brand-soft text-brand',
  },
  shipped: {
    label: 'Shipped',
    icon: Truck,
    accent: 'border-t-fg-muted',
    tint: 'bg-surface-2/60',
    chip: 'bg-surface-2 text-fg-secondary',
  },
  delivered: {
    label: 'Delivered',
    icon: Package,
    accent: 'border-t-success',
    tint: 'bg-success/[0.04]',
    chip: 'bg-success-soft text-success',
  },
  returned: {
    label: 'Returned',
    icon: RotateCcw,
    accent: 'border-t-danger',
    tint: 'bg-danger/[0.04]',
    chip: 'bg-danger-soft text-danger',
  },
};

const COLUMN_ORDER = Object.keys(columnMeta);

function canTransition(from, to) {
  if (!from || !to || from === to) return false;
  return (ORDER_STATUS_TRANSITIONS[from] || []).includes(to);
}

function cloneBoard(board) {
  return (board || []).map((col) => ({
    ...col,
    orders: [...(col.orders || [])],
  }));
}

function moveOrderOnBoard(board, orderId, fromStatus, toStatus) {
  const next = cloneBoard(board);
  let moved = null;
  const fromCol = next.find((c) => c.status === fromStatus);
  const toCol = next.find((c) => c.status === toStatus);
  if (!fromCol || !toCol) return board;

  const idx = fromCol.orders.findIndex((o) => o._id === orderId);
  if (idx === -1) return board;
  [moved] = fromCol.orders.splice(idx, 1);
  moved = { ...moved, status: toStatus };
  toCol.orders.unshift(moved);
  fromCol.total = fromCol.orders.length;
  toCol.total = toCol.orders.length;
  return next;
}

const dropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: '0.4' } },
  }),
};

/**
 * Kanban board with drag-and-drop status changes.
 * Honors ORDER_STATUS_TRANSITIONS; COD → confirmed opens risk confirmation.
 */
export function OrderBoard({ board, isLoading, onOpen }) {
  const changeStatus = useChangeOrderStatus();
  const [localBoard, setLocalBoard] = useState(() => cloneBoard(board));
  const [activeOrder, setActiveOrder] = useState(null);
  const [overStatus, setOverStatus] = useState(null);
  const [codGate, setCodGate] = useState(null);
  const dragMoved = useRef(false);

  useEffect(() => {
    setLocalBoard(cloneBoard(board));
  }, [board]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor)
  );

  const columns = useMemo(() => {
    const byStatus = Object.fromEntries(
      (localBoard || []).filter((c) => columnMeta[c.status]).map((c) => [c.status, c])
    );
    return COLUMN_ORDER.map((status) => byStatus[status] || { status, orders: [], total: 0 });
  }, [localBoard]);

  const orderIndex = useMemo(() => {
    const map = new Map();
    columns.forEach((col) => {
      col.orders.forEach((o) => map.set(o._id, { ...o, status: col.status }));
    });
    return map;
  }, [columns]);

  const applyStatusChange = useCallback(
    async (order, toStatus) => {
      const fromStatus = order.status;
      if (!canTransition(fromStatus, toStatus)) {
        toast.error(`Cannot move from ${fromStatus} to ${toStatus}`);
        return;
      }

      setLocalBoard((prev) => moveOrderOnBoard(prev, order._id, fromStatus, toStatus));

      try {
        await changeStatus.mutateAsync({ id: order._id, status: toStatus });
        toast.success(`Moved to ${columnMeta[toStatus]?.label || toStatus}`);
      } catch (err) {
        setLocalBoard((prev) => moveOrderOnBoard(prev, order._id, toStatus, fromStatus));
        toast.error(apiError(err).message, 'Could not update status');
      }
    },
    [changeStatus]
  );

  const handleDragStart = (event) => {
    dragMoved.current = true;
    const order = orderIndex.get(event.active.id);
    setActiveOrder(order || null);
  };

  const handleDragOver = (event) => {
    const overId = event.over?.id;
    if (!overId) {
      setOverStatus(null);
      return;
    }
    const status =
      typeof overId === 'string' && overId.startsWith('col:')
        ? overId.slice(4)
        : orderIndex.get(overId)?.status;
    setOverStatus(status || null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveOrder(null);
    setOverStatus(null);

    window.setTimeout(() => {
      dragMoved.current = false;
    }, 50);

    if (!over) return;

    const order = orderIndex.get(active.id);
    if (!order) return;

    const toStatus =
      typeof over.id === 'string' && over.id.startsWith('col:')
        ? over.id.slice(4)
        : orderIndex.get(over.id)?.status;

    if (!toStatus || toStatus === order.status) return;
    if (!canTransition(order.status, toStatus)) {
      toast.info(
        `"${columnMeta[order.status]?.label}" cannot move to "${columnMeta[toStatus]?.label}"`
      );
      return;
    }

    if (toStatus === 'confirmed' && order.paymentType === 'cod') {
      setCodGate({ order, toStatus });
      return;
    }

    applyStatusChange(order, toStatus);
  };

  const handleDragCancel = () => {
    setActiveOrder(null);
    setOverStatus(null);
    window.setTimeout(() => {
      dragMoved.current = false;
    }, 50);
  };

  const handleCardOpen = (id) => {
    if (dragMoved.current) return;
    onOpen?.(id);
  };

  if (isLoading) {
    return (
      <BoardScroll>
        <div className="board-track">
          {COLUMN_ORDER.map((s) => (
            <div key={s} className="board-col space-y-2.5">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ))}
        </div>
      </BoardScroll>
    );
  }

  const validTargets = activeOrder
    ? new Set(ORDER_STATUS_TRANSITIONS[activeOrder.status] || [])
    : null;

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <BoardScroll>
          <div className="board-track">
            {columns.map((col) => {
              const meta = columnMeta[col.status];
              const isValidDrop = validTargets ? validTargets.has(col.status) : false;
              const isInvalidDrop =
                validTargets && activeOrder && col.status !== activeOrder.status && !isValidDrop;
              const isActiveOver = overStatus === col.status && !!activeOrder;

              return (
                <KanbanColumn
                  key={col.status}
                  status={col.status}
                  meta={meta}
                  total={col.total}
                  isValidDrop={isValidDrop}
                  isInvalidDrop={isInvalidDrop}
                  isActiveOver={isActiveOver}
                  isDragging={!!activeOrder}
                >
                  {col.orders.length === 0 ? (
                    <EmptyDropZone isValidDrop={isValidDrop && isActiveOver} />
                  ) : (
                    col.orders.map((o) => (
                      <DraggableOrderCard
                        key={o._id}
                        order={{ ...o, status: col.status }}
                        onOpen={handleCardOpen}
                        isDragSource={activeOrder?._id === o._id}
                      />
                    ))
                  )}
                </KanbanColumn>
              );
            })}
          </div>
        </BoardScroll>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeOrder ? <OrderCardVisual order={activeOrder} overlay /> : null}
        </DragOverlay>
      </DndContext>

      {activeOrder && (
        <p className="mt-3 text-center text-2xs text-fg-muted">
          Drop on a highlighted column · only valid transitions are accepted
        </p>
      )}

      <Modal
        open={!!codGate}
        onClose={() => setCodGate(null)}
        title="Confirm COD order"
        description="Review cash-on-delivery risk before confirming."
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCodGate(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={changeStatus.isPending}
              onClick={async () => {
                if (!codGate) return;
                const { order, toStatus } = codGate;
                setCodGate(null);
                await applyStatusChange(order, toStatus);
              }}
            >
              Confirm order
            </Button>
          </>
        }
      >
        {codGate?.order?.customer?._id || codGate?.order?.customerId ? (
          <CodRiskPanel customerId={codGate.order.customer?._id || codGate.order.customerId} />
        ) : (
          <p className="text-sm text-fg-secondary">
            Confirm cash-on-delivery for{' '}
            <span className="font-medium text-fg">{codGate?.order?.orderNumber}</span>?
          </p>
        )}
      </Modal>
    </>
  );
}

function BoardScroll({ children }) {
  return <div className="board-scroll w-full min-w-0 max-w-full">{children}</div>;
}

function KanbanColumn({
  status,
  meta,
  total,
  isValidDrop,
  isInvalidDrop,
  isActiveOver,
  isDragging,
  children,
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${status}` });
  const highlight = isDragging && isValidDrop && (isOver || isActiveOver);
  const Icon = meta.icon;

  return (
    <div className="board-col flex flex-col">
      <div
        className={cn(
          'mb-2.5 flex items-center justify-between gap-2 rounded-xl border border-border border-t-2 bg-surface px-3 py-2.5 shadow-xs transition-shadow',
          meta.accent,
          highlight && 'shadow-sm ring-2 ring-brand/30'
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-md', meta.chip)}>
            <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
          </span>
          <span className="truncate text-sm font-semibold tracking-tight text-fg">{meta.label}</span>
        </div>
        <span className="shrink-0 rounded-md bg-surface-2 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-fg-secondary">
          {total}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          'min-h-[140px] flex-1 space-y-2 rounded-xl p-1.5 transition-all duration-150',
          meta.tint,
          highlight && 'bg-brand-soft/50 ring-2 ring-inset ring-brand/25',
          isInvalidDrop && isDragging && 'opacity-45',
          isInvalidDrop && isOver && 'ring-2 ring-inset ring-danger/25'
        )}
      >
        {children}
        {isInvalidDrop && isOver && (
          <div className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-danger/35 bg-danger-soft/40 px-2 py-3 text-2xs font-medium text-danger">
            <Ban className="h-3.5 w-3.5" /> Not allowed
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyDropZone({ isValidDrop }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-dashed border-border/80 py-10 text-center text-xs text-fg-muted transition-colors',
        isValidDrop && 'border-brand/40 bg-brand-soft/30 text-brand'
      )}
    >
      {isValidDrop ? 'Drop here' : 'No orders'}
    </div>
  );
}

function DraggableOrderCard({ order, onOpen, isDragSource }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order._id,
    data: { order },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('touch-none', isDragging || isDragSource ? 'opacity-30' : 'opacity-100')}
      {...listeners}
      {...attributes}
    >
      <OrderCardVisual order={order} onOpen={() => onOpen(order._id)} />
    </div>
  );
}

function OrderCardVisual({ order: o, onOpen, overlay }) {
  const name = o.customer?.name || o.phone;
  const risk = o.customer?.riskCache?.label;
  const items = (o.items || []).map((i) => `${i.qty}× ${i.productName}`).join(', ');

  return (
    <div
      role={onOpen && !overlay ? 'button' : undefined}
      tabIndex={onOpen && !overlay ? 0 : undefined}
      onClick={
        onOpen && !overlay
          ? (e) => {
              e.stopPropagation();
              onOpen();
            }
          : undefined
      }
      onKeyDown={
        onOpen && !overlay
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen();
              }
            }
          : undefined
      }
      className={cn(
        'group w-full cursor-grab rounded-xl border border-border bg-surface p-3 text-left shadow-xs transition-all active:cursor-grabbing',
        'hover:border-border-strong hover:shadow-sm',
        overlay && 'cursor-grabbing rotate-[0.6deg] scale-[1.02] shadow-lg ring-2 ring-brand/25'
      )}
    >
      <div className="flex items-start gap-1.5">
        <span
          className={cn(
            'mt-0.5 -ml-0.5 shrink-0 rounded p-0.5 text-fg-muted',
            'opacity-40 transition-opacity group-hover:opacity-80',
            overlay && 'opacity-80'
          )}
          aria-hidden
        >
          <GripVertical className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-2xs font-semibold uppercase tracking-wide text-fg-muted">
              {o.orderNumber}
            </span>
            <span className="shrink-0 text-sm font-semibold tabular-nums tracking-tight text-fg">
              {nprLabel(o.totalPaisa)}
            </span>
          </div>

          <div className="mt-2.5 flex min-w-0 items-center gap-2">
            <Avatar name={name} size="xs" />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{name}</span>
          </div>

          {items && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-fg-muted">{items}</p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <PaymentBadge type={o.paymentType} />
            {risk && RISK_LABELS.includes(risk) && risk !== 'new' && <RiskBadge label={risk} />}
          </div>
        </div>
      </div>
    </div>
  );
}
