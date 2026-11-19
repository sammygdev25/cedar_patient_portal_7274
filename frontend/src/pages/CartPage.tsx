type FulfillmentMethod = 'pickup' | 'delivery';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { Alert, Stack } from '../components/ui';
import CartHeader from '../components/CartHeader';
import CartItems from '../components/CartItems';
import CartSummary from '../components/CartSummary';
import CheckoutForm from '../components/CheckoutForm';

const DELIVERY_FEE = 4.99;

function readText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, subtotal, itemCount, updateQuantity, removeItem, clearCart } = useCart();
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('pickup');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleCheckout = async (values: any) => {
    if (items.length === 0 || submitting) return;
    const method: FulfillmentMethod =
      (values?.fulfillment_method ?? values?.fulfillmentMethod) === 'delivery' ? 'delivery' : 'pickup';
    setFulfillmentMethod(method);
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        order_type: 'otc',
        fulfillment_method: method,
        delivery_address: method === 'delivery'
          ? readText(values?.delivery_address ?? values?.deliveryAddress)
          : '',
        phone: readText(values?.phone) || readText(user?.phone),
        notes: readText(values?.notes),
        items: (Array.isArray(items) ? items : []).map((entry) => ({
          product: entry.product.id,
          quantity: entry.quantity,
        })),
      };
      const order = await createOrder(payload as Parameters<typeof createOrder>[0]);
      clearCart();
      navigate(`/order-pay?order=${order.id}`);
    } catch (err) {
      const message = err instanceof Error && err.message
        ? err.message
        : 'We could not place your order. Please check your details and try again.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const sidebar = items.length > 0 ? (
    <Stack gap="md">
      <CartSummary
        subtotal={subtotal}
        deliveryFee={DELIVERY_FEE}
        fulfillmentMethod={fulfillmentMethod}
      />
      <CheckoutForm
        deliveryFee={DELIVERY_FEE}
        onSubmit={handleCheckout}
        submitting={submitting}
      />
    </Stack>
  ) : undefined;

  return (
    <div className="ds-stack-lg">
      <CartHeader itemCount={itemCount} onClear={items.length > 0 ? clearCart : undefined} />
      {error && (
        <div className="ds-container">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
      <CartItems
        items={items}
        onQuantityChange={updateQuantity}
        onRemove={removeItem}
        sidebar={sidebar}
      />
    </div>
  );
}

export default CartPage;
