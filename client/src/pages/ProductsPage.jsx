import { useState } from 'react';
import {
  Plus,
  Search,
  Package,
  Download,
  Archive,
  Pencil,
  AlertTriangle,
  Infinity as InfinityIcon,
  X,
  ChevronRight,
  Tag,
} from 'lucide-react';
import { LOW_STOCK_THRESHOLD, planHasFeature, FEATURES } from '@dokaandm/shared';
import { Page } from '../components/layout/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input, Select } from '../components/ui/Input.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { EmptyState } from '../components/ui/EmptyState.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { ProductFormModal } from '../features/products/ProductFormModal.jsx';
import {
  useProducts,
  useProductCategories,
  useArchiveProduct,
} from '../hooks/data.js';
import { useDebounced } from '../hooks/useDebounced.js';
import { useAuthStore } from '../store/authStore.js';
import { api } from '../lib/api.js';
import { nprLabel } from '../lib/format.js';
import { cn } from '../lib/cn.js';
import { toast } from '../store/toastStore.js';

function StockBadge({ product }) {
  if (!product.trackInventory) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-1.5 py-0.5 text-2xs font-medium text-fg-muted">
        <InfinityIcon className="h-3 w-3" strokeWidth={1.75} />
        Untracked
      </span>
    );
  }
  const out = product.stock === 0;
  const low = product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-2xs font-medium tabular-nums',
        out && 'bg-danger-soft text-danger',
        low && 'bg-warning-soft text-warning',
        !out && !low && 'bg-success-soft text-success'
      )}
    >
      {(out || low) && <AlertTriangle className="h-3 w-3" strokeWidth={2} />}
      {out ? 'Out of stock' : `${product.stock} in stock`}
    </span>
  );
}

export default function ProductsPage() {
  const plan = useAuthStore((s) => s.plan);
  const hasExport = planHasFeature(plan?.plan || 'free', FEATURES.CSV_EXPORT);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('active');
  const [lowStock, setLowStock] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const q = useDebounced(search, 300);
  const { data, isLoading } = useProducts({
    q,
    category,
    status,
    lowStock: lowStock ? 'true' : '',
  });
  const { data: categories } = useProductCategories();
  const archive = useArchiveProduct();
  const products = data?.data || [];
  const hasFilters = Boolean(q || category || lowStock || (status && status !== 'active'));

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setModalOpen(true);
  };

  const doArchive = async (e, p) => {
    e.stopPropagation();
    try {
      await archive.mutateAsync(p._id);
      toast.success(`${p.name} archived`);
    } catch {
      toast.error('Could not archive');
    }
  };

  const exportCsv = async () => {
    try {
      const res = await api.get('/products/export.csv', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'products.csv';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Export downloaded');
    } catch {
      toast.error('Export failed');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setStatus('active');
    setLowStock(false);
  };

  const limit = plan?.limits?.products;
  const used = plan?.usage?.products ?? 0;
  const unlimited = limit == null;
  const usagePct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));

  return (
    <Page>
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Products</h1>
          <p className="mt-1 text-sm text-fg-muted">
            Catalog for order capture · search by name or product ID
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasExport && (
            <Button variant="secondary" size="sm" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Export</span>
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Add product
          </Button>
        </div>
      </header>

      {/* Plan usage — quiet meter, not a stats strip */}
      {!unlimited && (
        <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-3.5 py-2.5 shadow-xs">
          <span className="text-xs text-fg-secondary">
            <span className="font-semibold tabular-nums text-fg">{used}</span>
            <span className="text-fg-muted"> / {limit} products</span>
            <span className="text-fg-muted"> · {plan?.label || 'Free'} plan</span>
          </span>
          <div className="h-1.5 min-w-[6rem] flex-1 max-w-xs overflow-hidden rounded-full bg-surface-2">
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

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted"
            strokeWidth={1.75}
          />
          <Input
            className="h-9 border-border bg-surface pl-9 pr-9 text-sm"
            placeholder="Search name or product ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search products"
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

        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 w-auto min-w-[8rem] bg-surface text-sm"
          aria-label="Category"
        >
          <option value="">All categories</option>
          {(categories || []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>

        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 w-auto min-w-[7rem] bg-surface text-sm"
          aria-label="Status"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </Select>

        <button
          type="button"
          onClick={() => setLowStock((v) => !v)}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors sm:text-sm',
            lowStock
              ? 'border-warning/35 bg-warning-soft text-warning'
              : 'border-border bg-surface text-fg-secondary hover:bg-surface-2'
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" strokeWidth={1.75} />
          Low stock
        </button>

        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-fg-muted transition-colors hover:text-brand"
          >
            Clear
          </button>
        )}
      </div>

      {/* Content */}
      <div className="mt-4">
        {isLoading ? (
          <ProductSkeletons />
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface shadow-xs">
            <EmptyState
              icon={Package}
              title={hasFilters ? 'No matching products' : 'No products yet'}
              description={
                hasFilters
                  ? 'Try adjusting your search or filters.'
                  : 'Add products once, then attach them to orders in a couple of taps.'
              }
              action={
                !hasFilters && (
                  <Button variant="primary" size="sm" onClick={openCreate}>
                    <Plus className="h-3.5 w-3.5" />
                    Add your first product
                  </Button>
                )
              }
              className="py-14"
            />
          </div>
        ) : (
          <>
            {/* Mobile */}
            <ul className="space-y-2 sm:hidden">
              {products.map((p) => (
                <li key={p._id}>
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="w-full rounded-2xl border border-border bg-surface p-3.5 text-left shadow-xs transition-colors active:bg-surface-2"
                  >
                    <div className="flex items-start gap-3">
                      <ProductThumb product={p} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-fg">{p.name}</p>
                            <p className="mt-0.5 truncate font-mono text-2xs text-fg-muted">
                              {p.sku}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold tabular-nums text-fg">
                            {nprLabel(p.pricePaisa)}
                          </span>
                        </div>
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <StockBadge product={p} />
                          {p.category && (
                            <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-2xs text-fg-muted">
                              {p.category}
                            </span>
                          )}
                          {p.status === 'archived' && <Badge tone="neutral">Archived</Badge>}
                          <span className="ml-auto text-2xs tabular-nums text-fg-muted">
                            {p.stats?.unitsSold || 0} sold
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="hidden overflow-hidden rounded-2xl border border-border bg-surface shadow-xs sm:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-2/40 text-left">
                      <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                        Product
                      </th>
                      <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                        Product ID
                      </th>
                      <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                        Category
                      </th>
                      <th className="px-4 py-3 text-right text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                        Price
                      </th>
                      <th className="px-4 py-3 text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                        Stock
                      </th>
                      <th className="px-4 py-3 text-right text-2xs font-semibold uppercase tracking-wider text-fg-muted">
                        Sold
                      </th>
                      <th className="w-24 px-3 py-3" aria-hidden />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {products.map((p) => (
                      <tr
                        key={p._id}
                        onClick={() => openEdit(p)}
                        className="group cursor-pointer transition-colors hover:bg-surface-2/50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <ProductThumb product={p} size="md" />
                            <div className="min-w-0">
                              <p className="flex items-center gap-2 truncate font-semibold text-fg">
                                <span className="truncate">{p.name}</span>
                                {p.status === 'archived' && (
                                  <Badge tone="neutral">Archived</Badge>
                                )}
                              </p>
                              {p.description && (
                                <p className="mt-0.5 max-w-[280px] truncate text-xs text-fg-muted">
                                  {p.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-2xs text-fg-secondary">
                            {p.sku}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {p.category ? (
                            <span className="inline-flex items-center gap-1 text-fg-secondary">
                              <Tag className="h-3 w-3 text-fg-muted" strokeWidth={1.75} />
                              {p.category}
                            </span>
                          ) : (
                            <span className="text-fg-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-fg">
                          {nprLabel(p.pricePaisa)}
                        </td>
                        <td className="px-4 py-3">
                          <StockBadge product={p} />
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-fg-secondary">
                          {p.stats?.unitsSold || 0}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit(p);
                              }}
                              aria-label="Edit product"
                            >
                              <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                            </Button>
                            {p.status === 'active' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-fg-muted hover:text-danger"
                                onClick={(e) => doArchive(e, p)}
                                aria-label="Archive product"
                              >
                                <Archive className="h-3.5 w-3.5" strokeWidth={1.75} />
                              </Button>
                            )}
                            <ChevronRight className="ml-0.5 h-4 w-4 text-fg-muted opacity-40" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <ProductFormModal open={modalOpen} onClose={() => setModalOpen(false)} product={editing} />
    </Page>
  );
}

function ProductThumb({ product, size = 'md' }) {
  const dims = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const icon = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  if (product.imageUrl) {
    return (
      <img
        src={product.imageUrl}
        alt=""
        className={cn(
          'shrink-0 rounded-xl border border-border object-cover bg-surface-2',
          dims
        )}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextSibling?.classList?.remove('hidden');
        }}
      />
    );
  }
  return (
    <span
      className={cn(
        'grid shrink-0 place-items-center rounded-xl bg-brand-soft text-brand ring-1 ring-border/50',
        dims
      )}
    >
      <Package className={icon} strokeWidth={1.75} />
    </span>
  );
}

function ProductSkeletons() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5 last:border-0"
        >
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="hidden h-5 w-16 rounded-md sm:block" />
          <Skeleton className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}
