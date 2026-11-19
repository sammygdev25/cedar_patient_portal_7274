import { PageHeader, Button, Badge } from '../components/ui';
import { Icon } from '../components/icons';

interface MedicalRecordsHeaderProps {
  patientName?: string;
  noteCount?: number;
  prescriptionCount?: number;
  loading?: boolean;
  onRefresh?: () => void;
}

export default function MedicalRecordsHeader({
  patientName = '',
  noteCount = 0,
  prescriptionCount = 0,
  loading = false,
  onRefresh,
}: MedicalRecordsHeaderProps) {
  const firstName = patientName.trim().split(' ')[0];
  const title = firstName ? `${firstName}'s medical records` : 'Your medical records';

  const subtitle =
    'Visit notes from your Cedar Hollow Health doctors and the prescriptions they have written for you. ' +
    'Only you and the doctors you have been booked with can see these.';

  return (
    <PageHeader
      eyebrow="Patient portal"
      title={title}
      subtitle={subtitle}
      actions={
        <div className="ds-cluster">
          {!loading && (
            <>
              <Badge tone="soft">
                <Icon name="book" size={14} /> {noteCount} visit {noteCount === 1 ? 'note' : 'notes'}
              </Badge>
              <Badge tone="soft">
                <Icon name="package" size={14} /> {prescriptionCount}{' '}
                {prescriptionCount === 1 ? 'prescription' : 'prescriptions'}
              </Badge>
            </>
          )}
          {onRefresh && (
            <Button variant="ghost" onClick={onRefresh} disabled={loading}>
              <Icon name="refresh" size={16} /> Refresh
            </Button>
          )}
          <Button variant="secondary" to="/portal/documents">
            <Icon name="download" size={16} /> Documents
          </Button>
          <Button variant="primary" to="/portal/pharmacy">
            <Icon name="cart" size={16} /> Pharmacy
          </Button>
        </div>
      }
    />
  );
}