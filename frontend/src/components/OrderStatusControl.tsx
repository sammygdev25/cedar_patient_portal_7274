import type { Order } from '../types';
import OrderStatusStepper from './OrderStatusStepper';
import { Badge, Button, Stack, Cluster } from './ui';
import { Icon } from './icons';

interface OrderStatusControlProps {
  order: Order;
  onChangeStatus: (status: string) => void | Promise<void>;
  updating: boolean;
}

interface NextStep {
  status: string;
  label: string;
}

interface StepInfo {
  next: NextStep | null;
  message: string;
  tone: 'neutral' | 'primary' | 'soft' | 'success' | 'danger';
}

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

function describeStep(status: string, orderType: string, fulfillment: string): StepInfo {
  switch (status) {
    case 'pending_payment':
      return {
        next: null,
        message: 'Waiting for the patient to pay through Stripe. The order can be processed once payment clears.',
        tone: 'neutral',
      };
    case 'received':
      if (orderType === 'prescription') {
        return {
          next: null,
          message: 'Prescription order. The prescribing doctor must approve it before it can be packed.',
          tone: 'soft',
        };
      }
      return {
        next: { status: 'approved', label: 'Approve order' },
        message: 'Payment received. Confirm the items are in stock and approve the order.',
        tone: 'primary',
      };
    case 'approved':
      return {
        next: { status: 'packed', label: 'Mark as packed' },
        message: 'Approved. Pack the items and seal the bag.',
        tone: 'primary',
      };
    case 'packed':
      if (fulfillment === 'delivery') {
        return {
          next: { status: 'out_for_delivery', label: 'Send out for delivery' },
          message: 'Packed and ready. Hand the parcel to the courier.',
          tone: 'primary',
        };
      }
      return {
        next: { status: 'delivered', label: 'Mark as picked up' },
        message: 'Packed and waiting at the pharmacy desk for pickup.',
        tone: 'primary',
      };
    case 'out_for_delivery':
      return {
        next: { status: 'delivered', label: 'Mark as delivered' },
        message: 'On its way to the patient. Confirm once it has been handed over.',
        tone: 'primary',
      };
    case 'delivered':
      return { next: null, message: 'This order has been completed.', tone: 'success' };
    case 'rejected':
      return { next: null, message: 'The prescribing doctor rejected this order.', tone: 'danger' };
    case 'cancelled':
      return { next: null, message: 'This order was cancelled.', tone: 'danger' };
    default:
      return { next: null, message: 'No further action is available.', tone: 'neutral' };
  }
}

function OrderStatusControl({ order, onChangeStatus, updating }: OrderStatusControlProps) {
  const status = String(order.status);
  const orderType = String(order.order_type);
  const fulfillment = String(order.fulfillment_method);
  const info = describeStep(status, orderType, fulfillment);
  const statusLabel = STATUS_LABELS[status] || status;
  const methodLabel = fulfillment === 'delivery' ? 'Home delivery' : 'Pickup';
  const typeLabel = orderType === 'prescription' ? 'Prescription' : 'Over the counter';

  const handleAdvance = () => {
    if (info.next && !updating) {
      onChangeStatus(info.next.status);
    }
  };

  return (
    <div className="ds-card">
      <div className="ds-card-body">
        <Stack gap="md">
          <Cluster gap="sm">
            <h3 className="ds-card-title">Order #{order.id}</h3>
            <Badge tone={info.tone}>{statusLabel}</Badge>
          </Cluster>

          <Cluster gap="sm">
            <Badge tone="soft">{typeLabel}</Badge>
            <Badge tone="neutral">{methodLabel}</Badge>
          </Cluster>

          <OrderStatusStepper
            status={status}
            fulfillmentMethod={fulfillment}
            orderType={orderType}
          />

          <p className="ds-muted ds-small">{info.message}</p>

          {info.next ? (
            <div className="ds-form-actions">
              <Button variant="primary" onClick={handleAdvance} disabled={updating}>
                {updating ? (
                  'Updating...'
                ) : (
                  <>
                    {info.next.label}
                    <Icon name="arrow-right" size={16} />
                  </>
                )}
              </Button>
            </div>
          ) : (
            <Cluster gap="sm">
              <Icon name={status === 'delivered' ? 'check' : 'info'} size={16} />
              <span className="ds-small ds-muted">No action needed right now</span>
            </Cluster>
          )}
        </Stack>
      </div>
    </div>
  );
}

export default OrderStatusControl;