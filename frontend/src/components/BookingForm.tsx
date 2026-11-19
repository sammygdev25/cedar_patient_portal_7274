import { useState } from 'react';
import type { FormEvent } from 'react';
import type { DoctorProfile, Service, User } from '../types';
import { Button, Alert } from './ui';
import { Icon } from './icons';

export interface BookingSelection {
  doctor: number | null;
  service: number | null;
  date: string;
}

export interface BookingPayload {
  patient?: number;
  doctor: number;
  service: number | null;
  start_time: string;
  reason: string;
}

interface BookingFormProps {
  doctors: DoctorProfile[];
  services: Service[];
  patients: User[];
  allowPatientSelect: boolean;
  selectedSlot: string;
  onSelectionChange: (selection: BookingSelection) => void;
  onSubmit: (payload: BookingPayload) => void;
  submitting: boolean;
}

function todayString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function BookingForm({
  doctors,
  services,
  patients,
  allowPatientSelect,
  selectedSlot,
  onSelectionChange,
  onSubmit,
  submitting,
}: BookingFormProps) {
  const [doctor, setDoctor] = useState<string>('');
  const [service, setService] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [patient, setPatient] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string>('');

  const doctorList = Array.isArray(doctors) ? doctors : [];
  const serviceList = Array.isArray(services) ? services : [];
  const patientList = Array.isArray(patients) ? patients : [];

  const notify = (nextDoctor: string, nextService: string, nextDate: string) => {
    onSelectionChange({
      doctor: nextDoctor ? Number(nextDoctor) : null,
      service: nextService ? Number(nextService) : null,
      date: nextDate,
    });
  };

  const handleDoctor = (value: string) => {
    setDoctor(value);
    notify(value, service, date);
  };

  const handleService = (value: string) => {
    setService(value);
    notify(doctor, value, date);
  };

  const handleDate = (value: string) => {
    setDate(value);
    notify(doctor, service, value);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (allowPatientSelect && !patient) {
      setError('Choose the patient this appointment is for.');
      return;
    }
    if (!doctor) {
      setError('Choose a doctor to continue.');
      return;
    }
    if (!date) {
      setError('Pick a date to see available times.');
      return;
    }
    if (!selectedSlot) {
      setError('Select one of the available time slots.');
      return;
    }
    const payload: BookingPayload = {
      doctor: Number(doctor),
      service: service ? Number(service) : null,
      start_time: selectedSlot,
      reason: reason.trim(),
    };
    if (allowPatientSelect) {
      payload.patient = Number(patient);
    }
    onSubmit(payload);
  };

  return (
    <form className="ds-form" onSubmit={handleSubmit}>
      {error && <Alert tone="danger">{error}</Alert>}

      {allowPatientSelect && (
        <div className="ds-field">
          <label className="ds-label" htmlFor="booking-patient">Patient</label>
          <select
            id="booking-patient"
            className="input"
            value={patient}
            onChange={(e) => setPatient(e.target.value)}
            required
          >
            <option value="">Select a patient</option>
            {patientList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.last_name}, {p.first_name} ({p.email})
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="ds-form-row">
        <div className="ds-field">
          <label className="ds-label" htmlFor="booking-doctor">Doctor</label>
          <select
            id="booking-doctor"
            className="input"
            value={doctor}
            onChange={(e) => handleDoctor(e.target.value)}
            required
          >
            <option value="">Select a doctor</option>
            {doctorList.map((d) => (
              <option key={d.id} value={Number(d.user)}>
                {d.full_name} — {d.specialty}
              </option>
            ))}
          </select>
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor="booking-service">Service</label>
          <select
            id="booking-service"
            className="input"
            value={service}
            onChange={(e) => handleService(e.target.value)}
          >
            <option value="">General consultation</option>
            {serviceList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.duration_minutes} min)
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ds-field">
        <label className="ds-label" htmlFor="booking-date">Preferred date</label>
        <input
          id="booking-date"
          type="date"
          className="input"
          min={todayString()}
          value={date}
          onChange={(e) => handleDate(e.target.value)}
          required
        />
        <span className="ds-help">Available times for this doctor appear once a date is chosen.</span>
      </div>

      <div className="ds-field">
        <label className="ds-label" htmlFor="booking-reason">Reason for visit</label>
        <textarea
          id="booking-reason"
          className="input"
          rows={3}
          placeholder="Briefly describe symptoms or what you would like to discuss"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <div className="ds-form-actions">
        <Button type="submit" variant="primary" size="lg" disabled={submitting || !selectedSlot}>
          <Icon name="calendar" size={18} />
          {submitting ? 'Booking...' : 'Confirm appointment'}
        </Button>
      </div>
    </form>
  );
}

export default BookingForm;