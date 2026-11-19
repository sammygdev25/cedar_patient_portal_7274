import { PageHeader, Button } from '../components/ui';
import { Icon } from '../components/icons';

interface DoctorPatientsHeaderProps {
  patientCount?: number;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function DoctorPatientsHeader({
  patientCount = 0,
  onRefresh,
  refreshing = false,
}: DoctorPatientsHeaderProps) {
  const subtitle =
    patientCount > 0
      ? `${patientCount} ${patientCount === 1 ? 'patient' : 'patients'} booked with you at Cedar Hollow Health. Open a chart to review visit notes, prescriptions and documents.`
      : 'Patients booked with you at Cedar Hollow Health will appear here. Open a chart to review visit notes, prescriptions and documents.';

  return (
    <PageHeader
      eyebrow="Doctor workspace"
      title="My patients"
      subtitle={subtitle}
      actions={
        <>
          <Button variant="secondary" to="/staff/doctor">
            <Icon name="arrow-left" size={16} />
            Back to schedule
          </Button>
          {onRefresh && (
            <Button variant="ghost" onClick={onRefresh} disabled={refreshing}>
              <Icon name="refresh" size={16} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          )}
        </>
      }
    />
  );
}