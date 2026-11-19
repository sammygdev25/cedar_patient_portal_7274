import type { User } from '../types';
import { Section, Split, Media, Stack, Cluster, CardMeta, Badge, Button } from '../components/ui';
import { Icon } from '../components/icons';

interface PatientDetailMediaProps {
  patient: User | null;
  upcomingCount?: number;
  canStartVisit?: boolean;
  onStartVisit?: () => void;
}

function calculateAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null;
  const birth = new Date(dateOfBirth);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

function formatBirthDate(dateOfBirth: string | null | undefined): string {
  if (!dateOfBirth) return 'Date of birth not on file';
  const date = new Date(dateOfBirth);
  if (Number.isNaN(date.getTime())) return 'Date of birth not on file';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatMemberSince(createdAt: string | null | undefined): string {
  if (!createdAt) return 'Recently registered';
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'Recently registered';
  return `Patient since ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
}

export default function PatientDetailMedia({
  patient,
  upcomingCount = 0,
  canStartVisit = false,
  onStartVisit,
}: PatientDetailMediaProps) {
  if (!patient) return null;

  const fullName = `${patient.first_name} ${patient.last_name}`.trim() || patient.email;
  const age = calculateAge(patient.date_of_birth);
  const ageLabel = age !== null ? `${age} years old` : 'Age not recorded';

  return (
    <Section tight>
      <Split>
        <Media
          alt={`Portrait placeholder for ${fullName}`}
          ratio="square"
          badge={patient.email_verified ? 'Verified' : undefined}
        />
        <Stack gap="md" justify="center">
          <p className="ds-eyebrow">Cedar Hollow Health patient chart</p>
          <h1>{fullName}</h1>
          <CardMeta>
            {ageLabel} &middot; {formatBirthDate(patient.date_of_birth)} &middot; {formatMemberSince(patient.created_at)}
          </CardMeta>
          <Cluster gap="sm">
            {patient.email_verified ? (
              <Badge tone="success">Email verified</Badge>
            ) : (
              <Badge tone="danger">Email not verified</Badge>
            )}
            <Badge tone="soft">
              {upcomingCount === 1 ? '1 upcoming visit' : `${upcomingCount} upcoming visits`}
            </Badge>
          </Cluster>
          <Stack gap="xs">
            <span className="ds-small ds-muted">
              <Icon name="mail" size={16} /> {patient.email}
            </span>
            <span className="ds-small ds-muted">
              <Icon name="phone" size={16} /> {patient.phone || 'No phone number on file'}
            </span>
          </Stack>
          <p className="ds-lead">
            Review this patient's booked appointments, visit notes and prescriptions. Only patients booked with you are visible here.
          </p>
          <Cluster gap="sm">
            {canStartVisit && onStartVisit && (
              <Button variant="primary" size="lg" onClick={onStartVisit}>
                <Icon name="edit" size={18} /> Write visit note
              </Button>
            )}
            <Button variant="ghost" size="lg" to="/staff/doctor/patients">
              <Icon name="arrow-left" size={18} /> All patients
            </Button>
          </Cluster>
        </Stack>
      </Split>
    </Section>
  );
}