import { PageHeader, Button, Badge } from '../components/ui';
import { Icon } from '../components/icons';

interface HeaderUser {
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}

interface MyAppointmentsHeaderProps {
  section?: string;
  page?: string;
  user?: HeaderUser | null;
  upcomingCount?: number;
}

function displayName(user?: HeaderUser | null): string {
  if (!user) return '';
  const full = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return full || user.email || '';
}

export default function MyAppointmentsHeader({ user, upcomingCount }: MyAppointmentsHeaderProps) {
  const name = displayName(user);
  const hasCount = typeof upcomingCount === 'number';

  const subtitle = name
    ? `Signed in as ${name}. Review your visits with Cedar Hollow Health, reschedule when plans change, or cancel before your slot.`
    : 'Review your visits with Cedar Hollow Health, reschedule when plans change, or cancel before your slot.';

  return (
    <PageHeader
      eyebrow="Patient portal"
      title="My appointments"
      subtitle={subtitle}
      actions={
        <div className="ds-cluster">
          {hasCount && (
            <Badge tone="soft">
              <Icon name="calendar" size={14} />
              {` ${upcomingCount} upcoming`}
            </Badge>
          )}
          <Button variant="primary" to="/portal/book">
            <Icon name="plus" size={16} />
            Book a visit
          </Button>
        </div>
      }
    />
  );
}