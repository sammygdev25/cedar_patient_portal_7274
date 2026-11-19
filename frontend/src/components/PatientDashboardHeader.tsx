import { Badge, Button, Cluster, PageHeader } from '../components/ui';
import { Icon } from '../components/icons';

interface PatientDashboardHeaderProps {
  section?: string;
  page?: string;
  firstName?: string;
  lastName?: string;
  emailVerified?: boolean;
  upcomingCount?: number;
  onBookAppointment?: () => void;
}

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function buildSubtitle(upcomingCount: number | undefined): string {
  if (upcomingCount === undefined) {
    return 'Your appointments, records, bills and pharmacy orders at Cedar Hollow Health, all in one place.';
  }
  if (upcomingCount === 0) {
    return 'You have no upcoming visits. Book a time with one of our doctors whenever you are ready.';
  }
  if (upcomingCount === 1) {
    return 'You have 1 upcoming visit. Check in at reception when you arrive.';
  }
  return `You have ${upcomingCount} upcoming visits. Check in at reception when you arrive.`;
}

export default function PatientDashboardHeader({
  firstName = '',
  lastName = '',
  emailVerified,
  upcomingCount,
  onBookAppointment,
}: PatientDashboardHeaderProps) {
  const displayName = firstName.trim() || lastName.trim() || 'there';
  const greeting = greetingForHour(new Date().getHours());

  const primaryAction = onBookAppointment ? (
    <Button variant="primary" onClick={onBookAppointment}>
      <Icon name="calendar" size={18} />
      Book an appointment
    </Button>
  ) : (
    <Button variant="primary" to="/portal/book">
      <Icon name="calendar" size={18} />
      Book an appointment
    </Button>
  );

  const actions = (
    <Cluster gap="sm" align="center">
      {emailVerified !== undefined && (
        <Badge tone={emailVerified ? 'success' : 'danger'}>
          {emailVerified ? 'Email verified' : 'Email not verified'}
        </Badge>
      )}
      <Button variant="secondary" to="/portal/appointments">
        <Icon name="clock" size={18} />
        My appointments
      </Button>
      {primaryAction}
    </Cluster>
  );

  return (
    <PageHeader
      eyebrow="Patient portal"
      title={`${greeting}, ${displayName}`}
      subtitle={buildSubtitle(upcomingCount)}
      actions={actions}
    />
  );
}