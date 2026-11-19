import { Badge, Button, EmptyState, LoadingBlock, Price, Section } from '../components/ui';
import { Icon } from '../components/icons';
import type { Order } from '../types';

interface OrderHistoryContentProps {
  orders: Order[];
  loading?: boolean;
  onPay?: (order: Order) => void;
  onCancel?: (order: Order) => void;
}

type BadgeTone = 'neutral' | 'primary' | 'soft' | 'success' | 'danger';

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending payment',
  received: 'Received',
  approved: 'Approved',
  packed: 'Packed',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

const STATUS_TONES: Record<string, BadgeTone> = {
  pending_payment: 'neutral',
  received: 'soft',
  approved: 'primary',
  packed: 'primary',
  out_for_delivery: 'primary',
  delivered: 'success',
  rejected: 'danger',
  cancelled: 'danger',
};

function formatOrderDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function OrderHistoryContent({ orders, loading = false, onPay, onCancel }: OrderHistoryContentProps) {
  const list: Order[] = Array.isArray(orders) ? orders : [];

  if (loading) {
    return (
      <Section>
        <LoadingBlock label="Loading your pharmacy orders" />
      </Section>
    );
  }

  if (list.length === 0) {
    return (
      <Section>
        <EmptyState
          icon="package"
          title="No pharmacy orders yet"
          text="Over-the-counter items and prescription refills you order from the Cedar Hollow pharmacy will appear here."
          action={
            <Button to="/portal/pharmacy" variant="primary">
              Browse the pharmacy
            </Button>
          }
        />
      </Section>
    );
  }

  return (
    <Section
      title="Your pharmacy orders"
      subtitle="Track each order from received through packing to pickup or delivery."
    >
      <div className="ds-table-wrap">
        <table className="ds-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Placed</th>
              <th>Type</th>
              <th>Fulfillment</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((order) => {
              const needsPayment = !order.paid_at && order.status === 'pending_payment';
              return (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>{formatOrderDate(order.created_at)}</td>
                  <td>{order.order_type === 'prescription' ? 'Prescription' : 'Over the counter'}</td>
                  <td>
                    <span className="ds-cluster">
                      <Icon name={order.fulfillment_method === 'delivery' ? 'truck' : 'map-pin'} size={16} />
                      {order.fulfillment_method === 'delivery' ? 'Home delivery' : 'Clinic pickup'}
                    </span>
                  </td>
                  <td>
                    <Price value={Number(order.total_amount)} />
                  </td>
                  <td>
                    <Badge tone={STATUS_TONES[order.status] || 'neutral'}>
                      {STATUS_LABELS[order.status] || order.status}
                    </Badge>
                  </td>
                  <td>
                    <span className="ds-cluster">
                      {needsPayment && onPay && (
                        <Button variant="primary" onClick={() => onPay(order)}>
                          <Icon name="credit-card" size={16} /> Pay now
                        </Button>
                      )}
                      {needsPayment && onCancel && (
                        <Button variant="ghost" onClick={() => onCancel(order)}>
                          <Icon name="close" size={16} /> Cancel
                        </Button>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

export default OrderHistoryContent;