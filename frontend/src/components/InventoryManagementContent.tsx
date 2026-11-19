import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Badge, Button, EmptyState, Grid, Price, Section, SkeletonCards, Stat } from '../components/ui';
import { Icon } from '../components/icons';
import type { Product } from '../types';

interface InventoryManagementContentProps {
  products?: Product[];
  loading?: boolean;
  onMarkOutOfStock?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onAddProduct?: () => void;
  children?: ReactNode;
}

const LOW_STOCK_LEVEL = 10;

function stockTone(quantity: number): 'danger' | 'soft' | 'success' {
  if (quantity <= 0) return 'danger';
  if (quantity <= LOW_STOCK_LEVEL) return 'soft';
  return 'success';
}

function stockLabel(quantity: number): string {
  if (quantity <= 0) return 'Out of stock';
  if (quantity <= LOW_STOCK_LEVEL) return 'Low stock';
  return 'In stock';
}

function InventoryManagementContent({
  products = [],
  loading = false,
  onMarkOutOfStock,
  onEdit,
  onAddProduct,
  children,
}: InventoryManagementContentProps) {
  const [query, setQuery] = useState('');
  const list: Product[] = Array.isArray(products) ? products : [];

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (p) =>
        String(p.name).toLowerCase().includes(term) ||
        String(p.category || '').toLowerCase().includes(term)
    );
  }, [list, query]);

  const outCount = list.filter((p) => Number(p.stock_quantity) <= 0).length;
  const lowCount = list.filter((p) => {
    const q = Number(p.stock_quantity);
    return q > 0 && q <= LOW_STOCK_LEVEL;
  }).length;

  return (
    <Section
      eyebrow="Pharmacy stock"
      title="Cedar Hollow pharmacy inventory"
      subtitle="Keep the over-the-counter catalog accurate. Mark items out of stock so patients cannot order them."
      actions={
        onAddProduct ? (
          <Button variant="primary" onClick={onAddProduct}>
            <Icon name="plus" size={16} /> Add product
          </Button>
        ) : undefined
      }
    >
      <Grid size="sm">
        <Stat value={list.length} label="Products in catalog" icon="package" />
        <Stat value={lowCount} label="Running low" icon="alert" />
        <Stat value={outCount} label="Out of stock" icon="info" />
      </Grid>

      <div className="ds-filters">
        <div className="ds-field">
          <label className="ds-label" htmlFor="stock-search">Search products</label>
          <input
            id="stock-search"
            className="input"
            type="search"
            placeholder="Search by name or category"
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <SkeletonCards count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="package"
          title={list.length === 0 ? 'No products yet' : 'No products match your search'}
          text={
            list.length === 0
              ? 'Add the first over-the-counter product to open the pharmacy catalog.'
              : 'Try a different name or category.'
          }
          action={
            list.length === 0 && onAddProduct ? (
              <Button variant="primary" onClick={onAddProduct}>Add product</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="ds-table-wrap">
          <table className="ds-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const quantity = Number(product.stock_quantity);
                return (
                  <tr key={product.id}>
                    <td>
                      <strong>{product.name}</strong>
                      {product.requires_prescription && (
                        <div className="ds-small ds-muted">Prescription only</div>
                      )}
                    </td>
                    <td>{product.category || 'General'}</td>
                    <td><Price value={Number(product.price)} /></td>
                    <td>{quantity}</td>
                    <td>
                      <Badge tone={product.is_active ? stockTone(quantity) : 'neutral'}>
                        {product.is_active ? stockLabel(quantity) : 'Hidden'}
                      </Badge>
                    </td>
                    <td>
                      <div className="ds-cluster">
                        {onEdit && (
                          <Button variant="secondary" onClick={() => onEdit(product)}>
                            <Icon name="edit" size={16} /> Edit
                          </Button>
                        )}
                        {onMarkOutOfStock && quantity > 0 && (
                          <Button variant="danger" onClick={() => onMarkOutOfStock(product)}>
                            Mark out of stock
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {children}
    </Section>
  );
}

export default InventoryManagementContent;