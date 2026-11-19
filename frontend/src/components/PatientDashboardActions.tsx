import { Section, Stack, Cluster, Button, Badge } from '../components/ui';
import { Icon } from '../components/icons';

interface PatientDashboardActionsProps {
  section?: string;
  page?: string;
  emailVerified?: boolean;
  pendingBillCount?: number;
}

export default function PatientDashboardActions({
  emailVerified = true,
  pendingBillCount = 0,
}: PatientDashboardActionsProps) {
  return (
    <Section
      tight
      eyebrow="Quick actions"
      title="What would you like to do?"
      subtitle="Book a visit with Cedar Hollow Health, review your care, or refill a prescription."
    >
      <Stack gap="md">
        <Cluster gap="sm">
          <Button variant="primary" size="lg" to="/portal/book">
            <Icon name="calendar" size={18} /> Book an appointment
          </Button>
          <Button variant="secondary" size="lg" to="/portal/appointments">
            <Icon name="list" size={18} /> My appointments
          </Button>
          <Button variant="secondary" size="lg" to="/portal/records">
            <Icon name="book" size={18} /> Medical records
          </Button>
          <Button variant="secondary" size="lg" to="/portal/bills">
            <Icon name="credit-card" size={18} /> Pay a bill
          </Button>
          <Button variant="ghost" size="lg" to="/portal/pharmacy">
            <Icon name="package" size={18} /> Pharmacy
          </Button>
        </Cluster>
        {!emailVerified && (
          <Cluster gap="sm" align="center">
            <Badge tone="danger">Email not verified</Badge>
            <span className="ds-small ds-muted">
              Verify your email address to book appointments online.
            </span>
          </Cluster>
        )}
        {pendingBillCount > 0 && (
          <Cluster gap="sm" align="center">
            <Badge tone="primary">
              {pendingBillCount} pending {pendingBillCount === 1 ? 'bill' : 'bills'}
            </Badge>
            <span className="ds-small ds-muted">
              Settle outstanding balances securely online.
            </span>
          </Cluster>
        )}
      </Stack>
    </Section>
  );
}