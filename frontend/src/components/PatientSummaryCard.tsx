import { Badge, Card, CardBody, CardMeta, CardTitle, Cluster, Stack } from './ui';
import { Icon } from './icons';
import type { User } from '../types';

interface PatientSummaryCardProps {
  patient: User;
}

function formatBirthDate(value: string | null | undefined): string {
  if (!value) return '';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function calculateAge(value: string | null | undefined): number | null {
  if (!value) return null;
  const birth = new Date(`${value}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

function formatMemberSince(value: string | null | undefined): string {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function PatientSummaryCard({ patient }: PatientSummaryCardProps) {
  if (!patient) return null;

  const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.email;
  const birthDate = formatBirthDate(patient.date_of_birth);
  const age = calculateAge(patient.date_of_birth);
  const memberSince = formatMemberSince(patient.created_at);

  return (
    <Card>
      <CardBody>
        <Stack gap="md">
          <Cluster justify="between" align="center">
            <Stack gap="xs">
              <CardTitle>{fullName}</CardTitle>
              <CardMeta>Cedar Hollow Health patient</CardMeta>
            </Stack>
            {patient.email_verified ? (
              <Badge tone="success">
                <Icon name="check" size={14} /> Email verified
              </Badge>
            ) : (
              <Badge tone="danger">
                <Icon name="alert" size={14} /> Email not verified
              </Badge>
            )}
          </Cluster>

          <Stack gap="sm">
            <Cluster gap="sm" align="center">
              <Icon name="mail" size={16} />
              <span>{patient.email}</span>
            </Cluster>

            <Cluster gap="sm" align="center">
              <Icon name="phone" size={16} />
              <span className={patient.phone ? '' : 'ds-muted'}>
                {patient.phone || 'No phone number on file'}
              </span>
            </Cluster>

            <Cluster gap="sm" align="center">
              <Icon name="calendar" size={16} />
              <span className={birthDate ? '' : 'ds-muted'}>
                {birthDate
                  ? `Born ${birthDate}${age !== null ? ` (${age} years old)` : ''}`
                  : 'Date of birth not recorded'}
              </span>
            </Cluster>

            {memberSince && (
              <Cluster gap="sm" align="center">
                <Icon name="clock" size={16} />
                <span className="ds-small ds-muted">Patient since {memberSince}</span>
              </Cluster>
            )}
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  );
}

export default PatientSummaryCard;