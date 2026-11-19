import { Badge, Button, Card, CardBody, CardFooter, CardMeta, CardTitle, Media, Price } from './ui';
import { Icon } from './icons';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const stock = Number(product.stock_quantity);
  const inStock = Number.isFinite(stock) && stock > 0;
  const lowStock = inStock && stock <= 5;
  const needsPrescription = Boolean(product.requires_prescription);
  const canAdd = inStock && !needsPrescription && product.is_active !== false;

  return (
    <Card>
      <Media
        src={product.image || undefined}
        alt={product.name}
        ratio="square"
        badge={product.category || undefined}
      />
      <CardBody>
        <CardTitle>{product.name}</CardTitle>
        {product.description ? (
          <CardMeta>{product.description}</CardMeta>
        ) : null}
        <div className="ds-cluster">
          {needsPrescription ? (
            <Badge tone="primary">
              <Icon name="shield" size={14} /> Prescription only
            </Badge>
          ) : (
            <Badge tone="soft">Over the counter</Badge>
          )}
          {!inStock ? <Badge tone="danger">Out of stock</Badge> : null}
          {lowStock ? <Badge tone="danger">Only {stock} left</Badge> : null}
          {inStock && !lowStock ? <Badge tone="success">In stock</Badge> : null}
        </div>
        {needsPrescription ? (
          <p className="ds-small ds-muted">
            Order this medicine from your prescriptions once your doctor has issued it.
          </p>
        ) : null}
      </CardBody>
      <CardFooter>
        <Price value={Number(product.price)} />
        <Button
          type="button"
          variant="primary"
          disabled={!canAdd}
          onClick={() => onAddToCart(product)}
        >
          <Icon name="cart" size={16} />
          {needsPrescription ? 'Prescription required' : inStock ? 'Add to cart' : 'Unavailable'}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ProductCard;