import type { Order, OrderItem } from '../types';
import { Badge, Button, Card, CardBody, CardFooter, CardMeta, CardTitle, Cluster, Price, Stack } from './ui';
import { Icon } from './icons';
import StatusBadge from './StatusBadge';

type OrderWithItems = Order & { items?: OrderItem[] };

interface OrderCardProps {
  order: Order;
  onPay?: (orderId: number) => void;
  onCancel?: (orderId: number) => void;
}

function formatOrderDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function OrderCard({ order, onPay, onCancel }: OrderCardProps) {
  const items: OrderItem[] = (order as OrderWithItems).items ?? [];
  const isDelivery = order.fulfillment_method === 'delivery';
  const isPrescription = order.order_type === 'prescription';
  const needsPayment = !order.paid_at && order.status === 'pending_payment';
  const canCancel = Boolean(onCancel) && (order.status === 'pending_payment' || order.status === 'received');
  const deliveryFee = Number(order.delivery_fee) || 0;

  return (
    <Card>
      <CardBody>
        <Stack gap="sm">
          <Cluster justify="between">
            <CardTitle>Order #{order.id}</CardTitle>
            <StatusBadge status={order.status} />
          </Cluster>

          <Cluster gap="sm">
            <Badge tone={isPrescription ? 'primary' : 'neutral'}>
              {isPrescription ? 'Prescription' : 'Over the counter'}
            </Badge>
            <Badge tone="soft">
              <Icon name={isDelivery ? 'truck' : 'package'} size={14} />{' '}
              {isDelivery ? 'Home delivery' : 'Pickup at clinic'}
            </Badge>
          </Cluster>

          <CardMeta>
            <Icon name="calendar" size={14} /> Placed {formatOrderDate(order.created_at)}
            {order.paid_at ? ` · Paid ${formatOrderDate(order.paid_at)}` : ''}
          </CardMeta>

          {items.length > 0 && (
            <ul className="ds-stack ds-small">
              {(Array.isArray(items) ? items : []).map((item) => (
                <li key={item.id} className="ds-between">
                  <span>
                    {item.medicine_name} <span className="ds-muted">x {item.quantity}</span>
                  </span>
                  <Price value={Number(item.unit_price) * Number(item.quantity)} />
                </li>
              ))}
            </ul>
          )}

          {isDelivery && order.delivery_address && (
            <p className="ds-small ds-muted">
              <Icon name="map-pin" size={14} /> {order.delivery_address}
            </p>
          )}
          {order.notes && <p className="ds-small ds-muted">Note: {order.notes}</p>}

          {isPrescription && order.status === 'received' && (
            <p className="ds-small ds-muted">
              <Icon name="info" size={14} /> Waiting for your doctor to approve this prescription before it is packed.
            </p>
          )}
          {order.status === 'rejected' && (
            <p className="ds-small" style={{ color: 'var(--color-danger)' }}>
              <Icon name="alert" size={14} /> This prescription order was not approved. Please contact the clinic.
            </p>
          )}
        </Stack>
      </CardBody>

      <CardFooter>
        <Stack gap="xs">
          {deliveryFee > 0 && (
            <div className="ds-between ds-small ds-muted">
              <span>Delivery fee</span>
              <Price value={deliveryFee} />
            </div>
          )}
          <div className="ds-between">
            <strong>Total</strong>
            <Price value={Number(order.total_amount) || 0} />
          </div>
          {(needsPayment || canCancel) && (
            <Cluster gap="sm" justify="end">
              {canCancel && onCancel && (
                <Button variant="ghost" onClick={() => onCancel(order.id)}>
                  Cancel order
                </Button>
              )}
              {needsPayment &&
                (onPay ? (
                  <Button variant="primary" onClick={() => onPay(order.id)}>
                    <Icon name="credit-card" size={16} /> Pay now
                  </Button>
                ) : (
                  <Button variant="primary" to={`/order-pay?order=${order.id}`}>
                    <Icon name="credit-card" size={16} /> Pay now
                  </Button>
                ))}
            </Cluster>
          )}
        </Stack>
      </CardFooter>
    </Card>
  );
}

export default OrderCard;