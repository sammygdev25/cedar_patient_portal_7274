import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Section } from '../components/ui';
import { Icon } from '../components/icons';
import { createAppointment } from '../api';
import { useAuth } from '../contexts/AuthContext';
import type { DoctorProfile, Service } from '../types';

interface BookAppointmentFormProps {
  doctors?: DoctorProfile[];
  services?: Service[];
  slots?: string[];
  loadingSlots?: boolean;
  onSelectionChange?: (doctorId: number | null, serviceId: number | null, date: string) => void;
  onBooked?: () => void;
}

type CreatePayload = Parameters<typeof createAppointment>[0];

function BookAppointmentForm({
  doctors = [],
  services = [],
  slots = [],
  loadingSlots = false,
  onSelectionChange,
  onBooked,
}: BookAppointmentFormProps) {
  const { user } = useAuth();
  const [doctorId, setDoctorId] = useState<number | null>(null);
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const change = (d: number | null, s: number | null, day: string) => {
    setDoctorId(d);
    setServiceId(s);
    setDate(day);
    setSlot('');
    if (onSelectionChange) onSelectionChange(d, s, day);
  };

  const formatSlot = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const doctor = doctors.find((d) => d.user === doctorId);
    if (!doctor || !slot) {
      setError('Please choose a doctor, a date and an available time before booking.');
      return;
    }
    const service = services.find((s) => s.id === serviceId);
    const minutes = service?.duration_minutes || doctor.consultation_minutes || 30;
    const end = new Date(new Date(slot).getTime() + minutes * 60000).toISOString();
    setSubmitting(true);
    try {
      await createAppointment({
        patient: user?.id,
        doctor: doctor.user,
        service: serviceId,
        start_time: slot,
        end_time: end,
        reason,
      } as unknown as CreatePayload);
      setDone(true);
      if (onBooked) onBooked();
    } catch (err) {
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      const text = data && typeof data === 'object' ? Object.values(data as Record<string, unknown>).flat().join(' ') : '';
      setError(text || 'We could not book this appointment. The time may have just been taken, or your email may not be verified yet.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Section narrow>
        <Alert tone="success">
          <Icon name="check" /> Your appointment at Cedar Hollow Health is booked.
        </Alert>
        <div className="ds-form-actions">
          <Button to="/portal/appointments" variant="primary">View my appointments</Button>
          <Button to="/portal" variant="ghost">Back to portal</Button>
        </div>
      </Section>
    );
  }

  return (
    <Section narrow eyebrow="Appointments" title="Choose a doctor and time" subtitle="Pick who you would like to see, the day that suits you and an open slot.">
      <form className="ds-form" onSubmit={handleSubmit}>
        {error && <Alert tone="danger"><Icon name="alert" /> {error}</Alert>}
        <div className="ds-field">
          <label className="ds-label" htmlFor="book-doctor">Doctor</label>
          <select id="book-doctor" className="input" required value={doctorId ?? ''}
            onChange={(e) => change(e.target.value ? Number(e.target.value) : null, serviceId, date)}>
            <option value="">Select a doctor</option>
            {(Array.isArray(doctors) ? doctors : []).map((d) => (
              <option key={d.id} value={d.user}>{d.full_name} · {d.specialty}</option>
            ))}
          </select>
        </div>
        <div className="ds-field">
          <label className="ds-label" htmlFor="book-service">Service</label>
          <select id="book-service" className="input" value={serviceId ?? ''}
            onChange={(e) => change(doctorId, e.target.value ? Number(e.target.value) : null, date)}>
            <option value="">General consultation</option>
            {(Array.isArray(services) ? services : []).filter((s) => s.is_active).map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>
            ))}
          </select>
          <span className="ds-help">The service sets how long your visit lasts.</span>
        </div>
        <div className="ds-field">
          <label className="ds-label" htmlFor="book-date">Date</label>
          <input id="book-date" type="date" className="input" min={today} required value={date}
            onChange={(e) => change(doctorId, serviceId, e.target.value)} />
        </div>
        <div className="ds-field">
          <span className="ds-label">Available times</span>
          {loadingSlots && <span className="ds-help">Checking the doctor's schedule…</span>}
          {!loadingSlots && slots.length === 0 && (
            <span className="ds-help">Select a doctor and date to see open times.</span>
          )}
          <div className="ds-cluster">
            {(Array.isArray(slots) ? slots : []).map((s) => (
              <Button key={s} type="button" size="md" variant={slot === s ? 'primary' : 'secondary'} onClick={() => setSlot(s)}>
                <Icon name="clock" size={14} /> {formatSlot(s)}
              </Button>
            ))}
          </div>
        </div>
        <div className="ds-field">
          <label className="ds-label" htmlFor="book-reason">Reason for visit</label>
          <textarea id="book-reason" className="input" rows={3} value={reason}
            onChange={(e) => setReason(e.target.value)} placeholder="Briefly describe your symptoms or what you would like to discuss" />
          <span className="ds-help">Only your doctor and our reception team can see this.</span>
        </div>
        <div className="ds-form-actions">
          <Button type="submit" variant="primary" disabled={submitting || !slot}>
            <Icon name="calendar" size={16} /> {submitting ? 'Booking…' : 'Book appointment'}
          </Button>
          <Link to="/portal/appointments" className="btn btn-secondary">Cancel</Link>
        </div>
      </form>
    </Section>
  );
}

export default BookAppointmentForm;