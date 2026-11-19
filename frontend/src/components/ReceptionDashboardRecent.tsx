import { Link } from 'react-router-dom';
import { Badge, Button, EmptyState, Section } from '../components/ui';
import { Icon } from '../components/icons';
import type { Appointment, DoctorProfile, User } from '../types';

interface ReceptionDashboardRecentProps {
  appointments: Appointment[];
  patients?: User[];
  doctors?: DoctorProfile[];
  onCheckIn?: (id: number) => void;
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
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ReceptionDashboardRecent({
  appointments,
  patients = [],
  doctors = [],
  onCheckIn,
}: ReceptionDashboardRecentProps) {
  const rows = (Array.isArray(appointments) ? appointments : []).slice(0, 8);

  const patientName = (id: number): string => {
    const match = patients.find((p) => p.id === Number(id));
    if (!match) return `Patient #${id}`;
    return `${match.first_name} ${match.last_name}`.trim() || match.email;
  };

  const doctorName = (id: number): string => {
    const match = doctors.find((d) => d.user === Number(id));
    return match ? match.full_name : `Doctor #${id}`;
  };

  return (
    <Section
      eyebrow="Front desk"
      title="Recent activity"
      subtitle="The latest bookings at Cedar Hollow Health, with check-in one click away."
      actions={
        <Button variant="secondary" to="/staff/reception/appointments">
          All appointments
          <Icon name="arrow-right" size={16} />
        </Button>
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="No appointments yet"
          text="New bookings from patients and the front desk will show up here as they come in."
          action={
            <Button variant="primary" to="/staff/reception/appointments">
              Book an appointment
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
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((appt) => (
                <tr key={appt.id}>
                  <td>
                    <span className="ds-cluster">
                      <Icon name="clock" size={16} />
                      {formatWhen(appt.start_time)}
                    </span>
                  </td>
                  <td>
                    <Link to="/staff/reception/appointments">{patientName(appt.patient)}</Link>
                    {appt.reason ? <div className="ds-small ds-muted">{appt.reason}</div> : null}
                  </td>
                  <td>{doctorName(appt.doctor)}</td>
                  <td>
                    <Badge tone={STATUS_TONES[appt.status] || 'neutral'}>
                      {STATUS_LABELS[appt.status] || appt.status}
                    </Badge>
                  </td>
                  <td>
                    {appt.status === 'scheduled' && onCheckIn ? (
                      <Button variant="primary" onClick={() => onCheckIn(appt.id)}>
                        <Icon name="check" size={16} />
                        Check in
                      </Button>
                    ) : (
                      <Link to="/staff/reception/appointments" className="ds-small">
                        View
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

export default ReceptionDashboardRecent;