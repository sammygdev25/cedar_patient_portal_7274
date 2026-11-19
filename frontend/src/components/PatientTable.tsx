import type { KeyboardEvent } from 'react';
import type { User } from '../types';
import { Badge, Button, EmptyState } from './ui';
import { Icon } from './icons';

interface PatientTableProps {
  patients: User[];
  onSelect: (patient: User) => void;
}

function formatBirthDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function computeAge(value: string | null | undefined): number | null {
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

function PatientTable({ patients, onSelect }: PatientTableProps) {
  const rows: User[] = Array.isArray(patients) ? patients : [];

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="users"
        title="No patients yet"
        text="Patients who book an appointment with you will appear here, ready to open their chart."
      />
    );
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, patient: User) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(patient);
    }
  };

  return (
    <div className="ds-table-wrap">
      <table className="ds-table">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Contact</th>
            <th>Date of birth</th>
            <th>Email status</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map((patient) => {
            const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || patient.email;
            const age = computeAge(patient.date_of_birth);
            return (
              <tr
                key={patient.id}
                tabIndex={0}
                onClick={() => onSelect(patient)}
                onKeyDown={(event) => handleKeyDown(event, patient)}
                style={{ cursor: 'pointer' }}
              >
                <td>
                  <div className="ds-card-title">{fullName}</div>
                  <div className="ds-small ds-muted">{patient.email}</div>
                </td>
                <td>
                  {patient.phone ? (
                    <span className="ds-cluster">
                      <Icon name="phone" size={16} />
                      <span>{patient.phone}</span>
                    </span>
                  ) : (
                    <span className="ds-muted">No phone on file</span>
                  )}
                </td>
                <td>
                  <div>{formatBirthDate(patient.date_of_birth)}</div>
                  {age !== null && <div className="ds-small ds-muted">{age} years old</div>}
                </td>
                <td>
                  <Badge tone={patient.email_verified ? 'success' : 'neutral'}>
                    {patient.email_verified ? 'Verified' : 'Unverified'}
                  </Badge>
                </td>
                <td>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelect(patient);
                    }}
                  >
                    Open chart
                    <Icon name="arrow-right" size={16} />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default PatientTable;