import { PageHeader, Button, Badge } from '../components/ui';
import { Icon } from '../components/icons';

interface ReceptionAppointmentsHeaderUser {
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface ReceptionAppointmentsHeaderProps {
  section?: string;
  page?: string;
  user?: ReceptionAppointmentsHeaderUser | null;
  onNewBooking?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function ReceptionAppointmentsHeader({
  user = null,
  onNewBooking,
  onRefresh,
  refreshing = false,
}: ReceptionAppointmentsHeaderProps) {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  const signedInAs = fullName || user?.email || '';

  const subtitle = signedInAs
    ? `Signed in as ${signedInAs}. Book, reschedule, cancel and check in patients for any Cedar Hollow Health doctor.`
    : 'Book, reschedule, cancel and check in patients for any Cedar Hollow Health doctor.';

  return (
    <PageHeader
      eyebrow="Cedar Hollow Health · Front desk"
      title="Appointments"
      subtitle={subtitle}
      actions={
        <div className="ds-cluster">
          <Badge tone="soft">Receptionist</Badge>
          {onRefresh && (
            <Button variant="secondary" onClick={onRefresh} disabled={refreshing}>
              <Icon name="refresh" size={16} /> {refreshing ? 'Refreshing…' : 'Refresh'}
            </Button>
          )}
          {onNewBooking && (
            <Button variant="primary" onClick={onNewBooking}>
              <Icon name="plus" size={16} /> Book for a patient
            </Button>
          )}
        </div>
      }
    />
  );
}