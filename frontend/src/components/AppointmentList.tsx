import type { ComponentProps } from 'react';
import type { Appointment } from '../types';
import AppointmentCard from './AppointmentCard';
import { EmptyState, Stack } from './ui';

type CardProps = ComponentProps<typeof AppointmentCard>;

type AppointmentListProps = Omit<CardProps, 'appointment'> & {
  appointments: Appointment[];
};

interface DayGroup {
  key: string;
  label: string;
  items: Appointment[];
}

function dayKey(value: string): string {
  const d = new Date(value);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(value: string): string {
  const d = new Date(value);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (dayKey(value) === dayKey(today.toISOString())) return 'Today';
  if (dayKey(value) === dayKey(tomorrow.toISOString())) return 'Tomorrow';
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function groupByDay(appointments: Appointment[]): DayGroup[] {
  const sorted = [...appointments].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );
  const groups: DayGroup[] = [];
  sorted.forEach((appointment) => {
    const key = dayKey(appointment.start_time);
    const existing = groups.find((g) => g.key === key);
    if (existing) {
      existing.items.push(appointment);
    } else {
      groups.push({ key, label: dayLabel(appointment.start_time), items: [appointment] });
    }
  });
  return groups;
}

function emptyText(viewerRole: unknown): { title: string; text: string } {
  if (viewerRole === 'doctor') {
    return {
      title: 'No appointments on your schedule',
      text: 'Patients booked with you will appear here as soon as they are scheduled.',
    };
  }
  if (viewerRole === 'receptionist') {
    return {
      title: 'No appointments to show',
      text: 'Book a visit for a patient and it will be listed here.',
    };
  }
  return {
    title: 'No appointments yet',
    text: 'Book a visit with one of the Cedar Hollow Health doctors to get started.',
  };
}

function AppointmentList({
  appointments,
  viewerRole,
  onCancel,
  onReschedule,
  onCheckIn,
  onOpenVisit,
}: AppointmentListProps) {
  const list: Appointment[] = Array.isArray(appointments) ? appointments : [];

  if (list.length === 0) {
    const { title, text } = emptyText(viewerRole);
    return <EmptyState icon="calendar" title={title} text={text} />;
  }

  const groups = groupByDay(list);

  return (
    <Stack gap="lg">
      {groups.map((group) => (
        <section key={group.key} aria-label={group.label}>
          <Stack gap="sm">
            <h3 className="ds-eyebrow">{group.label}</h3>
            <Stack gap="md">
              {group.items.map((appointment) => (
                <AppointmentCard
                  key={appointment.id}
                  appointment={appointment}
                  viewerRole={viewerRole}
                  onCancel={onCancel}
                  onReschedule={onReschedule}
                  onCheckIn={onCheckIn}
                  onOpenVisit={onOpenVisit}
                />
              ))}
            </Stack>
          </Stack>
        </section>
      ))}
    </Stack>
  );
}

export default AppointmentList;