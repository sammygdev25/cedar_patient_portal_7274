import type { Appointment } from '../types';
import { Alert, Badge, Button, EmptyState, LoadingBlock, Section } from '../components/ui';
import { Icon } from '../components/icons';

interface MyAppointmentsContentProps {
  appointments?: Appointment[];
  loading?: boolean;
  error?: string;
  onCancel?: (appointment: Appointment) => void;
  onReschedule?: (appointment: Appointment) => void;
}

type BadgeTone = 'neutral' | 'primary' | 'soft' | 'success' | 'danger';

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  checked_in: 'Checked in',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
};

const STATUS_TONES: Record<string, BadgeTone> = {
  scheduled: 'primary',
  checked_in: 'soft',
  completed: 'success',
  cancelled: 'danger',
  no_show: 'neutral',
};

function extra(appointment: Appointment, key: string, fallback: string): string {
  const value = (appointment as unknown as Record<string, unknown>)[key];
  return typeof value === 'string' && value ? value : fallback;
}

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function MyAppointmentsContent({
  appointments = [],
  loading = false,
  error = '',
  onCancel,
  onReschedule,
}: MyAppointmentsContentProps) {
  const list = Array.isArray(appointments) ? appointments : [];
  const now = Date.now();
  const sorted = [...list].sort((a, b) => {
    const aUpcoming = new Date(a.start_time).getTime() >= now;
    const bUpcoming = new Date(b.start_time).getTime() >= now;
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1;
    const diff = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    return aUpcoming ? diff : -diff;
  });

  return (
    <Section
      title="Your visits at Cedar Hollow"
      subtitle="Upcoming appointments come first. You can reschedule or cancel a scheduled visit at any time before check-in."
      actions={
        <Button to="/portal/book" variant="primary">
          <Icon name="plus" size={16} /> Book a visit
        </Button>
      }
    >
      {error && <Alert tone="danger">{error}</Alert>}
      {loading ? (
        <LoadingBlock label="Loading your appointments" />
      ) : sorted.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No appointments yet"
          text="When you book a visit with one of our doctors it will show up here, along with its status."
          action={
            <Button to="/portal/book" variant="primary">
              Book your first appointment
            </Button>
          }
        />
      ) : (
        <div className="ds-table-wrap">
          <table className="ds-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Doctor</th>
                <th>Service</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((appointment) => {
                const canChange = appointment.status === 'scheduled';
                return (
                  <tr key={appointment.id}>
                    <td>
                      <span className="ds-cluster">
                        <Icon name="clock" size={16} />
                        {formatWhen(appointment.start_time)}
                      </span>
                    </td>
                    <td>{extra(appointment, 'doctor_name', 'Your doctor')}</td>
                    <td>{extra(appointment, 'service_name', 'General visit')}</td>
                    <td className="ds-muted">{appointment.reason || 'No reason given'}</td>
                    <td>
                      <Badge tone={STATUS_TONES[appointment.status] || 'neutral'}>
                        {STATUS_LABELS[appointment.status] || appointment.status}
                      </Badge>
                    </td>
                    <td>
                      {canChange ? (
                        <span className="ds-cluster">
                          <Button variant="secondary" onClick={() => onReschedule?.(appointment)}>
                            <Icon name="edit" size={16} /> Reschedule
                          </Button>
                          <Button variant="danger" onClick={() => onCancel?.(appointment)}>
                            <Icon name="close" size={16} /> Cancel
                          </Button>
                        </span>
                      ) : (
                        <span className="ds-small ds-muted">No actions</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

export default MyAppointmentsContent;