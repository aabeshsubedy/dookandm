import { useEffect } from 'react';
import { Package } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Textarea, Field } from '../../components/ui/Input.jsx';
import { useCreateProduct, useUpdateProduct } from '../../hooks/data.js';
import { apiError } from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { cn } from '../../lib/cn.js';

const blank = {
  name: '',
  sku: '',
  priceNpr: '',
  costNpr: '',
  category: '',
  description: '',
  imageUrl: '',
  trackInventory: false,
  stock: 0,
};

/** Create or edit a catalog product. Pass `product` to edit, omit to create. */
export function ProductFormModal({ open, onClose, product = null, onSaved }) {
  const isEdit = !!product;
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: blank });

  useEffect(() => {
    if (open) {
      reset(
        product
          ? {
              name: product.name || '',
              sku: product.sku || '',
              priceNpr: product.pricePaisa != null ? product.pricePaisa / 100 : '',
              costNpr: product.costPaisa != null ? product.costPaisa / 100 : '',
              category: product.category || '',
              description: product.description || '',
              imageUrl: product.imageUrl || '',
              trackInventory: !!product.trackInventory,
              stock: product.stock ?? 0,
            }
          : blank
      );
    }
  }, [open, product, reset]);

  const tracked = watch('trackInventory');
  const imageUrl = watch('imageUrl');

  const submit = async (values) => {
    const payload = {
      name: values.name,
      sku: values.sku?.trim() || undefined,
      priceNpr: Number(values.priceNpr),
      costNpr: values.costNpr === '' || values.costNpr == null ? undefined : Number(values.costNpr),
      category: values.category?.trim() || undefined,
      description: values.description?.trim() || undefined,
      imageUrl: values.imageUrl?.trim() || undefined,
      trackInventory: !!values.trackInventory,
      stock: values.trackInventory ? Number(values.stock || 0) : undefined,
    };
    try {
      const saved = isEdit
        ? await update.mutateAsync({ id: product._id, ...payload })
        : await create.mutateAsync(payload);
      toast.success(isEdit ? 'Product updated' : 'Product added');
      onSaved?.(saved.product);
      onClose();
    } catch (err) {
      const e = apiError(err);
      const title =
        e.code === 'PLAN_QUOTA_EXCEEDED'
          ? 'Product limit reached'
          : e.code === 'SKU_TAKEN'
            ? 'Duplicate product ID'
            : 'Could not save';
      toast.error(e.message, title);
    }
  };

  const pending = create.isPending || update.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit product' : 'Add product'}
      description={
        isEdit
          ? product?.sku
            ? `Product ID · ${product.sku}`
            : 'Update catalog details'
          : 'Add an item to your catalog for quick order capture.'
      }
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit(submit)} loading={pending}>
            {isEdit ? 'Save changes' : 'Add product'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        {/* Identity */}
        <section>
          <SectionLabel>Basics</SectionLabel>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="Product name"
              required
              error={errors.name && 'Name is required'}
              className="sm:col-span-2"
            >
              <Input
                placeholder="e.g. Cotton Kurta"
                invalid={!!errors.name}
                {...register('name', { required: true })}
              />
            </Field>
            <Field label="Product ID (SKU)" hint={isEdit ? undefined : 'Auto if blank'}>
              <Input placeholder="Auto" className="font-mono text-sm" {...register('sku')} />
            </Field>
          </div>
        </section>

        {/* Pricing */}
        <section>
          <SectionLabel>Pricing & category</SectionLabel>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Price (NPR)" required error={errors.priceNpr && 'Price is required'}>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                invalid={!!errors.priceNpr}
                {...register('priceNpr', { required: true })}
              />
            </Field>
            <Field label="Cost (NPR)" hint="Optional · for margin">
              <Input type="number" min="0" step="0.01" placeholder="—" {...register('costNpr')} />
            </Field>
            <Field label="Category">
              <Input placeholder="e.g. Apparel" {...register('category')} />
            </Field>
          </div>
        </section>

        {/* Media & notes */}
        <section>
          <SectionLabel>Details</SectionLabel>
          <div className="mt-3 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div
                className={cn(
                  'grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-surface-2',
                  !imageUrl && 'text-fg-muted'
                )}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <Package className="h-6 w-6" strokeWidth={1.5} />
                )}
              </div>
              <Field label="Image URL" hint="Optional" className="min-w-0 flex-1">
                <Input placeholder="https://…" {...register('imageUrl')} />
              </Field>
            </div>
            <Field label="Description">
              <Textarea
                rows={2}
                placeholder="Short description (optional)"
                {...register('description')}
              />
            </Field>
          </div>
        </section>

        {/* Inventory */}
        <section className="rounded-xl border border-border bg-bg px-4 py-3.5">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-border-strong text-brand focus:ring-brand/30"
              {...register('trackInventory')}
            />
            <span>
              <span className="block text-sm font-medium text-fg">Track inventory</span>
              <span className="mt-0.5 block text-xs text-fg-muted">
                Stock decrements when this product is linked to an order.
              </span>
            </span>
          </label>
          {tracked && (
            <div className="mt-3 border-t border-border pt-3">
              <Field label="Stock on hand">
                <Input
                  type="number"
                  min="0"
                  className="max-w-[160px]"
                  {...register('stock')}
                />
              </Field>
            </div>
          )}
        </section>
      </form>
    </Modal>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-2xs font-semibold uppercase tracking-wider text-fg-muted">{children}</p>
  );
}
