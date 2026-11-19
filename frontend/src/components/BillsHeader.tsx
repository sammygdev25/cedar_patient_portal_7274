import { PageHeader, Button, Badge } from '../components/ui';
import { Icon } from '../components/icons';

interface BillsHeaderProps {
  pendingCount?: number;
  totalDue?: number;
  onRefresh?: () => void;
  refreshing?: boolean;
}

function formatDue(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function BillsHeader({
  pendingCount = 0,
  totalDue = 0,
  onRefresh,
  refreshing = false,
}: BillsHeaderProps) {
  const hasPending = pendingCount > 0;

  const subtitle = hasPending
    ? `You have ${pendingCount} open ${pendingCount === 1 ? 'bill' : 'bills'} from Cedar Hollow Health totalling ${formatDue(totalDue)}. Pay securely by card; your bill is marked paid as soon as the payment is confirmed.`
    : 'Every visit and service billed by Cedar Hollow Health appears here. Pay securely by card and your bill is marked paid as soon as the payment is confirmed.';

  return (
    <PageHeader
      eyebrow="Patient portal"
      title="Your bills"
      subtitle={subtitle}
      actions={
        <div className="ds-cluster">
          {hasPending && (
            <Badge tone="danger">
              <Icon name="credit-card" size={14} /> {pendingCount} to pay
            </Badge>
          )}
          {onRefresh && (
            <Button variant="ghost" onClick={onRefresh} disabled={refreshing}>
              <Icon name="refresh" size={16} /> {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
          <Button variant="secondary" to="/portal/appointments">
            <Icon name="calendar" size={16} /> My appointments
          </Button>
        </div>
      }
    />
  );
}