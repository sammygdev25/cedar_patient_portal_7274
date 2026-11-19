import { useEffect, useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import type { User } from '../types';
import { Badge, Button } from '../components/ui';
import { Icon } from '../components/icons';

export interface ProfileFormValues {
  first_name: string;
  last_name: string;
  phone: string;
  date_of_birth: string | null;
}

interface ProfileFormProps {
  user: User | null;
  onSave: (values: ProfileFormValues) => void | Promise<unknown>;
  saving?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  patient: 'Patient',
  doctor: 'Doctor',
  receptionist: 'Receptionist',
};

function ProfileForm({ user, onSave, saving = false }: ProfileFormProps) {
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    setFirstName(user.first_name ?? '');
    setLastName(user.last_name ?? '');
    setPhone(user.phone ?? '');
    setDateOfBirth(user.date_of_birth ?? '');
  }, [user]);

  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const roleLabel = ROLE_LABELS[String(user.role)] || String(user.role);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!firstName.trim() || !lastName.trim()) {
      setError('Please enter your first and last name so the care team can identify you.');
      return;
    }
    if (dateOfBirth && dateOfBirth > today) {
      setError('Date of birth cannot be in the future.');
      return;
    }
    try {
      await onSave({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        date_of_birth: dateOfBirth || null,
      });
    } catch (err) {
      setError('We could not save your details. Please try again.');
    }
  };

  return (
    <form className="ds-form" onSubmit={handleSubmit} noValidate>
      <div className="ds-between">
        <div className="ds-cluster">
          <Badge tone="primary">{roleLabel}</Badge>
          {user.email_verified ? (
            <Badge tone="success">
              <Icon name="check" size={14} /> Email verified
            </Badge>
          ) : (
            <Badge tone="danger">
              <Icon name="alert" size={14} /> Email not verified
            </Badge>
          )}
        </div>
      </div>

      <div className="ds-field">
        <label className="ds-label" htmlFor="profile-email">Email</label>
        <input
          id="profile-email"
          className="input"
          type="email"
          value={user.email}
          readOnly
          disabled
        />
        <span className="ds-help">
          Your email is your Cedar Hollow Health sign-in and cannot be changed here.
        </span>
      </div>

      <div className="ds-form-row">
        <div className="ds-field">
          <label className="ds-label" htmlFor="profile-first-name">First name</label>
          <input
            id="profile-first-name"
            className="input"
            type="text"
            maxLength={150}
            autoComplete="given-name"
            value={firstName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div className="ds-field">
          <label className="ds-label" htmlFor="profile-last-name">Last name</label>
          <input
            id="profile-last-name"
            className="input"
            type="text"
            maxLength={150}
            autoComplete="family-name"
            value={lastName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="ds-form-row">
        <div className="ds-field">
          <label className="ds-label" htmlFor="profile-phone">Phone</label>
          <input
            id="profile-phone"
            className="input"
            type="tel"
            maxLength={30}
            autoComplete="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
          />
          <span className="ds-help">Used for appointment reminders and pharmacy pickup.</span>
        </div>
        <div className="ds-field">
          <label className="ds-label" htmlFor="profile-dob">Date of birth</label>
          <input
            id="profile-dob"
            className="input"
            type="date"
            max={today}
            autoComplete="bday"
            value={dateOfBirth}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDateOfBirth(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="ds-alert" role="alert" style={{ color: 'var(--color-danger)' }}>
          {error}
        </div>
      )}

      <div className="ds-form-actions">
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

export default ProfileForm;