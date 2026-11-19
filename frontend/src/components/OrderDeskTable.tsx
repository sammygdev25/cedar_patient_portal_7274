import type { Order } from '../types';
import { Badge, EmptyState } from './ui';
import { Icon } from './icons';
import StatusBadge from './StatusBadge';

interface OrderDeskTableProps {
  orders: Order[];
  onSelect: (id: number) => void;
  selectedId?: number | null;
}

function formatPlacedAt(value: string | null | undefined): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTotal(value: number | string): string {
  const amount = Number(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function OrderDeskTable({ orders, onSelect, selectedId }: OrderDeskTableProps) {
  const rows: Order[] = Array.isArray(orders) ? orders : [];

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="package"
        title="No pharmacy orders yet"
        text="New over-the-counter and prescription orders from patients will appear here as soon as they are placed."
      />
    );
  }

  return (
    <div className="ds-table-wrap">
      <table className="ds-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Placed</th>
            <th>Type</th>
            <th>Fulfillment</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((order) => {
            const isSelected = selectedId === order.id;
            const isDelivery = order.fulfillment_method === 'delivery';
            const isPrescription = order.order_type === 'prescription';
            return (
              <tr
                key={order.id}
                role="button"
                tabIndex={0}
                aria-selected={isSelected}
                onClick={() => onSelect(order.id)}
                onKeyDown={(e: React.KeyboardEvent<HTMLTableRowElement>) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect(order.id);
                  }
                }}
                style={{
                  cursor: 'pointer',
                  background: isSelected ? 'var(--color-surface)' : undefined,
                  boxShadow: isSelected ? 'inset 3px 0 0 var(--color-primary)' : undefined,
                }}
              >
                <td>
                  <strong>#{order.id}</strong>
                </td>
                <td className="ds-small">{formatPlacedAt(order.created_at)}</td>
                <td>
                  <Badge tone={isPrescription ? 'primary' : 'neutral'}>
                    {isPrescription ? 'Prescription' : 'Over the counter'}
                  </Badge>
                </td>
                <td>
                  <span className="ds-cluster">
                    <Icon name={isDelivery ? 'truck' : 'package'} size={16} />
                    {isDelivery ? 'Home delivery' : 'Pickup'}
                  </span>
                </td>
                <td>
                  {order.paid_at ? (
                    <Badge tone="success">Paid</Badge>
                  ) : (
                    <Badge tone="soft">Unpaid</Badge>
                  )}
                </td>
                <td>
                  <StatusBadge status={order.status} />
                </td>
                <td>
                  <strong>{formatTotal(order.total_amount)}</strong>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default OrderDeskTable;