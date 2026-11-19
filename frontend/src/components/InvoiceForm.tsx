import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { User, Appointment } from '../types';
import { Alert, Button, Card, CardBody, CardTitle } from './ui';
import { Icon } from './icons';

export interface InvoiceFormValues {
  user: number;
  appointment: number | null;
  description: string;
  total_amount: string;
  due_date: string | null;
}

interface InvoiceFormProps {
  patients: User[];
  appointments: Appointment[];
  onPatientChange: (patientId: number) => void;
  onSubmit: (values: InvoiceFormValues) => void | Promise<unknown>;
  submitting: boolean;
}

function formatVisit(appointment: Appointment): string {
  const when = new Date(appointment.start_time).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const reason = appointment.reason ? ` - ${appointment.reason}` : '';
  return `${when}${reason}`;
}

function InvoiceForm({
  patients,
  appointments,
  onPatientChange,
  onSubmit,
  submitting,
}: InvoiceFormProps) {
  const [patientId, setPatientId] = useState<string>('');
  const [appointmentId, setAppointmentId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [error, setError] = useState<string>('');

  const patientList: User[] = Array.isArray(patients) ? patients : [];
  const appointmentList: Appointment[] = Array.isArray(appointments) ? appointments : [];

  const handlePatientChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setPatientId(value);
    setAppointmentId('');
    setError('');
    onPatientChange(value ? Number(value) : 0);
  };

  const resetForm = () => {
    setPatientId('');
    setAppointmentId('');
    setDescription('');
    setAmount('');
    setDueDate('');
    onPatientChange(0);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const parsedAmount = Number(amount);
    if (!patientId) {
      setError('Choose the patient this bill is for.');
      return;
    }
    if (!description.trim()) {
      setError('Add a short description, such as "Consultation fee" or "Lab work".');
      return;
    }
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Enter a total amount greater than zero.');
      return;
    }

    try {
      await onSubmit({
        user: Number(patientId),
        appointment: appointmentId ? Number(appointmentId) : null,
        description: description.trim(),
        total_amount: Number(parsedAmount || 0).toFixed(2),
        due_date: dueDate || null,
      });
      resetForm();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'The bill could not be created. Please try again.');
    }
  };

  return (
    <Card>
      <CardBody>
        <CardTitle>
          <Icon name="plus" size={18} /> Create a bill
        </CardTitle>
        <p className="ds-muted ds-small">
          The patient will see this bill in their portal and can pay it by card. It is marked paid
          automatically once the payment is confirmed.
        </p>

        <form className="ds-form" onSubmit={handleSubmit} noValidate>
          {error && <Alert tone="danger">{error}</Alert>}

          <div className="ds-field">
            <label className="ds-label" htmlFor="invoice-patient">
              Patient
            </label>
            <select
              id="invoice-patient"
              className="input"
              value={patientId}
              onChange={handlePatientChange}
              disabled={submitting}
              required
            >
              <option value="">Select a patient</option>
              {patientList.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.last_name}, {patient.first_name} ({patient.email})
                </option>
              ))}
            </select>
            {patientList.length === 0 && (
              <span className="ds-help">No patients are registered yet.</span>
            )}
          </div>

          <div className="ds-field">
            <label className="ds-label" htmlFor="invoice-appointment">
              Related visit (optional)
            </label>
            <select
              id="invoice-appointment"
              className="input"
              value={appointmentId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setAppointmentId(e.target.value)}
              disabled={submitting || !patientId}
            >
              <option value="">No linked visit</option>
              {appointmentList.map((appointment) => (
                <option key={appointment.id} value={appointment.id}>
                  {formatVisit(appointment)}
                </option>
              ))}
            </select>
            <span className="ds-help">
              {patientId
                ? appointmentList.length === 0
                  ? 'This patient has no appointments on file.'
                  : 'Link the bill to one of the patient\u2019s appointments.'
                : 'Select a patient to see their appointments.'}
            </span>
          </div>

          <div className="ds-field">
            <label className="ds-label" htmlFor="invoice-description">
              Description
            </label>
            <input
              id="invoice-description"
              className="input"
              type="text"
              maxLength={255}
              placeholder="e.g. Annual physical examination"
              value={description}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <div className="ds-form-row">
            <div className="ds-field">
              <label className="ds-label" htmlFor="invoice-amount">
                Total amount (USD)
              </label>
              <input
                id="invoice-amount"
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                value={amount}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="ds-field">
              <label className="ds-label" htmlFor="invoice-due-date">
                Due date (optional)
              </label>
              <input
                id="invoice-due-date"
                className="input"
                type="date"
                value={dueDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="ds-form-actions">
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Creating bill...' : 'Create bill'}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

export default InvoiceForm;