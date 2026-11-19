import type { Appointment, Prescription, User, VisitNote } from '../types';
import { Badge, Card, CardBody, CardMeta, CardTitle, Grid, Section, Stat } from '../components/ui';
import { Icon } from '../components/icons';

interface PatientDetailFactsProps {
  patient: User | null;
  appointments?: Appointment[];
  visitNotes?: VisitNote[];
  prescriptions?: Prescription[];
}

function formatDay(value?: string | null): string {
  if (!value) return 'Not on file';
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return 'Not on file';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ageFrom(value?: string | null): string {
  if (!value) return '';
  const born = new Date(`${value}T00:00:00`);
  if (Number.isNaN(born.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 ? ` (${age} years old)` : '';
}

export default function PatientDetailFacts({
  patient,
  appointments = [],
  visitNotes = [],
  prescriptions = [],
}: PatientDetailFactsProps) {
  if (!patient) {
    return null;
  }

  const completedVisits = (Array.isArray(appointments) ? appointments : []).filter((a) => a.status === 'completed').length;
  const upcomingVisits = (Array.isArray(appointments) ? appointments : []).filter(
    (a) => a.status === 'scheduled' || a.status === 'checked_in'
  ).length;
  const activePrescriptions = (Array.isArray(prescriptions) ? prescriptions : []).filter((p) => p.is_active).length;
  const latestNote = visitNotes.length > 0 ? visitNotes[0] : null;

  const rows: { icon: 'mail' | 'phone' | 'calendar' | 'shield' | 'clock'; label: string; value: string }[] = [
    { icon: 'mail', label: 'Email', value: patient.email || 'Not on file' },
    { icon: 'phone', label: 'Phone', value: patient.phone || 'Not on file' },
    {
      icon: 'calendar',
      label: 'Date of birth',
      value: `${formatDay(patient.date_of_birth)}${ageFrom(patient.date_of_birth)}`,
    },
    { icon: 'clock', label: 'Registered with Cedar Hollow', value: formatDay(patient.created_at) },
  ];

  return (
    <Section
      eyebrow="Patient record"
      title="Patient details"
      subtitle="Contact information and care history for patients booked with you."
    >
      <Grid size="sm" cols={3}>
        <Stat value={upcomingVisits} label="Upcoming visits" icon="calendar" />
        <Stat value={completedVisits} label="Completed visits" icon="check" />
        <Stat value={activePrescriptions} label="Active prescriptions" icon="package" />
      </Grid>

      <Grid size="lg" cols={2}>
        <Card>
          <CardBody>
            <CardTitle>Contact and identity</CardTitle>
            <div className="ds-table-wrap">
              <table className="ds-table">
                <tbody>
                  {(Array.isArray(rows) ? rows : []).map((row) => (
                    <tr key={row.label}>
                      <th scope="row">
                        <span className="ds-cluster">
                          <Icon name={row.icon} size={16} />
                          {row.label}
                        </span>
                      </th>
                      <td>{row.value}</td>
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">
                      <span className="ds-cluster">
                        <Icon name="shield" size={16} />
                        Email status
                      </span>
                    </th>
                    <td>
                      <Badge tone={patient.email_verified ? 'success' : 'danger'}>
                        {patient.email_verified ? 'Verified' : 'Not verified'}
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <div className="ds-stack">
              <CardTitle>Most recent visit note</CardTitle>
              {latestNote ? (
                <>
                  <CardMeta>Written {formatDay(latestNote.created_at)}</CardMeta>
                  <div>
                    <p className="ds-label">Chief complaint</p>
                    <p>{latestNote.chief_complaint}</p>
                  </div>
                  <div>
                    <p className="ds-label">Diagnosis</p>
                    <p>{latestNote.diagnosis}</p>
                  </div>
                  {latestNote.follow_up_instructions ? (
                    <div>
                      <p className="ds-label">Follow-up instructions</p>
                      <p>{latestNote.follow_up_instructions}</p>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="ds-muted">
                  No visit notes yet. Notes you save after an appointment appear here and in the
                  patient's medical records.
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      </Grid>
    </Section>
  );
}