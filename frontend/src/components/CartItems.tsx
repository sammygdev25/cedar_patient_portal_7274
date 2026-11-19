import type { ReactNode } from 'react';
import { Badge, Button, Cluster, EmptyState, Media, Price, Section, Stack, WithSidebar } from '../components/ui';
import { Icon } from '../components/icons';
import type { CartItem } from '../contexts/CartContext';

interface CartItemsProps {
  items: CartItem[];
  onQuantityChange: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
  sidebar?: ReactNode;
}

function CartItems({ items, onQuantityChange, onRemove, sidebar }: CartItemsProps) {
  const lines = Array.isArray(items) ? items : [];

  if (lines.length === 0) {
    return (
      <Section narrow>
        <EmptyState
          icon="cart"
          title="Your pharmacy cart is empty"
          text="Browse over-the-counter medicines from the Cedar Hollow Health pharmacy and add what you need for pickup or home delivery."
          action={
            <Button to="/portal/pharmacy" variant="primary">
              <Icon name="arrow-left" size={16} /> Browse the pharmacy
            </Button>
          }
        />
      </Section>
    );
  }

  return (
    <Section
      eyebrow="Pharmacy cart"
      title="Items in your cart"
      subtitle="Adjust quantities or remove items before choosing pickup or delivery."
    >
      <WithSidebar sidebar={sidebar}>
        <div className="ds-table-wrap">
          <table className="ds-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Unit price</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>
                  <span className="ds-small">Remove</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map(({ product, quantity }) => {
                const stock = Number(product.stock_quantity);
                const atMax = Number.isFinite(stock) && quantity >= stock;
                const unit = Number(product.price) || 0;
                return (
                  <tr key={product.id}>
                    <td>
                      <Cluster gap="sm" align="center">
                        <Media
                          src={product.image || undefined}
                          alt={product.name}
                          ratio="square"
                        />
                        <Stack gap="xs">
                          <strong>{product.name}</strong>
                          {product.category ? (
                            <span className="ds-small ds-muted">{product.category}</span>
                          ) : null}
                          {atMax ? <Badge tone="soft">Max stock in cart</Badge> : null}
                        </Stack>
                      </Cluster>
                    </td>
                    <td>
                      <Price value={unit} />
                    </td>
                    <td>
                      <Cluster gap="xs" align="center">
                        <Button
                          variant="ghost"
                          aria-label={`Decrease quantity of ${product.name}`}
                          disabled={quantity <= 1}
                          onClick={() => onQuantityChange(product.id, quantity - 1)}
                        >
                          <Icon name="minus" size={16} />
                        </Button>
                        <strong>{quantity}</strong>
                        <Button
                          variant="ghost"
                          aria-label={`Increase quantity of ${product.name}`}
                          disabled={atMax}
                          onClick={() => onQuantityChange(product.id, quantity + 1)}
                        >
                          <Icon name="plus" size={16} />
                        </Button>
                      </Cluster>
                    </td>
                    <td>
                      <Price value={unit * quantity} />
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        aria-label={`Remove ${product.name} from cart`}
                        onClick={() => onRemove(product.id)}
                      >
                        <Icon name="trash" size={16} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </WithSidebar>
    </Section>
  );
}

export default CartItems;