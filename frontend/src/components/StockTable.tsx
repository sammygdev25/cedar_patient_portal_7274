import type { Product } from '../types';
import { Badge, Button, EmptyState, Media, Price } from '../components/ui';
import { Icon } from '../components/icons';

interface StockTableProps {
  products: Product[];
  onMarkOutOfStock: (product: Product) => void;
  onEdit: (product: Product) => void;
}

const LOW_STOCK_THRESHOLD = 10;

type StockTone = 'success' | 'soft' | 'danger';

function stockTone(quantity: number): StockTone {
  if (quantity <= 0) return 'danger';
  if (quantity <= LOW_STOCK_THRESHOLD) return 'soft';
  return 'success';
}

function stockLabel(quantity: number): string {
  if (quantity <= 0) return 'Out of stock';
  if (quantity <= LOW_STOCK_THRESHOLD) return `Low stock: ${quantity} left`;
  return `${quantity} in stock`;
}

function StockTable({ products, onMarkOutOfStock, onEdit }: StockTableProps) {
  const rows: Product[] = Array.isArray(products) ? products : [];

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="package"
        title="No pharmacy products yet"
        text="Add your first over-the-counter or prescription medicine to start tracking stock for Cedar Hollow Health."
      />
    );
  }

  return (
    <div className="ds-table-wrap">
      <table className="ds-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Visibility</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((product) => {
            const quantity = Number(product.stock_quantity) || 0;
            const soldOut = quantity <= 0;
            return (
              <tr key={product.id}>
                <td>
                  <div className="ds-cluster">
                    <Media src={product.image || ''} alt={product.name} ratio="square" />
                    <div className="ds-stack">
                      <strong>{product.name}</strong>
                      {product.requires_prescription && (
                        <Badge tone="primary">Prescription only</Badge>
                      )}
                    </div>
                  </div>
                </td>
                <td>{product.category || 'Uncategorized'}</td>
                <td>
                  <Price value={Number(product.price)} />
                </td>
                <td>
                  <Badge tone={stockTone(quantity)}>{stockLabel(quantity)}</Badge>
                </td>
                <td>
                  <Badge tone={product.is_active ? 'success' : 'neutral'}>
                    {product.is_active ? 'Listed' : 'Hidden'}
                  </Badge>
                </td>
                <td>
                  <div className="ds-cluster">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => onEdit(product)}
                    >
                      <Icon name="edit" size={16} />
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      type="button"
                      disabled={soldOut}
                      onClick={() => onMarkOutOfStock(product)}
                    >
                      <Icon name="alert" size={16} />
                      {soldOut ? 'Sold out' : 'Mark out of stock'}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default StockTable;