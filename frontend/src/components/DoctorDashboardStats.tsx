import type { Appointment } from '../types';
import { Grid, Stat, SkeletonCards } from '../components/ui';

interface DoctorDashboardStatsProps {
  appointments?: Appointment[];
  loading?: boolean;
}

function isSameDay(iso: string, reference: Date): boolean {
  const date = new Date(iso);
  return (
    date.getFullYear() === reference.getFullYear() &&
    date.getMonth() === reference.getMonth() &&
    date.getDate() === reference.getDate()
  );
}

export default function DoctorDashboardStats({
  appointments = [],
  loading = false,
}: DoctorDashboardStatsProps) {
  if (loading) {
    return <SkeletonCards count={4} />;
  }

  const list: Appointment[] = Array.isArray(appointments) ? appointments : [];
  const now = new Date();

  const todays = list.filter(
    (a) => isSameDay(a.start_time, now) && a.status !== 'cancelled'
  );
  const waiting = list.filter((a) => a.status === 'checked_in');
  const completedToday = todays.filter((a) => a.status === 'completed');
  const upcomingPatients = new Set(
    list
      .filter(
        (a) =>
          (a.status === 'scheduled' || a.status === 'checked_in') &&
          new Date(a.end_time).getTime() >= now.getTime()
      )
      .map((a) => String(a.patient))
  );

  return (
    <Grid size="sm">
      <Stat
        value={todays.length}
        label="Visits on today's schedule"
        icon="calendar"
      />
      <Stat
        value={waiting.length}
        label="Checked in and waiting"
        icon="clock"
      />
      <Stat
        value={completedToday.length}
        label="Completed today"
        icon="check"
      />
      <Stat
        value={upcomingPatients.size}
        label="Patients still to see"
        icon="users"
      />
    </Grid>
  );
}
