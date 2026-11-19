import type { Order } from '../types';
import { Alert, Badge, EmptyState, Grid, Section, SkeletonCards, Stack } from '../components/ui';
import { Icon } from '../components/icons';
import ApprovalCard from './ApprovalCard';

interface PrescriptionApprovalsContentProps {
  orders?: Order[];
  loading?: boolean;
  error?: string;
  busyId?: number | null;
  onApprove: (orderId: number) => void;
  onReject: (orderId: number) => void;
}

function statusTone(status: string): 'success' | 'danger' | 'soft' {
  if (status === 'approved' || status === 'packed' || status === 'out_for_delivery' || status === 'delivered') {
    return 'success';
  }
  if (status === 'rejected' || status === 'cancelled') return 'danger';
  return 'soft';
}

function statusLabel(status: string): string {
  const label = status.replace(/_/g, ' ');
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function PrescriptionApprovalsContent({
  orders = [],
  loading = false,
  error = '',
  busyId = null,
  onApprove,
  onReject,
}: PrescriptionApprovalsContentProps) {
  const list = Array.isArray(orders) ? orders : [];
  const awaiting = list.filter((order) => order.status === 'received');
  const decided = list.filter((order) => order.status !== 'received' && order.status !== 'pending_payment');

  return (
    <>
      <Section
        eyebrow="Awaiting your review"
        title="Prescription orders to approve"
        subtitle="Pharmacy staff cannot pack a prescription order until you, the prescribing doctor, approve it."
      >
        {error && <Alert tone="danger">{error}</Alert>}
        {loading ? (
          <SkeletonCards count={3} />
        ) : awaiting.length === 0 ? (
          <EmptyState
            icon="check"
            title="No prescription orders waiting"
            text="When one of your patients orders a medicine you prescribed, it will appear here for approval."
          />
        ) : (
          <Grid size="lg">
            {awaiting.map((order) => (
              <ApprovalCard
                key={order.id}
                order={order}
                busy={busyId === order.id}
                onApprove={() => onApprove(order.id)}
                onReject={() => onReject(order.id)}
              />
            ))}
          </Grid>
        )}
      </Section>

      {!loading && decided.length > 0 && (
        <Section eyebrow="History" title="Recently decided" subtitle="Orders you have already approved or rejected, and where they are now.">
          <Stack gap="md">
            <div className="ds-table-wrap">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Placed</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {decided.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <Icon name="package" size={16} /> #{order.id}
                      </td>
                      <td>{formatDay(order.created_at)}</td>
                      <td>
                        <Badge tone={statusTone(order.status)}>{statusLabel(order.status)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Stack>
        </Section>
      )}
    </>
  );
}

export default PrescriptionApprovalsContent;