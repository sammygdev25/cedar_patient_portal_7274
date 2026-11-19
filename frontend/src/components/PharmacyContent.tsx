import { useMemo, useState } from 'react';
import type { ChangeEvent, ComponentProps } from 'react';
import { Alert, Badge, Button, Cluster, EmptyState, Section, SkeletonCards, Stack } from '../components/ui';
import { Icon } from '../components/icons';
import ProductGrid from './ProductGrid';
import PrescriptionOrderPanel from './PrescriptionOrderPanel';
import type { Prescription, Product } from '../types';

type AddToCartHandler = ComponentProps<typeof ProductGrid>['onAddToCart'];
type PrescriptionOrderHandler = ComponentProps<typeof PrescriptionOrderPanel>['onOrder'];

interface PharmacyContentProps {
  products?: Product[];
  prescriptions?: Prescription[];
  loading?: boolean;
  error?: string;
  deliveryFee?: number;
  submitting?: boolean;
  onAddToCart: AddToCartHandler;
  onOrderPrescription: PrescriptionOrderHandler;
}

type PharmacyTab = 'otc' | 'prescription';

export default function PharmacyContent({
  products = [],
  prescriptions = [],
  loading = false,
  error = '',
  deliveryFee = 0,
  submitting = false,
  onAddToCart,
  onOrderPrescription,
}: PharmacyContentProps) {
  const [tab, setTab] = useState<PharmacyTab>('otc');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  const otcProducts = useMemo(
    () => (Array.isArray(products) ? products : []).filter((p) => !p.requires_prescription),
    [products]
  );

  const categories = useMemo(() => {
    const names = otcProducts.map((p) => p.category).filter((c): c is string => Boolean(c));
    return Array.from(new Set(names)).sort();
  }, [otcProducts]);

  const visibleProducts = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return otcProducts.filter((p) => {
      if (category && p.category !== category) return false;
      if (!needle) return true;
      return `${p.name} ${p.description ?? ''}`.toLowerCase().includes(needle);
    });
  }, [otcProducts, query, category]);

  const myPrescriptions = Array.isArray(prescriptions) ? prescriptions : [];

  const clearFilters = () => {
    setQuery('');
    setCategory('');
  };

  return (
    <Section
      eyebrow="Cedar Hollow Pharmacy"
      title={tab === 'otc' ? 'Over-the-counter medicines' : 'Your prescriptions'}
      subtitle={
        tab === 'otc'
          ? 'Pick up in the clinic or have it delivered to your door.'
          : 'Order only medicines your doctor prescribed to you. Your doctor approves each order before it is packed.'
      }
      actions={
        <Cluster gap="sm">
          <Button variant={tab === 'otc' ? 'primary' : 'secondary'} onClick={() => setTab('otc')}>
            <Icon name="package" size={16} /> Catalog
          </Button>
          <Button variant={tab === 'prescription' ? 'primary' : 'secondary'} onClick={() => setTab('prescription')}>
            <Icon name="book" size={16} /> Prescriptions
            <Badge tone="soft">{myPrescriptions.length}</Badge>
          </Button>
        </Cluster>
      }
    >
      <Stack gap="md">
        {error ? <Alert tone="danger">{error}</Alert> : null}

        {tab === 'otc' ? (
          <>
            <div className="ds-filters">
              <input
                className="input"
                type="search"
                placeholder="Search pain relief, vitamins, first aid"
                aria-label="Search medicines"
                value={query}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              />
              <Cluster gap="sm">
                <Button variant={category === '' ? 'primary' : 'ghost'} onClick={() => setCategory('')}>
                  All
                </Button>
                {categories.map((name) => (
                  <Button
                    key={name}
                    variant={category === name ? 'primary' : 'ghost'}
                    onClick={() => setCategory(name)}
                  >
                    {name}
                  </Button>
                ))}
              </Cluster>
            </div>

            {loading ? (
              <SkeletonCards count={6} />
            ) : visibleProducts.length === 0 ? (
              <EmptyState
                icon="search"
                title="No medicines match"
                text="Try a different search or browse every category in the pharmacy."
                action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
              />
            ) : (
              <ProductGrid products={visibleProducts} loading={false} onAddToCart={onAddToCart} />
            )}
          </>
        ) : loading ? (
          <SkeletonCards count={2} />
        ) : myPrescriptions.length === 0 ? (
          <EmptyState
            icon="book"
            title="No active prescriptions"
            text="When a Cedar Hollow doctor prescribes a medicine after your visit, you can order it here."
            action={<Button variant="secondary" onClick={() => setTab('otc')}>Browse the catalog</Button>}
          />
        ) : (
          <PrescriptionOrderPanel
            prescriptions={myPrescriptions}
            deliveryFee={deliveryFee}
            onOrder={onOrderPrescription}
            submitting={submitting}
          />
        )}
      </Stack>
    </Section>
  );
}