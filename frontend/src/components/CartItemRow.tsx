import { Badge, Button, Cluster, Media, Price } from '../components/ui';
import { Icon } from '../components/icons';
import type { CartItem } from '../contexts/CartContext';

interface CartItemRowProps {
  item: CartItem;
  onQuantityChange: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
}

function CartItemRow({ item, onQuantityChange, onRemove }: CartItemRowProps) {
  const { product, quantity } = item;
  const unitPrice = Number(product.price) || 0;
  const lineTotal = unitPrice * quantity;
  const stock = Number(product.stock_quantity);
  const hasStockLimit = Number.isFinite(stock) && stock >= 0;
  const atMax = hasStockLimit && quantity >= stock;
  const atMin = quantity <= 1;

  const handleDecrease = () => {
    if (!atMin) onQuantityChange(product.id, quantity - 1);
  };

  const handleIncrease = () => {
    if (!atMax) onQuantityChange(product.id, quantity + 1);
  };

  return (
    <div className="ds-card">
      <div className="ds-card-body ds-between">
        <Cluster gap="md" align="center">
          <div style={{ width: 88 }}>
            <Media src={product.image || undefined} alt={product.name} ratio="square" />
          </div>
          <div className="ds-stack">
            <span className="ds-card-title">{product.name}</span>
            <span className="ds-card-meta">
              {product.category ? `${product.category} · ` : ''}
              <Price value={unitPrice} /> each
            </span>
            {hasStockLimit && stock <= 5 && (
              <Badge tone={stock === 0 ? 'danger' : 'soft'}>
                {stock === 0 ? 'Out of stock' : `Only ${stock} left`}
              </Badge>
            )}
          </div>
        </Cluster>

        <Cluster gap="md" align="center">
          <Cluster gap="sm" align="center">
            <Button
              variant="secondary"
              onClick={handleDecrease}
              disabled={atMin}
              aria-label={`Decrease quantity of ${product.name}`}
            >
              <Icon name="minus" size={16} />
            </Button>
            <span aria-live="polite" aria-label={`Quantity ${quantity}`}>
              {quantity}
            </span>
            <Button
              variant="secondary"
              onClick={handleIncrease}
              disabled={atMax}
              aria-label={`Increase quantity of ${product.name}`}
            >
              <Icon name="plus" size={16} />
            </Button>
          </Cluster>

          <Price value={lineTotal} />

          <Button
            variant="ghost"
            onClick={() => onRemove(product.id)}
            aria-label={`Remove ${product.name} from cart`}
          >
            <Icon name="trash" size={18} />
          </Button>
        </Cluster>
      </div>
    </div>
  );
}

export default CartItemRow;