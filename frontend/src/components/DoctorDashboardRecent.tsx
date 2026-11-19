import { Link } from 'react-router-dom';
import { Badge, Button, EmptyState, Section } from '../components/ui';
import { Icon } from '../components/icons';
import type { Appointment } from '../types';

interface DoctorDashboardRecentProps {
  appointments: Appointment[];
  limit?: number;
  getPatientName?: (appointment: Appointment) => string;
  onOpenVisit?: (appointmentId: number) => void;
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
  scheduled: 'soft',
  checked_in: 'primary',
  completed: 'success',
  cancelled: 'danger',
  no_show: 'danger',
};

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day}, ${time}`;
}

function DoctorDashboardRecent({
  appointments,
  limit = 6,
  getPatientName,
  onOpenVisit,
}: DoctorDashboardRecentProps) {
  const list = Array.isArray(appointments) ? appointments : [];
  const recent = [...list]
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    .slice(0, limit);

  const patientLabel = (appointment: Appointment): string =>
    getPatientName ? getPatientName(appointment) : `Patient #${appointment.patient}`;

  return (
    <Section
      eyebrow="Recent activity"
      title="Latest appointments"
      subtitle="Your most recent visits at Cedar Hollow Health. Check-ins from reception appear here automatically."
      actions={
        <Button to="/staff/doctor/patients" variant="ghost">
          <Icon name="users" size={16} />
          My patients
        </Button>
      }
    >
      {recent.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No appointments yet"
          text="Once patients book time with you, their visits will show up here with a link to open the visit note."
          action={
            <Button to="/staff/doctor/patients" variant="secondary">
              View my patients
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
                <th>Reason</th>
                <th>Status</th>
                <th>Visit</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((appointment) => (
                <tr key={appointment.id}>
                  <td>
                    <span className="ds-cluster">
                      <Icon name="clock" size={16} />
                      {formatWhen(appointment.start_time)}
                    </span>
                  </td>
                  <td>{patientLabel(appointment)}</td>
                  <td className="ds-muted">{appointment.reason || 'General consultation'}</td>
                  <td>
                    <Badge tone={STATUS_TONES[appointment.status] || 'neutral'}>
                      {STATUS_LABELS[appointment.status] || appointment.status}
                    </Badge>
                  </td>
                  <td>
                    {onOpenVisit ? (
                      <Button variant="ghost" onClick={() => onOpenVisit(appointment.id)}>
                        Open visit
                        <Icon name="arrow-right" size={16} />
                      </Button>
                    ) : (
                      <Link to={`/staff/doctor/appointments/${appointment.id}/visit`}>
                        Open visit
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Section>
  );
}

export default DoctorDashboardRecent;