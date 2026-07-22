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
} from 'lucide-react';
import { LOW_STOCK_THRESHOLD, planHasFeature, FEATURES } from '@dokaandm/shared';
import { Page, PageHeader } from '../components/layout/PageHeader.jsx';
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

function StockCell({ product }) {
  if (!product.trackInventory) {
    return (
      <span className="inline-flex items-center gap-1 text-fg-muted">
        <InfinityIcon className="h-3.5 w-3.5" /> Untracked
      </span>
    );
  }
  const out = product.stock === 0;
  const low = product.stock <= LOW_STOCK_THRESHOLD;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium',
        out ? 'text-danger' : low ? 'text-warning' : 'text-fg'
      )}
    >
      {low && <AlertTriangle className="h-3.5 w-3.5" />}
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
    } catch {
      toast.error('Export failed');
    }
  };

  const limit = plan?.limits?.products;
  const used = plan?.usage?.products ?? 0;

  return (
    <Page>
      <PageHeader
        title="Products"
        description="Your catalog — reuse items across orders without retyping."
        action={
          <div className="flex items-center gap-2">
            {hasExport && (
              <Button variant="secondary" onClick={exportCsv}>
                <Download className="h-4 w-4" /> <span className="hidden sm:inline">Export</span>
              </Button>
            )}
            <Button variant="primary" onClick={openCreate}>
              <Plus className="h-4 w-4" /> Add product
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-muted" />
          <Input
            className="pl-8"
            placeholder="Search by name or product ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="h-9 w-auto text-sm">
          <option value="">All categories</option>
          {(categories || []).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 w-auto text-sm">
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="all">All</option>
        </Select>
        <button
          onClick={() => setLowStock((v) => !v)}
          className={cn(
            'inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition-colors',
            lowStock
              ? 'border-warning/40 bg-warning-soft text-warning'
              : 'border-border bg-surface text-fg-secondary hover:bg-surface-2'
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" /> Low stock
        </button>
      </div>

      {limit != null && (
        <p className="mt-3 text-sm text-fg-muted">
          {used} of {limit} products used on your{' '}
          <span className="font-medium text-fg-secondary">{plan?.label}</span> plan.
        </p>
      )}

      <div className="mt-4">
        {isLoading ? (
          <div className="card divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={Package}
              title={q || category || lowStock ? 'No matching products' : 'No products yet'}
              description={
                q || category || lowStock
                  ? 'Try adjusting your search or filters.'
                  : 'Add your products once, then attach them to orders in a couple of taps.'
              }
              action={
                !q &&
                !category &&
                !lowStock && (
                  <Button variant="primary" onClick={openCreate}>
                    <Plus className="h-4 w-4" /> Add your first product
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-2 sm:hidden">
              {products.map((p) => (
                <button key={p._id} onClick={() => openEdit(p)} className="card w-full p-3 text-left active:bg-surface-2">
                  <div className="flex items-center gap-3">
                    <ProductThumb product={p} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-fg">{p.name}</p>
                      <p className="truncate text-xs text-fg-muted">{p.sku}</p>
                    </div>
                    <span className="font-semibold text-fg">{nprLabel(p.pricePaisa)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <StockCell product={p} />
                    <span className="text-fg-muted">{p.stats?.unitsSold || 0} sold</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Desktop table */}
            <div className="card hidden overflow-hidden sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-2/60 text-left text-2xs font-medium uppercase tracking-wider text-fg-muted">
                    <th className="px-4 py-2.5">Product</th>
                    <th className="px-4 py-2.5">Product ID</th>
                    <th className="px-4 py-2.5">Category</th>
                    <th className="px-4 py-2.5 text-right">Price</th>
                    <th className="px-4 py-2.5">Stock</th>
                    <th className="px-4 py-2.5 text-right">Sold</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((p) => (
                    <tr
                      key={p._id}
                      onClick={() => openEdit(p)}
                      className="group cursor-pointer transition-colors hover:bg-surface-2/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProductThumb product={p} />
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 truncate font-medium text-fg">
                              {p.name}
                              {p.status === 'archived' && <Badge tone="neutral">Archived</Badge>}
                            </p>
                            {p.description && (
                              <p className="max-w-[280px] truncate text-xs text-fg-muted">{p.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-fg-secondary">{p.sku}</td>
                      <td className="px-4 py-3 text-fg-secondary">{p.category || '—'}</td>
                      <td className="px-4 py-3 text-right font-medium text-fg">{nprLabel(p.pricePaisa)}</td>
                      <td className="px-4 py-3">
                        <StockCell product={p} />
                      </td>
                      <td className="px-4 py-3 text-right text-fg-secondary">{p.stats?.unitsSold || 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(p); }} aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {p.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-fg-muted hover:text-danger"
                              onClick={(e) => doArchive(e, p)}
                              aria-label="Archive"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      <ProductFormModal open={modalOpen} onClose={() => setModalOpen(false)} product={editing} />
    </Page>
  );
}

function ProductThumb({ product }) {
  if (product.imageUrl) {
    return (
      <img
        src={product.imageUrl}
        alt=""
        className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
        }}
      />
    );
  }
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
      <Package className="h-5 w-5" />
    </span>
  );
}
