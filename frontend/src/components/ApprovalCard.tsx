import type { Order, OrderItem } from '../types';
import { Badge, Button, Card, CardBody, CardFooter, CardMeta, CardTitle, Cluster, Price, Stack } from './ui';
import { Icon } from './icons';
import StatusBadge from './StatusBadge';

interface ApprovalCardProps {
  order: Order;
  onApprove: (orderId: number) => void;
  onReject: (orderId: number) => void;
  busy: boolean;
}

function readText(source: object, key: string): string {
  const value = (source as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : '';
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function ApprovalCard({ order, onApprove, onReject, busy }: ApprovalCardProps) {
  const items: OrderItem[] = (order as unknown as { items?: OrderItem[] }).items ?? [];
  const patientName =
    readText(order, 'user_name') || readText(order, 'patient_name') || `Patient #${order.user}`;
  const placed = formatDateTime(order.created_at);
  const awaitingDecision = order.status === 'received';
  const isDelivery = order.fulfillment_method === 'delivery';

  return (
    <Card>
      <CardBody>
        <Stack gap="sm">
          <Cluster justify="between" align="center">
            <CardTitle>Prescription order #{order.id}</CardTitle>
            <StatusBadge status={order.status} />
          </Cluster>

          <CardMeta>
            <Cluster gap="sm" align="center">
              <Icon name="user" size={16} />
              <span>{patientName}</span>
            </Cluster>
          </CardMeta>

          {placed && (
            <CardMeta>
              <Cluster gap="sm" align="center">
                <Icon name="calendar" size={16} />
                <span>Placed {placed}</span>
              </Cluster>
            </CardMeta>
          )}

          <Stack gap="xs">
            <span className="ds-label">Medicines to approve</span>
            {items.length === 0 ? (
              <span className="ds-muted">No medicine lines on this order.</span>
            ) : (
              (Array.isArray(items) ? items : []).map((item) => (
                <Cluster key={item.id} justify="between" align="center">
                  <Cluster gap="sm" align="center">
                    <Icon name="package" size={16} />
                    <span>{item.medicine_name}</span>
                  </Cluster>
                  <Badge tone="soft">Qty {item.quantity}</Badge>
                </Cluster>
              ))
            )}
          </Stack>

          <Cluster gap="sm" align="center">
            <Badge tone="neutral">
              {isDelivery ? 'Home delivery' : 'Pickup at clinic'}
            </Badge>
            {order.prescription ? (
              <Badge tone="primary">Prescription #{order.prescription}</Badge>
            ) : null}
          </Cluster>

          {order.notes ? (
            <p className="ds-small ds-muted">Patient note: {order.notes}</p>
          ) : null}
        </Stack>
      </CardBody>

      <CardFooter>
        <Cluster justify="between" align="center">
          <Price value={Number(order.total_amount)} />
          {awaitingDecision ? (
            <Cluster gap="sm" align="center">
              <Button
                variant="danger"
                disabled={busy}
                onClick={() => onReject(order.id)}
              >
                <Icon name="close" size={16} /> Reject
              </Button>
              <Button
                variant="primary"
                disabled={busy}
                onClick={() => onApprove(order.id)}
              >
                <Icon name="check" size={16} /> {busy ? 'Saving...' : 'Approve'}
              </Button>
            </Cluster>
          ) : (
            <span className="ds-small ds-muted">
              {order.status === 'pending_payment'
                ? 'Waiting for the patient to pay'
                : 'Decision recorded'}
            </span>
          )}
        </Cluster>
      </CardFooter>
    </Card>
  );
}

export default ApprovalCard;