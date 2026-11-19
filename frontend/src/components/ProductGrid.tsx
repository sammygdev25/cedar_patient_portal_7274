import { Grid, SkeletonCards, EmptyState, Button } from '../components/ui';
import type { Product } from '../types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  onAddToCart: (product: Product) => void;
}

function ProductGrid({ products, loading, onAddToCart }: ProductGridProps) {
  const list: Product[] = Array.isArray(products) ? products : [];

  if (loading) {
    return (
      <Grid size="md">
        <SkeletonCards count={6} />
      </Grid>
    );
  }

  if (list.length === 0) {
    return (
      <EmptyState
        icon="package"
        title="No medicines match your search"
        text="Try a different category or search term. The Cedar Hollow pharmacy restocks over-the-counter items every week."
        action={
          <Button variant="secondary" to="/portal/orders">
            View my orders
          </Button>
        }
      />
    );
  }

  return (
    <Grid size="md">
      {list.map((product) => (
        <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} />
      ))}
    </Grid>
  );
}

export default ProductGrid;