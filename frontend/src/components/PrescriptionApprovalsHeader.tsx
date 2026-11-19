import { Badge, Button, PageHeader } from '../components/ui';
import { Icon } from '../components/icons';

interface PrescriptionApprovalsHeaderProps {
  section?: string;
  page?: string;
  pendingCount?: number;
  loading?: boolean;
  onRefresh?: () => void;
}

export default function PrescriptionApprovalsHeader({
  pendingCount,
  loading = false,
  onRefresh,
}: PrescriptionApprovalsHeaderProps) {
  const hasCount = typeof pendingCount === 'number';

  const actions = (
    <div className="ds-cluster">
      {hasCount && (
        <Badge tone={pendingCount > 0 ? 'primary' : 'success'}>
          {pendingCount > 0
            ? `${pendingCount} awaiting your review`
            : 'All caught up'}
        </Badge>
      )}
      {onRefresh && (
        <Button variant="secondary" onClick={onRefresh} disabled={loading}>
          <Icon name="refresh" size={16} />
          {loading ? 'Refreshing' : 'Refresh'}
        </Button>
      )}
      <Button variant="ghost" to="/staff/doctor">
        <Icon name="arrow-left" size={16} />
        Dashboard
      </Button>
    </div>
  );

  return (
    <PageHeader
      eyebrow="Cedar Hollow Pharmacy"
      title="Prescription approvals"
      subtitle="Review pharmacy orders placed against prescriptions you wrote. Once you approve an order, the pharmacy team can pack it; reception only ever sees the medicine name, never your clinical notes."
      actions={actions}
    />
  );
}