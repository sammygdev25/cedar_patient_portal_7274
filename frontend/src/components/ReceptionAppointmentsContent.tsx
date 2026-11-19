import type { Appointment } from '../types';
import { Section, Badge, Button, EmptyState, LoadingBlock, Alert } from '../components/ui';
import { Icon } from '../components/icons';

interface ReceptionAppointmentsContentProps {
  appointments?: Appointment[];
  loading?: boolean;
  error?: string;
  patientLabel?: (appointment: Appointment) => string;
  doctorLabel?: (appointment: Appointment) => string;
  onCheckIn?: (appointment: Appointment) => void;
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
  checked_in: 'success',
  completed: 'soft',
  cancelled: 'danger',
  no_show: 'neutral',
};

function formatSlot(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ReceptionAppointmentsContent({
  appointments = [],
  loading = false,
  error = '',
  patientLabel,
  doctorLabel,
  onCheckIn,
  onCancel,
  onReschedule,
}: ReceptionAppointmentsContentProps) {
  const rows = Array.isArray(appointments) ? appointments : [];

  const patientText = (a: Appointment): string =>
    patientLabel ? patientLabel(a) : `Patient #${a.patient}`;
  const doctorText = (a: Appointment): string =>
    doctorLabel ? doctorLabel(a) : `Doctor #${a.doctor}`;

  return (
    <Section
      eyebrow="Front desk"
      title="Clinic schedule"
      subtitle="Check patients in as they arrive at Cedar Hollow Health, or move and cancel visits on their behalf."
    >
      {error && <Alert tone="danger">{error}</Alert>}

      {loading ? (
        <LoadingBlock label="Loading appointments" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No appointments to show"
          text="Nothing is booked for this selection yet. Book a visit for a patient using the form, or return to the front desk overview."
          action={
            <Button to="/staff/reception" variant="secondary">
              Back to dashboard
            </Button>
          }
        />
      ) : (
        <div className="ds-table-wrap">
          <table className="ds-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Patient</th>
                <th>Doctor</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => {
                const canCheckIn = a.status === 'scheduled';
                const canChange = a.status === 'scheduled' || a.status === 'checked_in';
                return (
                  <tr key={a.id}>
                    <td>
                      <span className="ds-cluster">
                        <Icon name="clock" size={16} />
                        {formatSlot(a.start_time)}
                      </span>
                    </td>
                    <td>{patientText(a)}</td>
                    <td>{doctorText(a)}</td>
                    <td className="ds-muted">{a.reason || 'General visit'}</td>
                    <td>
                      <Badge tone={STATUS_TONES[a.status] || 'neutral'}>
                        {STATUS_LABELS[a.status] || a.status}
                      </Badge>
                    </td>
                    <td>
                      <div className="ds-cluster">
                        {canCheckIn && onCheckIn && (
                          <Button variant="primary" onClick={() => onCheckIn(a)}>
                            <Icon name="check" size={16} /> Check in
                          </Button>
                        )}
                        {canChange && onReschedule && (
                          <Button variant="secondary" onClick={() => onReschedule(a)}>
                            <Icon name="calendar" size={16} /> Reschedule
                          </Button>
                        )}
                        {canChange && onCancel && (
                          <Button variant="danger" onClick={() => onCancel(a)}>
                            <Icon name="close" size={16} /> Cancel
                          </Button>
                        )}
                      </div>
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

export default ReceptionAppointmentsContent;