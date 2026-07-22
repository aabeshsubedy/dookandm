import { useEffect, useRef, useState } from 'react';
import { Package, Check, AlertTriangle } from 'lucide-react';
import { LOW_STOCK_THRESHOLD } from '@dokaandm/shared';
import { Input } from '../../components/ui/Input.jsx';
import { useProducts } from '../../hooks/data.js';
import { useDebounced } from '../../hooks/useDebounced.js';
import { nprLabel } from '../../lib/format.js';
import { cn } from '../../lib/cn.js';

/**
 * Searchable product combobox for order capture. Type to search the catalog by
 * name or SKU; pick a product to autofill name + price (and link it), or keep a
 * free-typed name for one-off items not in the catalog.
 *
 * Props:
 *   value        — current product name (controlled)
 *   linked       — whether the current row is linked to a catalog product
 *   onType(str)  — free text changed (clears the product link)
 *   onPick(prod) — a catalog product was selected
 *   invalid      — validation state
 */
export function ProductPicker({ value, linked, onType, onPick, invalid, placeholder }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapRef = useRef(null);
  const q = useDebounced(query, 200);

  // Only fetch when the dropdown is open (avoids N queries per item row at rest).
  const { data, isFetching } = useProducts(open ? { q, status: 'active' } : {});
  const products = open ? data?.data || [] : [];

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = (p) => {
    onPick(p);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={wrapRef} className="relative">
      <div className="relative">
        {linked && (
          <Package className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-brand" />
        )}
        <Input
          className={cn(linked && 'pl-8')}
          placeholder={placeholder || 'Search products or type a name…'}
          invalid={invalid}
          value={value}
          onChange={(e) => {
            onType(e.target.value);
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setQuery(value || '');
            setOpen(true);
          }}
          autoComplete="off"
        />
      </div>

      {open && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-lg animate-fade-in">
          {isFetching && products.length === 0 ? (
            <p className="px-3 py-2 text-sm text-fg-muted">Searching…</p>
          ) : products.length === 0 ? (
            <p className="px-3 py-3 text-center text-sm text-fg-muted">
              No products found.{' '}
              {value ? <span className="text-fg-secondary">"{value}" will be a custom item.</span> : ''}
            </p>
          ) : (
            products.map((p) => {
              const out = p.trackInventory && p.stock === 0;
              const low = p.trackInventory && p.stock <= LOW_STOCK_THRESHOLD;
              const isCurrent = linked && p.name === value;
              return (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => pick(p)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-surface-2"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-brand-soft text-brand">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt="" className="h-8 w-8 rounded-md object-cover" />
                    ) : (
                      <Package className="h-4 w-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 truncate text-sm font-medium text-fg">
                      {p.name}
                      {isCurrent && <Check className="h-3.5 w-3.5 text-brand" />}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-fg-muted">
                      <span className="font-mono">{p.sku}</span>
                      {p.trackInventory && (
                        <span className={cn('inline-flex items-center gap-0.5', out ? 'text-danger' : low ? 'text-warning' : '')}>
                          {low && <AlertTriangle className="h-3 w-3" />}
                          {out ? 'Out of stock' : `${p.stock} left`}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-fg">{nprLabel(p.pricePaisa)}</span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
