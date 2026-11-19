import { Badge, Button, PageHeader } from '../components/ui';
import { Icon } from '../components/icons';

interface PharmacyHeaderProps {
  section?: string;
  page?: string;
  itemCount?: number;
  onViewCart?: () => void;
}

export default function PharmacyHeader({ itemCount = 0, onViewCart }: PharmacyHeaderProps) {
  const cartLabel = itemCount > 0 ? `Cart (${itemCount})` : 'Cart';

  const cartButton = onViewCart ? (
    <Button variant="primary" onClick={onViewCart}>
      <Icon name="cart" size={18} />
      {cartLabel}
    </Button>
  ) : (
    <Button variant="primary" to="/portal/cart">
      <Icon name="cart" size={18} />
      {cartLabel}
    </Button>
  );

  return (
    <PageHeader
      eyebrow="Cedar Hollow Pharmacy"
      title="In-house pharmacy"
      subtitle="Order over-the-counter medicines and your own prescriptions from the clinic. Choose pickup at the front desk or home delivery, and pay securely online."
      actions={
        <>
          {itemCount > 0 && <Badge tone="soft">{itemCount} in cart</Badge>}
          <Button variant="secondary" to="/portal/orders">
            <Icon name="package" size={18} />
            My orders
          </Button>
          {cartButton}
        </>
      }
    />
  );
}