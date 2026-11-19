import { useMemo } from 'react';
import type { Appointment } from '../types';
import StatusBadge from './StatusBadge';
import { Card, CardBody, CardTitle, CardMeta, Cluster, Stack, Button, EmptyState, Badge } from './ui';
import { Icon } from './icons';

interface ScheduleTimelineProps {
  appointments: Appointment[];
  lastUpdated: string;
  onOpenVisit: (appointment: Appointment) => void;
}

interface DayGroup {
  key: string;
  label: string;
  items: Appointment[];
}

function readText(source: unknown, keys: string[]): string {
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim() !== '') {
      return value;
    }
  }
  return '';
}

function formatTime(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function formatDayLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unscheduled';
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const long = date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  if (sameDay(date, today)) return `Today, ${long}`;
  if (sameDay(date, tomorrow)) return `Tomorrow, ${long}`;
  return long;
}

function dayKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unknown';
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function formatUpdated(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
}

function ScheduleTimeline({ appointments, lastUpdated, onOpenVisit }: ScheduleTimelineProps) {
  const groups = useMemo<DayGroup[]>(() => {
    const list = Array.isArray(appointments) ? appointments : [];
    const sorted = [...list].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
    const map = new Map<string, DayGroup>();
    sorted.forEach((appointment) => {
      const key = dayKey(appointment.start_time);
      if (!map.has(key)) {
        map.set(key, { key, label: formatDayLabel(appointment.start_time), items: [] });
      }
      map.get(key)?.items.push(appointment);
    });
    return Array.from(map.values());
  }, [appointments]);

  const waitingCount = (Array.isArray(appointments) ? appointments : []).filter(
    (a) => a.status === 'checked_in'
  ).length;

  if (groups.length === 0) {
    return (
      <EmptyState
        icon="calendar"
        title="Your schedule is clear"
        text="No appointments are booked with you yet. New bookings and check-ins will appear here automatically."
      />
    );
  }

  return (
    <Stack gap="md">
      <Cluster justify="between" align="center">
        <Cluster gap="sm" align="center">
          <Icon name="clock" size={18} />
          <span className="ds-small ds-muted">
            {lastUpdated ? `Live schedule, updated ${formatUpdated(lastUpdated)}` : 'Live schedule'}
          </span>
        </Cluster>
        {waitingCount > 0 && (
          <Badge tone="success">
            {waitingCount} patient{waitingCount === 1 ? '' : 's'} waiting
          </Badge>
        )}
      </Cluster>

      {groups.map((group) => (
        <Stack key={group.key} gap="sm">
          <Cluster gap="sm" align="center">
            <Icon name="calendar" size={18} />
            <h3 className="ds-card-title">{group.label}</h3>
            <Badge tone="soft">{group.items.length}</Badge>
          </Cluster>

          {group.items.map((appointment) => {
            const patientName = readText(appointment, ['patient_name', 'patient_full_name']);
            const serviceName = readText(appointment, ['service_name']);
            const canOpenVisit = appointment.status !== 'cancelled' && appointment.status !== 'no_show';
            const checkedInTime = formatTime(appointment.checked_in_at);

            return (
              <Card key={appointment.id}>
                <CardBody>
                  <Cluster justify="between" align="center">
                    <Cluster gap="md" align="center">
                      <Stack gap="xs">
                        <strong className="ds-price">{formatTime(appointment.start_time)}</strong>
                        <span className="ds-small ds-muted">until {formatTime(appointment.end_time)}</span>
                      </Stack>
                      <Stack gap="xs">
                        <CardTitle>{patientName || `Patient #${String(appointment.patient)}`}</CardTitle>
                        <CardMeta>
                          {serviceName || 'Consultation'}
                          {appointment.reason ? ` · ${appointment.reason}` : ''}
                        </CardMeta>
                        {checkedInTime && appointment.status === 'checked_in' && (
                          <span className="ds-small ds-muted">Checked in at {checkedInTime}</span>
                        )}
                      </Stack>
                    </Cluster>
                    <Cluster gap="sm" align="center">
                      <StatusBadge status={appointment.status} />
                      {canOpenVisit && (
                        <Button variant="secondary" onClick={() => onOpenVisit(appointment)}>
                          <Icon name="edit" size={16} /> Open visit
                        </Button>
                      )}
                    </Cluster>
                  </Cluster>
                </CardBody>
              </Card>
            );
          })}
        </Stack>
      ))}
    </Stack>
  );
}

export default ScheduleTimeline;