import { Grid, Stat } from '../components/ui';

interface ReceptionDashboardStatsProps {
  todayCount: number;
  checkedInCount: number;
  waitingCount: number;
  unpaidBillsCount: number;
  loading?: boolean;
}

export default function ReceptionDashboardStats({
  todayCount,
  checkedInCount,
  waitingCount,
  unpaidBillsCount,
  loading = false,
}: ReceptionDashboardStatsProps) {
  const show = (n: number) => (loading ? '–' : n);

  return (
    <Grid size="sm">
      <Stat
        value={show(todayCount)}
        label="Appointments today"
        icon="calendar"
      />
      <Stat
        value={show(checkedInCount)}
        label="Checked in at the desk"
        icon="check"
      />
      <Stat
        value={show(waitingCount)}
        label="Still to arrive"
        icon="clock"
      />
      <Stat
        value={show(unpaidBillsCount)}
        label="Unpaid patient bills"
        icon="credit-card"
      />
    </Grid>
  );
}
