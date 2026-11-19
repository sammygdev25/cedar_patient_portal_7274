import { PageHeader, Button } from '../components/ui';
import { Icon } from '../components/icons';

interface ReceptionDashboardHeaderProps {
  section?: string;
  page?: string;
  userName?: string;
  checkedInCount?: number;
  todayCount?: number;
  onBookAppointment?: () => void;
  onCreateInvoice?: () => void;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatToday(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function buildSubtitle(todayCount?: number, checkedInCount?: number): string {
  if (typeof todayCount === 'number' && typeof checkedInCount === 'number') {
    const visits = todayCount === 1 ? '1 visit' : `${todayCount} visits`;
    return `${formatToday()}: ${visits} on the Cedar Hollow Health schedule, ${checkedInCount} patients waiting in the lobby.`;
  }
  return `${formatToday()}: check patients in, book visits with any doctor and keep bills and pharmacy orders moving.`;
}

function ReceptionDashboardHeader({
  userName,
  checkedInCount,
  todayCount,
  onBookAppointment,
  onCreateInvoice,
}: ReceptionDashboardHeaderProps) {
  const name = userName && userName.trim() ? userName.trim() : 'front desk';
  const title = `${getGreeting()}, ${name}`;

  const actions = (
    <>
      {onCreateInvoice ? (
        <Button variant="secondary" onClick={onCreateInvoice}>
          <Icon name="dollar" size={18} />
          New invoice
        </Button>
      ) : (
        <Button variant="secondary" to="/staff/reception/billing">
          <Icon name="dollar" size={18} />
          Billing
        </Button>
      )}
      {onBookAppointment ? (
        <Button variant="primary" onClick={onBookAppointment}>
          <Icon name="plus" size={18} />
          Book for a patient
        </Button>
      ) : (
        <Button variant="primary" to="/staff/reception/appointments">
          <Icon name="plus" size={18} />
          Book for a patient
        </Button>
      )}
    </>
  );

  return (
    <PageHeader
      eyebrow="Reception desk"
      title={title}
      subtitle={buildSubtitle(todayCount, checkedInCount)}
      actions={actions}
    />
  );
}

export default ReceptionDashboardHeader;