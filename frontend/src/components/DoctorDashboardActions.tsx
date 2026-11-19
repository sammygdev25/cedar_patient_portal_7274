import { Section, Cluster, Button } from '../components/ui';
import { Icon } from '../components/icons';

interface DoctorDashboardActionsProps {
  section?: string;
  page?: string;
  pendingApprovals?: number;
  onRefresh?: () => void;
}

export default function DoctorDashboardActions({
  pendingApprovals = 0,
  onRefresh,
}: DoctorDashboardActionsProps) {
  const approvalsLabel =
    pendingApprovals > 0
      ? `Prescription approvals (${pendingApprovals})`
      : 'Prescription approvals';

  return (
    <Section
      tight
      eyebrow="Quick actions"
      title="Jump back into your clinic day"
      subtitle="Open your patient list, sign off pharmacy prescriptions or update your own details."
    >
      <Cluster gap="sm">
        <Button variant="primary" to="/staff/doctor/patients">
          <Icon name="users" size={18} />
          My patients
        </Button>
        <Button
          variant={pendingApprovals > 0 ? 'primary' : 'secondary'}
          to="/staff/doctor/approvals"
        >
          <Icon name="check" size={18} />
          {approvalsLabel}
        </Button>
        <Button variant="secondary" to="/profile">
          <Icon name="user" size={18} />
          My profile
        </Button>
        {onRefresh && (
          <Button variant="ghost" type="button" onClick={onRefresh}>
            <Icon name="refresh" size={18} />
            Refresh schedule
          </Button>
        )}
      </Cluster>
    </Section>
  );
}