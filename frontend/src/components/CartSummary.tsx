import { Badge, Button, Card, CardBody, CardTitle, Cluster, Price, Stack } from '../components/ui';
import { Icon } from '../components/icons';

interface CartSummaryProps {
  subtotal: number;
  deliveryFee: number;
  fulfillmentMethod: string;
  onCheckout?: () => void;
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function CartSummary({ subtotal, deliveryFee, fulfillmentMethod, onCheckout }: CartSummaryProps) {
  const isDelivery = fulfillmentMethod === 'delivery';
  const safeSubtotal = Number.isFinite(Number(subtotal)) ? Number(subtotal) : 0;
  const safeFee = isDelivery && Number.isFinite(Number(deliveryFee)) ? Number(deliveryFee) : 0;
  const total = safeSubtotal + safeFee;

  const handleCheckout = () => {
    if (onCheckout) {
      onCheckout();
      return;
    }
    const target = document.getElementById('checkout');
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Card>
      <CardBody>
        <Stack gap="md">
          <Cluster justify="between">
            <CardTitle>Order summary</CardTitle>
            <Badge tone="soft">
              <Icon name={isDelivery ? 'truck' : 'package'} size={14} />
              {isDelivery ? ' Home delivery' : ' Clinic pickup'}
            </Badge>
          </Cluster>

          <Cluster justify="between">
            <span className="ds-muted">Subtotal</span>
            <span>{money.format(safeSubtotal)}</span>
          </Cluster>

          <Cluster justify="between">
            <span className="ds-muted">{isDelivery ? 'Delivery fee' : 'Pickup at Cedar Hollow pharmacy'}</span>
            <span>{isDelivery ? money.format(safeFee) : 'Free'}</span>
          </Cluster>

          <hr className="ds-divider" />

          <Cluster justify="between">
            <strong>Total</strong>
            <Price value={total} />
          </Cluster>

          <Button variant="primary" size="lg" onClick={handleCheckout} disabled={safeSubtotal <= 0}>
            <Icon name="credit-card" size={18} /> Continue to checkout
          </Button>

          <p className="ds-small ds-muted">
            <Icon name="shield" size={14} /> You pay securely by card after placing the order. Prescription
            medicines are ordered separately and need your doctor's approval.
          </p>
        </Stack>
      </CardBody>
    </Card>
  );
}

export default CartSummary;