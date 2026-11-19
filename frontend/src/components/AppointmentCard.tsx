import type { Appointment } from '../types';
import { Card, CardBody, CardTitle, CardMeta, CardFooter, Button, Cluster } from '../components/ui';
import { Icon } from '../components/icons';
import StatusBadge from './StatusBadge';

interface AppointmentCardProps {
  appointment: Appointment;
  viewerRole: string;
  onCancel?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
  onCheckIn?: (appointment: Appointment) => void;
  onOpenVisit?: (appointment: Appointment) => void;
}

function pickText(source: unknown, keys: string[]): string {
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return '';
}

function formatDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function AppointmentCard({
  appointment,
  viewerRole,
  onCancel,
  onReschedule,
  onCheckIn,
  onOpenVisit,
}: AppointmentCardProps) {
  const patientName = pickText(appointment, ['patient_name', 'patient_full_name', 'patient_email']);
  const doctorName = pickText(appointment, ['doctor_name', 'doctor_full_name', 'doctor_email']);
  const serviceName = pickText(appointment, ['service_name']);

  const isPatient = viewerRole === 'patient';
  const isDoctor = viewerRole === 'doctor';
  const isReceptionist = viewerRole === 'receptionist';

  const isScheduled = appointment.status === 'scheduled';
  const isCheckedIn = appointment.status === 'checked_in';
  const isCompleted = appointment.status === 'completed';

  const canCancel = (isPatient || isReceptionist) && isScheduled && Boolean(onCancel);
  const canReschedule = (isPatient || isReceptionist) && isScheduled && Boolean(onReschedule);
  const canCheckIn = isReceptionist && isScheduled && Boolean(onCheckIn);
  const canOpenVisit = isDoctor && (isScheduled || isCheckedIn || isCompleted) && Boolean(onOpenVisit);
  const hasActions = canCancel || canReschedule || canCheckIn || canOpenVisit;

  const title = serviceName || 'Clinic visit';

  return (
    <Card>
      <CardBody>
        <Cluster justify="between" align="center">
          <CardTitle>{title}</CardTitle>
          <StatusBadge status={appointment.status} />
        </Cluster>

        <CardMeta>
          <Cluster gap="sm" align="center">
            <Icon name="calendar" size={16} />
            <span>{formatDay(appointment.start_time)}</span>
          </Cluster>
        </CardMeta>
        <CardMeta>
          <Cluster gap="sm" align="center">
            <Icon name="clock" size={16} />
            <span>
              {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
            </span>
          </Cluster>
        </CardMeta>

        {!isDoctor && doctorName && (
          <CardMeta>
            <Cluster gap="sm" align="center">
              <Icon name="user" size={16} />
              <span>With {doctorName}</span>
            </Cluster>
          </CardMeta>
        )}

        {!isPatient && patientName && (
          <CardMeta>
            <Cluster gap="sm" align="center">
              <Icon name="users" size={16} />
              <span>Patient: {patientName}</span>
            </Cluster>
          </CardMeta>
        )}

        {appointment.reason && (
          <p className="ds-small ds-muted">Reason: {appointment.reason}</p>
        )}

        {isCheckedIn && appointment.checked_in_at && (
          <p className="ds-small ds-muted">
            Checked in at {formatTime(appointment.checked_in_at)}
          </p>
        )}
      </CardBody>

      {hasActions && (
        <CardFooter>
          <Cluster gap="sm">
            {canCheckIn && (
              <Button variant="primary" onClick={() => onCheckIn?.(appointment)}>
                <Icon name="check" size={16} /> Check in
              </Button>
            )}
            {canOpenVisit && (
              <Button variant="primary" onClick={() => onOpenVisit?.(appointment)}>
                <Icon name="eye" size={16} /> {isCompleted ? 'View visit note' : 'Open visit'}
              </Button>
            )}
            {canReschedule && (
              <Button variant="secondary" onClick={() => onReschedule?.(appointment)}>
                <Icon name="edit" size={16} /> Reschedule
              </Button>
            )}
            {canCancel && (
              <Button variant="danger" onClick={() => onCancel?.(appointment)}>
                <Icon name="close" size={16} /> Cancel
              </Button>
            )}
          </Cluster>
        </CardFooter>
      )}
    </Card>
  );
}

export default AppointmentCard;