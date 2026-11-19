import { useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Section, Card, CardBody, Stack, Cluster, Badge, Button, Alert, EmptyState, SkeletonCards } from '../components/ui';
import { Icon } from '../components/icons';
import type { User } from '../types';

interface DoctorPatientsContentProps {
  section?: string;
  page?: string;
  patients?: User[];
  loading?: boolean;
  error?: string;
  onSelect?: (patient: User) => void;
}

function formatBirthDate(value: string | null | undefined): string {
  if (!value) return 'Not on file';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Not on file';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DoctorPatientsContent({
  patients = [],
  loading = false,
  error = '',
  onSelect,
}: DoctorPatientsContentProps) {
  const [query, setQuery] = useState('');

  const list: User[] = Array.isArray(patients) ? patients : [];

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return list;
    return list.filter((p) => {
      const haystack = `${p.first_name} ${p.last_name} ${p.email} ${p.phone || ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [list, query]);

  if (loading) {
    return (
      <Section title="Your patients" subtitle="Loading everyone booked with you at Cedar Hollow Health.">
        <SkeletonCards count={6} />
      </Section>
    );
  }

  return (
    <Section
      title="Your patients"
      subtitle="Patients who have an appointment booked with you. Open a chart to review history, visit notes and prescriptions."
    >
      <Stack gap="md">
        {error && <Alert tone="danger">{error}</Alert>}

        {list.length > 0 && (
          <div className="ds-filters">
            <div className="ds-field">
              <label className="ds-label" htmlFor="patient-search">Search patients</label>
              <input
                id="patient-search"
                className="input"
                type="search"
                placeholder="Search by name, email or phone"
                value={query}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              />
            </div>
            <span className="ds-small ds-muted">
              {filtered.length} of {list.length} patients
            </span>
          </div>
        )}

        {list.length === 0 && !error && (
          <EmptyState
            icon="users"
            title="No patients on your schedule yet"
            text="Once reception or a patient books an appointment with you, they will appear here."
          />
        )}

        {list.length > 0 && filtered.length === 0 && (
          <EmptyState
            icon="search"
            title="No patients match your search"
            text="Try a different name, email address or phone number."
            action={<Button variant="secondary" onClick={() => setQuery('')}>Clear search</Button>}
          />
        )}

        {filtered.length > 0 && (
          <Card>
            <CardBody>
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Contact</th>
                      <th>Date of birth</th>
                      <th>Email</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((patient) => (
                      <tr key={patient.id}>
                        <td>
                          <strong>{patient.first_name} {patient.last_name}</strong>
                        </td>
                        <td>
                          <Stack gap="xs">
                            <Cluster gap="xs">
                              <Icon name="mail" size={14} />
                              <span className="ds-small">{patient.email}</span>
                            </Cluster>
                            {patient.phone && (
                              <Cluster gap="xs">
                                <Icon name="phone" size={14} />
                                <span className="ds-small ds-muted">{patient.phone}</span>
                              </Cluster>
                            )}
                          </Stack>
                        </td>
                        <td>{formatBirthDate(patient.date_of_birth)}</td>
                        <td>
                          <Badge tone={patient.email_verified ? 'success' : 'neutral'}>
                            {patient.email_verified ? 'Verified' : 'Unverified'}
                          </Badge>
                        </td>
                        <td>
                          {onSelect && (
                            <Button variant="ghost" onClick={() => onSelect(patient)}>
                              Open chart
                              <Icon name="arrow-right" size={16} />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardBody>
          </Card>
        )}
      </Stack>
    </Section>
  );
}