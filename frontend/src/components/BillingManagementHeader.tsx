import type { ReactNode } from 'react';
import { PageHeader, Button, Badge, Cluster } from '../components/ui';
import { Icon } from '../components/icons';

interface BillingManagementHeaderProps {
  section?: string;
  page?: string;
  pendingCount?: number;
  outstandingTotal?: number;
  onNewInvoice?: () => void;
  onRefresh?: () => void;
  extraActions?: ReactNode;
}

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

function BillingManagementHeader({
  pendingCount = 0,
  outstandingTotal = 0,
  onNewInvoice,
  onRefresh,
  extraActions,
}: BillingManagementHeaderProps) {
  const actions = (
    <Cluster gap="sm" align="center">
      {pendingCount > 0 && (
        <Badge tone="soft">
          {pendingCount} pending &middot; {currency.format(outstandingTotal)}
        </Badge>
      )}
      {onRefresh && (
        <Button variant="ghost" onClick={onRefresh}>
          <Icon name="refresh" size={16} /> Refresh
        </Button>
      )}
      {onNewInvoice && (
        <Button variant="primary" onClick={onNewInvoice}>
          <Icon name="plus" size={16} /> New bill
        </Button>
      )}
      {extraActions}
    </Cluster>
  );

  return (
    <PageHeader
      eyebrow="Reception desk"
      title="Billing management"
      subtitle="Create bills for any Cedar Hollow Health patient, link them to a visit, and void them when needed. A bill is marked paid only once the card payment is confirmed."
      actions={actions}
    />
  );
}

export default BillingManagementHeader;