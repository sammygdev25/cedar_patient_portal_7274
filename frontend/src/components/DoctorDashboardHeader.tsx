import type { ReactNode } from 'react';
import { Button, PageHeader, Badge, Cluster } from '../components/ui';
import { Icon } from '../components/icons';

interface DoctorDashboardHeaderProps {
  section?: string;
  page?: string;
  doctorName?: string;
  todayCount?: number;
  waitingCount?: number;
  lastUpdated?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  patientsPath?: string;
}

function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

export default function DoctorDashboardHeader({
  doctorName = '',
  todayCount = 0,
  waitingCount = 0,
  lastUpdated = '',
  refreshing = false,
  onRefresh,
  patientsPath = '/staff/doctor/patients',
}: DoctorDashboardHeaderProps) {
  const greeting = greetingForHour(new Date().getHours());
  const name = doctorName.trim();
  const title = name ? `${greeting}, ${name}` : greeting;

  const subtitle =
    todayCount === 0
      ? 'Your schedule at Cedar Hollow Health is clear for now. New bookings and check-ins will appear here on their own.'
      : `You have ${todayCount} ${pluralize(todayCount, 'appointment', 'appointments')} on your schedule today. Check-ins from the front desk appear here without a reload.`;

  const actions: ReactNode = (
    <Cluster gap="sm" align="center">
      {waitingCount > 0 && (
        <Badge tone="primary">
          <Icon name="bell" size={14} />
          {waitingCount} {pluralize(waitingCount, 'patient', 'patients')} checked in
        </Badge>
      )}
      {onRefresh && (
        <Button variant="ghost" onClick={onRefresh} disabled={refreshing}>
          <Icon name="refresh" size={16} />
          {refreshing ? 'Refreshing' : 'Refresh'}
        </Button>
      )}
      <Button variant="primary" to={patientsPath}>
        <Icon name="users" size={16} />
        My patients
      </Button>
    </Cluster>
  );

  return (
    <>
      <PageHeader
        eyebrow="Doctor dashboard"
        title={title}
        subtitle={subtitle}
        actions={actions}
      />
      {lastUpdated && (
        <p className="ds-small ds-muted">
          <Icon name="clock" size={14} /> Schedule updated {lastUpdated}
        </p>
      )}
    </>
  );
}