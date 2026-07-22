import { useFieldArray, useForm } from 'react-hook-form';
import { Plus, Trash2 } from 'lucide-react';
import { PAYMENT_TYPES, PAYMENT_TYPE_LABELS } from '@dokaandm/shared';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Textarea, Select, Field } from '../../components/ui/Input.jsx';
import { ProductPicker } from '../products/ProductPicker.jsx';
import { useCreateOrder } from '../../hooks/data.js';
import { apiError } from '../../lib/api.js';
import { toast } from '../../store/toastStore.js';
import { formatNpr } from '../../lib/format.js';

const emptyItem = { productId: '', productName: '', qty: 1, unitPriceNpr: '' };

export function OrderFormModal({ open, onClose, prefill = {}, onCreated }) {
  const createOrder = useCreateOrder();

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      customerName: prefill.customerName || '',
      phone: prefill.phone || '',
      address: '',
      paymentType: 'cod',
      paymentReference: '',
      shippingNpr: 0,
      notes: '',
      items: [{ ...emptyItem }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');
  const shipping = Number(watch('shippingNpr')) || 0;
  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.qty) || 0) * (Number(it.unitPriceNpr) || 0),
    0
  );
  const total = subtotal + shipping;

  const submit = async (values) => {
    const payload = {
      ...values,
      conversationId: prefill.conversationId,
      items: values.items.map((it) => ({
        productId: it.productId || undefined,
        productName: it.productName,
        qty: Number(it.qty),
        unitPriceNpr: Number(it.unitPriceNpr),
      })),
      shippingNpr: Number(values.shippingNpr) || 0,
    };
    try {
      const { order } = await createOrder.mutateAsync(payload);
      toast.success(`Order ${order.orderNumber} created`, 'Order captured');
      reset();
      onCreated?.(order);
      onClose();
    } catch (err) {
      const e = apiError(err);
      if (e.code === 'PLAN_QUOTA_EXCEEDED') {
        toast.error(e.message, 'Order limit reached');
      } else {
        toast.error(e.message, 'Could not create order');
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Capture order"
      description="Turn this conversation into a tracked order."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit(submit)} loading={createOrder.isPending}>
            Create order · NPR {formatNpr(total * 100)}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(submit)} className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="label-base mb-0">Items</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => append({ ...emptyItem })}>
              <Plus className="h-4 w-4" /> Add item
            </Button>
          </div>
          <div className="space-y-2">
            {fields.map((field, i) => (
              <div key={field.id} className="flex items-start gap-2">
                <div className="flex-1">
                  {/* hidden productId + productName registered; picker drives them */}
                  <input type="hidden" {...register(`items.${i}.productId`)} />
                  <input type="hidden" {...register(`items.${i}.productName`, { required: true })} />
                  <ProductPicker
                    value={watch(`items.${i}.productName`)}
                    linked={!!watch(`items.${i}.productId`)}
                    invalid={!!errors.items?.[i]?.productName}
                    onType={(name) => {
                      setValue(`items.${i}.productName`, name, { shouldValidate: true });
                      setValue(`items.${i}.productId`, '');
                    }}
                    onPick={(p) => {
                      setValue(`items.${i}.productId`, p._id);
                      setValue(`items.${i}.productName`, p.name, { shouldValidate: true });
                      setValue(`items.${i}.unitPriceNpr`, p.pricePaisa / 100, { shouldValidate: true });
                    }}
                  />
                </div>
                <Input
                  className="w-16 text-center"
                  type="number"
                  min="1"
                  aria-label="Quantity"
                  {...register(`items.${i}.qty`, { required: true, min: 1 })}
                />
                <Input
                  className="w-28"
                  type="number"
                  min="0"
                  placeholder="Price"
                  invalid={!!errors.items?.[i]?.unitPriceNpr}
                  {...register(`items.${i}.unitPriceNpr`, { required: true })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-fg-muted hover:text-danger"
                  disabled={fields.length === 1}
                  onClick={() => remove(i)}
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Customer name">
            <Input placeholder="Full name" {...register('customerName')} />
          </Field>
          <Field label="Phone" required error={errors.phone && 'Phone is required'}>
            <Input
              placeholder="98XXXXXXXX"
              invalid={!!errors.phone}
              {...register('phone', { required: true })}
            />
          </Field>
        </div>

        <Field label="Delivery address">
          <Textarea rows={2} placeholder="Tole, city, landmark…" {...register('address')} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Payment">
            <Select {...register('paymentType')}>
              {PAYMENT_TYPES.map((p) => (
                <option key={p} value={p}>
                  {PAYMENT_TYPE_LABELS[p]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Payment ref" hint="Optional">
            <Input placeholder="Txn / note" {...register('paymentReference')} />
          </Field>
          <Field label="Shipping (NPR)">
            <Input type="number" min="0" {...register('shippingNpr')} />
          </Field>
        </div>

        <div className="rounded-lg border border-border bg-surface-2 px-4 py-3">
          <div className="flex justify-between text-sm text-fg-secondary">
            <span>Subtotal</span>
            <span>NPR {formatNpr(subtotal * 100)}</span>
          </div>
          <div className="flex justify-between text-sm text-fg-secondary">
            <span>Shipping</span>
            <span>NPR {formatNpr(shipping * 100)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold text-fg">
            <span>Total</span>
            <span>NPR {formatNpr(total * 100)}</span>
          </div>
        </div>
      </form>
    </Modal>
  );
}
