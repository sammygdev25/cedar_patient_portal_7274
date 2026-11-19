import { useAuth } from '../contexts/AuthContext';
import { Section, Button, Badge, Stack, Cluster } from '../components/ui';
import { Icon } from '../components/icons';

interface ReceptionAppointmentsDetailsProps {
  section?: string;
  page?: string;
}

const ROLE_LABELS: Record<string, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  receptionist: 'Receptionist',
};

function ReceptionAppointmentsDetails({ section = 'Account details' }: ReceptionAppointmentsDetailsProps) {
  const { user } = useAuth();
  const account = (user ?? {}) as Record<string, unknown>;

  const text = (key: string): string => {
    const value = account[key];
    return typeof value === 'string' ? value : '';
  };

  const firstName = text('first_name');
  const lastName = text('last_name');
  const fullName = `${firstName} ${lastName}`.trim();
  const email = text('email');
  const phone = text('phone');
  const role = text('role');
  const emailVerified = account['email_verified'] === true;

  return (
    <Section
      narrow
      eyebrow={section}
      title="Your front desk account"
      subtitle="You are signed in to the Cedar Hollow Health reception desk. Appointments you book, reschedule or check in are recorded under this account."
      actions={
        <Button variant="secondary" to="/profile">
          <Icon name="edit" size={16} /> Edit profile
        </Button>
      }
    >
      <form className="ds-form" onSubmit={(e: React.FormEvent<HTMLFormElement>) => e.preventDefault()}>
        <div className="ds-form-row">
          <div className="ds-field">
            <label className="ds-label" htmlFor="reception-first-name">First name</label>
            <input
              id="reception-first-name"
              className="input"
              type="text"
              value={firstName}
              placeholder="Not provided"
              readOnly
            />
          </div>
          <div className="ds-field">
            <label className="ds-label" htmlFor="reception-last-name">Last name</label>
            <input
              id="reception-last-name"
              className="input"
              type="text"
              value={lastName}
              placeholder="Not provided"
              readOnly
            />
          </div>
        </div>

        <div className="ds-form-row">
          <div className="ds-field">
            <label className="ds-label" htmlFor="reception-email">Email</label>
            <input
              id="reception-email"
              className="input"
              type="email"
              value={email}
              placeholder="Not provided"
              readOnly
            />
            <Cluster gap="xs">
              <Badge tone={emailVerified ? 'success' : 'danger'}>
                {emailVerified ? 'Email verified' : 'Email not verified'}
              </Badge>
            </Cluster>
          </div>
          <div className="ds-field">
            <label className="ds-label" htmlFor="reception-phone">Desk phone</label>
            <input
              id="reception-phone"
              className="input"
              type="tel"
              value={phone}
              placeholder="Not provided"
              readOnly
            />
          </div>
        </div>

        <Stack gap="sm">
          <Cluster gap="sm">
            <Icon name="shield" size={18} />
            <span className="ds-label">
              Role: {ROLE_LABELS[role] ?? (role || 'Staff')}
            </span>
          </Cluster>
          <p className="ds-help">
            {fullName ? `${fullName}, as` : 'As'} a receptionist you can book for any patient with any doctor,
            check patients in on arrival, and cancel or reschedule any appointment. Double bookings are blocked
            automatically for each doctor's time slot.
          </p>
        </Stack>
      </form>
    </Section>
  );
}

export default ReceptionAppointmentsDetails;