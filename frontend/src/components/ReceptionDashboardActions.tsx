import { Section, Cluster, Button } from '../components/ui';
import { Icon } from '../components/icons';

interface ReceptionDashboardActionsProps {
  section?: string;
  page?: string;
  waitingCheckIns?: number;
  unpaidBills?: number;
}

function ReceptionDashboardActions({
  waitingCheckIns = 0,
  unpaidBills = 0,
}: ReceptionDashboardActionsProps) {
  const subtitle =
    waitingCheckIns > 0 || unpaidBills > 0
      ? `${waitingCheckIns} patient${waitingCheckIns === 1 ? '' : 's'} waiting to check in and ${unpaidBills} unpaid bill${unpaidBills === 1 ? '' : 's'} at Cedar Hollow Health.`
      : 'Book visits, settle bills and run the pharmacy desk for Cedar Hollow Health.';

  return (
    <Section tight eyebrow="Front desk" title="Quick actions" subtitle={subtitle}>
      <Cluster gap="sm">
        <Button variant="primary" size="lg" to="/staff/reception/appointments">
          <Icon name="calendar" size={18} />
          Book or check in patients
        </Button>
        <Button variant="secondary" size="lg" to="/staff/reception/billing">
          <Icon name="credit-card" size={18} />
          Manage billing
        </Button>
        <Button variant="secondary" size="lg" to="/staff/reception/pharmacy">
          <Icon name="truck" size={18} />
          Pharmacy desk
        </Button>
        <Button variant="secondary" size="lg" to="/staff/reception/stock">
          <Icon name="package" size={18} />
          Pharmacy stock
        </Button>
        <Button variant="ghost" size="lg" to="/staff/reception/reports">
          <Icon name="list" size={18} />
          Daily reports
        </Button>
      </Cluster>
    </Section>
  );
}

export default ReceptionDashboardActions;