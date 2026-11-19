import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder, getPrescriptionList, getProductList } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import PharmacyHeader from '../components/PharmacyHeader';
import PharmacyContent from '../components/PharmacyContent';
import { Alert } from '../components/ui';
import type { Prescription, Product } from '../types';

// Flat fee shown at checkout; the server computes the authoritative amount.
const DELIVERY_FEE = 5;

type OrderPayload = Parameters<typeof createOrder>[0];

function messageFrom(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === 'object') {
    const response = (err as { response?: { data?: unknown } }).response;
    const data = response?.data;
    if (typeof data === 'string' && data) return data;
    if (data && typeof data === 'object') {
      const detail = (data as { detail?: unknown }).detail;
      if (typeof detail === 'string' && detail) return detail;
      const first = Object.values(data as Record<string, unknown>)[0];
      if (Array.isArray(first) && typeof first[0] === 'string') return first[0];
      if (typeof first === 'string') return first;
    }
  }
  return fallback;
}

function PharmacyPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItem, itemCount } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const productList = await getProductList();
        if (cancelled) return;
        setProducts(productList.filter((product) => product.is_active !== false));
      } catch (err) {
        if (!cancelled) {
          setProducts([]);
          setLoadError(messageFrom(err, 'We could not load the pharmacy catalog. Please try again.'));
        }
      }

      if (isAuthenticated) {
        try {
          const prescriptionList = await getPrescriptionList();
          if (!cancelled) {
            setPrescriptions(prescriptionList.filter((item) => item.is_active !== false));
          }
        } catch {
          if (!cancelled) setPrescriptions([]);
        }
      } else if (!cancelled) {
        setPrescriptions([]);
      }

      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const handleAddToCart = useCallback(
    (product: Product, quantity?: number) => {
      setActionError('');
      addItem(product, quantity ?? 1);
    },
    [addItem]
  );

  const handleOrderPrescription = useCallback(
    async (prescriptionArg: unknown, detailsArg?: unknown): Promise<void> => {
      setActionError('');
      setSubmitting(true);
      try {
        const prescriptionId =
          typeof prescriptionArg === 'number'
            ? prescriptionArg
            : (prescriptionArg as { id?: number } | null)?.id;
        if (typeof prescriptionId !== 'number') {
          throw new Error('Choose a prescription to order.');
        }
        const details =
          detailsArg && typeof detailsArg === 'object' ? (detailsArg as Record<string, unknown>) : {};
        const fulfillment = details.fulfillment_method === 'delivery' ? 'delivery' : 'pickup';
        const payload = {
          order_type: 'prescription',
          prescription: prescriptionId,
          fulfillment_method: fulfillment,
          delivery_address: fulfillment === 'delivery' ? String(details.delivery_address ?? '') : '',
          phone: String(details.phone ?? ''),
          notes: String(details.notes ?? ''),
        } as unknown as OrderPayload;
        const order = (await createOrder(payload)) as { id: number };
        navigate(`/order-pay?order=${order.id}`);
      } catch (err) {
        setActionError(messageFrom(err, 'We could not place your prescription order. Please try again.'));
      } finally {
        setSubmitting(false);
      }
    },
    [navigate]
  );

  return (
    <div className="ds-stack-lg">
      <PharmacyHeader itemCount={itemCount} onViewCart={() => navigate('/portal/cart')} />
      {actionError && (
        <div className="ds-container">
          <Alert tone="danger">{actionError}</Alert>
        </div>
      )}
      <PharmacyContent
        products={products}
        prescriptions={prescriptions}
        loading={loading}
        error={loadError}
        deliveryFee={DELIVERY_FEE}
        submitting={submitting}
        onAddToCart={handleAddToCart}
        onOrderPrescription={handleOrderPrescription}
      />
    </div>
  );
}

export default PharmacyPage;