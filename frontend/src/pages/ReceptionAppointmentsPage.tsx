import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { getAppointmentList, getServiceList, getDoctorProfileList } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Section } from '../components/ui';
import ReceptionAppointmentsHeader from '../components/ReceptionAppointmentsHeader';
import ReceptionAppointmentsContent from '../components/ReceptionAppointmentsContent';
import ReceptionAppointmentsDetails from '../components/ReceptionAppointmentsDetails';
import BookingForm from '../components/BookingForm';
import SlotPicker from '../components/SlotPicker';
import RescheduleModal from '../components/RescheduleModal';
import type { Appointment } from '../types';

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Selection {
  doctor?: any;
  service?: any;
  date?: string;
  patient?: any;
}

interface Feedback {
  tone: 'success' | 'danger';
  text: string;
}

const toArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  return data?.results || data?.slots || data?.data || data?.items || [];
};

const slotValue = (slot: any): string => {
  if (typeof slot === 'string') return slot;
  return slot?.start_time || slot?.start || slot?.value || '';
};

const errorText = (err: any, fallback: string): string => {
  const data = err?.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (data.detail) return String(data.detail);
  const first: any = Object.values(data)[0];
  if (Array.isArray(first)) return String(first[0]);
  return first ? String(first) : fallback;
};

function ReceptionAppointmentsPage() {
  const { user } = useAuth();
  const role = (user as any)?.role;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [showBooking, setShowBooking] = useState<boolean>(false);
  const [selection, setSelection] = useState<Selection>({});
  const [slots, setSlots] = useState<any[]>([]);
  const [slotsLoading, setSlotsLoading] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
  const [rescheduleSlots, setRescheduleSlots] = useState<any[]>([]);

  const notify = useCallback((tone: Feedback['tone'], text: string) => {
    setFeedback({ tone, text });
    window.setTimeout(() => setFeedback(null), 4000);
  }, []);

  const loadAppointments = useCallback(async () => {
    try {
      const list = await getAppointmentList();
      setAppointments(Array.isArray(list) ? list : []);
      setError('');
    } catch (err: any) {
      setError(errorText(err, 'Appointments could not be loaded.'));
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadAll = async () => {
      setLoading(true);
      await loadAppointments();
      try {
        const [serviceList, profileList, patientRes] = await Promise.all([
          getServiceList(),
          getDoctorProfileList(),
          api.get('/patients/'),
        ]);
        if (!active) return;
        setServices(Array.isArray(serviceList) ? serviceList : []);
        setDoctors(
          (Array.isArray(profileList) ? profileList : []).map((p: any) => ({
            ...p,
            id: p.user,
            profile_id: p.id,
            name: p.full_name,
          }))
        );
        setPatients(toArray(patientRes.data));
      } catch (err: any) {
        if (active) setError(errorText(err, 'Booking options could not be loaded.'));
      }
      if (active) setLoading(false);
    };
    loadAll();
    return () => {
      active = false;
    };
  }, [loadAppointments]);

  useEffect(() => {
    setSelectedSlot('');
    if (!selection.doctor || !selection.date) {
      setSlots([]);
      return;
    }
    let active = true;
    setSlotsLoading(true);
    api
      .get('/appointments/availability/', {
        params: { doctor: selection.doctor, date: selection.date, service: selection.service || undefined },
      })
      .then((res: any) => {
        if (active) setSlots(toArray(res.data));
      })
      .catch(() => {
        if (active) setSlots([]);
      })
      .finally(() => {
        if (active) setSlotsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selection.doctor, selection.service, selection.date]);

  const patientMap = useMemo(() => {
    const map: Record<string, string> = {};
    patients.forEach((p: any) => {
      const full = `${p.first_name || ''} ${p.last_name || ''}`.trim();
      map[String(p.id)] = full || p.email || `Patient #${p.id}`;
    });
    return map;
  }, [patients]);

  const doctorMap = useMemo(() => {
    const map: Record<string, string> = {};
    doctors.forEach((d: any) => {
      map[String(d.id)] = d.full_name || `Doctor #${d.id}`;
    });
    return map;
  }, [doctors]);

  const patientLabel = (a: Appointment): string =>
    (a as any).patient_name || patientMap[String((a as any).patient)] || `Patient #${(a as any).patient}`;
  const doctorLabel = (a: Appointment): string =>
    (a as any).doctor_name || doctorMap[String((a as any).doctor)] || `Doctor #${(a as any).doctor}`;

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAppointments();
    setRefreshing(false);
  };

  const handleBook = async (values: any) => {
    const patient = values?.patient || selection.patient;
    const doctor = values?.doctor || selection.doctor;
    const service = values?.service || selection.service;
    if (!patient || !doctor || !selectedSlot) {
      notify('danger', 'Choose a patient, a doctor and a time slot before booking.');
      return;
    }
    const svc = services.find((s: any) => String(s.id) === String(service));
    const doc = doctors.find((d: any) => String(d.id) === String(doctor));
    const minutes = svc?.duration_minutes || doc?.consultation_minutes || 30;
    const start = new Date(selectedSlot);
    const end = new Date(start.getTime() + minutes * 60000);
    setSubmitting(true);
    try {
      await api.post('/appointments/', {
        patient,
        doctor,
        service: service || null,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        reason: values?.reason || '',
      });
      notify('success', 'Appointment booked.');
      setSelection({});
      setSelectedSlot('');
      setShowBooking(false);
      await loadAppointments();
    } catch (err: any) {
      notify('danger', errorText(err, 'The appointment could not be booked.'));
    } finally {
      setSubmitting(false);
    }
  };

  const runAction = async (a: Appointment, action: string, body: any, okText: string, failText: string) => {
    try {
      await api.post(`/appointments/${(a as any).id}/${action}/`, body);
      notify('success', okText);
      await loadAppointments();
      return true;
    } catch (err: any) {
      notify('danger', errorText(err, failText));
      return false;
    }
  };

  const handleCheckIn = (a: Appointment) =>
    runAction(a, 'check-in', {}, `${patientLabel(a)} checked in.`, 'Check-in failed.');

  const handleCancel = (a: Appointment) => {
    if (!window.confirm(`Cancel the appointment for ${patientLabel(a)}?`)) return;
    runAction(a, 'cancel', {}, 'Appointment cancelled.', 'The appointment could not be cancelled.');
  };

  const handleRescheduleOpen = (a: Appointment) => {
    setRescheduleSlots([]);
    setRescheduling(a);
  };

  const handleRescheduleDate = async (date: string) => {
    if (!rescheduling || !date) {
      setRescheduleSlots([]);
      return;
    }
    try {
      const res = await api.get('/appointments/availability/', {
        params: { doctor: (rescheduling as any).doctor, date },
      });
      setRescheduleSlots(toArray(res.data));
    } catch {
      setRescheduleSlots([]);
    }
  };

  const handleRescheduleConfirm = async (slot: any) => {
    if (!rescheduling) return;
    const start = slotValue(slot);
    if (!start) {
      notify('danger', 'Pick a new time slot first.');
      return;
    }
    const ok = await runAction(
      rescheduling,
      'reschedule',
      { start_time: start },
      'Appointment rescheduled.',
      'The appointment could not be rescheduled.'
    );
    if (ok) setRescheduling(null);
  };

  if (role && role !== 'receptionist') {
    return (
      <Section title="Reception appointments">
        <Alert tone="danger">This page is for Cedar Hollow reception staff only.</Alert>
      </Section>
    );
  }

  return (
    <div className="ds-stack">
      <ReceptionAppointmentsHeader
        user={user as any}
        onNewBooking={() => setShowBooking((v) => !v)}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {feedback && (
        <Section tight>
          <Alert tone={feedback.tone}>{feedback.text}</Alert>
        </Section>
      )}

      {showBooking && (
        <Section
          eyebrow="Front desk"
          title="Book for a patient"
          subtitle="Choose the patient, doctor and day, then pick an open time."
        >
          <div className="ds-grid-2">
            <BookingForm
              doctors={doctors}
              services={services}
              patients={patients}
              allowPatientSelect={true}
              selectedSlot={selectedSlot}
              onSelectionChange={(sel: any) => setSelection((prev) => ({ ...prev, ...sel }))}
              onSubmit={handleBook}
              submitting={submitting}
            />
            <SlotPicker
              slots={slots}
              selectedSlot={selectedSlot}
              onSelect={(slot: any) => setSelectedSlot(slotValue(slot))}
              loading={slotsLoading}
            />
          </div>
        </Section>
      )}

      <ReceptionAppointmentsContent
        appointments={appointments}
        loading={loading}
        error={error}
        patientLabel={patientLabel}
        doctorLabel={doctorLabel}
        onCheckIn={handleCheckIn}
        onCancel={handleCancel}
        onReschedule={handleRescheduleOpen}
      />

      <ReceptionAppointmentsDetails section="Account details" page="ReceptionAppointmentsPage" />

      {rescheduling && (
        <RescheduleModal
          appointment={rescheduling}
          slots={rescheduleSlots}
          onDateChange={handleRescheduleDate}
          onConfirm={handleRescheduleConfirm}
          onClose={() => setRescheduling(null)}
        />
      )}
    </div>
  );
}

export default ReceptionAppointmentsPage;