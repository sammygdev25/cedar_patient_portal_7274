import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { createProduct, getProductList, updateProduct } from '../api';
import { useAuth } from '../contexts/AuthContext';
import type { Product } from '../types';
import { Alert, EmptyState, LoadingBlock, Section } from '../components/ui';
import InventoryManagementHeader from '../components/InventoryManagementHeader';
import InventoryManagementContent from '../components/InventoryManagementContent';
import ProductForm from '../components/ProductForm';

type FormSubmit = NonNullable<ComponentProps<typeof ProductForm>['onSubmit']>;

interface Feedback {
  tone: 'success' | 'danger';
  text: string;
}

const LOW_STOCK_THRESHOLD = 10;

function errorText(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

function InventoryManagementPage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formOpen, setFormOpen] = useState<boolean>(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isReceptionist = user?.role === 'receptionist';

  const showFeedback = useCallback((next: Feedback) => {
    setFeedback(next);
    if (timer.current) clearTimeout(timer.current);
    if (next.tone === 'success') {
      timer.current = setTimeout(() => setFeedback(null), 2000);
    }
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      const list = await getProductList();
      setProducts(Array.isArray(list) ? list : []);
    } catch (err) {
      showFeedback({ tone: 'danger', text: errorText(err, 'Could not load the pharmacy stock list.') });
    }
  }, [showFeedback]);

  useEffect(() => {
    if (!isReceptionist) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadProducts().finally(() => setLoading(false));
  }, [isReceptionist, loadProducts]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setRefreshing(false);
  };

  const handleAddProduct = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleEdit = (product: Product) => {
    setEditing(product);
    setFormOpen(true);
  };

  const handleCancel = () => {
    setEditing(null);
    setFormOpen(false);
  };

  const handleMarkOutOfStock = async (product: Product) => {
    try {
      const patch = { stock_quantity: 0 } as unknown as Parameters<typeof updateProduct>[1];
      await updateProduct(product.id, patch);
      await loadProducts();
      showFeedback({ tone: 'success', text: `${product.name} marked out of stock` });
    } catch (err) {
      showFeedback({ tone: 'danger', text: errorText(err, `Could not update ${product.name}.`) });
    }
  };

  const handleSubmit: FormSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (editing) {
        await updateProduct(editing.id, values as unknown as Parameters<typeof updateProduct>[1]);
      } else {
        await createProduct(values as unknown as Parameters<typeof createProduct>[0]);
      }
      await loadProducts();
      showFeedback({ tone: 'success', text: editing ? 'Product saved' : 'Product added to the catalog' });
      setEditing(null);
      setFormOpen(false);
    } catch (err) {
      showFeedback({ tone: 'danger', text: errorText(err, 'Could not save the product.') });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return <LoadingBlock label="Checking your access..." />;
  }

  if (!isReceptionist) {
    return (
      <Section narrow>
        <EmptyState
          icon="shield"
          title="Reception access only"
          text="Pharmacy stock is managed by the Cedar Hollow reception team. Sign in with a reception account to continue."
        />
      </Section>
    );
  }

  const outOfStockCount = products.filter((p) => Number(p.stock_quantity) <= 0).length;
  const lowStockCount = products.filter((p) => {
    const stock = Number(p.stock_quantity);
    return stock > 0 && stock <= LOW_STOCK_THRESHOLD;
  }).length;

  return (
    <div className="ds-stack-lg">
      <InventoryManagementHeader
        totalProducts={products.length}
        lowStockCount={lowStockCount}
        outOfStockCount={outOfStockCount}
        onAddProduct={handleAddProduct}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
      {feedback && (
        <Section tight>
          <Alert tone={feedback.tone}>{feedback.text}</Alert>
        </Section>
      )}
      {formOpen && (
        <Section
          tight
          title={editing ? `Edit ${editing.name}` : 'Add a product'}
          subtitle="Changes appear in the patient pharmacy catalog right away."
        >
          <ProductForm
            product={editing ?? undefined}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitting={submitting}
          />
        </Section>
      )}
      <InventoryManagementContent
        products={products}
        loading={loading}
        onMarkOutOfStock={handleMarkOutOfStock}
        onEdit={handleEdit}
        onAddProduct={handleAddProduct}
      />
    </div>
  );
}

export default InventoryManagementPage;
