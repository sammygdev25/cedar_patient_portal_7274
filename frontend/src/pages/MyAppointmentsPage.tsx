import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { getAppointmentList } from '../api';
import type { Appointment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Stack } from '../components/ui';
import MyAppointmentsHeader from '../components/MyAppointmentsHeader';
import MyAppointmentsContent from '../components/MyAppointmentsContent';
import MyAppointmentsDetails from '../components/MyAppointmentsDetails';
import RescheduleModal from '../components/RescheduleModal';

interface Notice {
  tone: 'success' | 'danger' | 'neutral';
  text: string;
}

type SlotValue =
  | string
  | {
      start_time?: string;
      start?: string;
      time?: string;
      available?: boolean;
      is_available?: boolean;
    };

function isSlotValue(value: unknown): value is SlotValue {
  return typeof value === 'string' || (value !== null && typeof value === 'object');
}

function extractMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === 'string' && data.length < 200) return data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const first = record.detail ?? record.error ?? Object.values(record)[0];
    if (Array.isArray(first) && first.length > 0) return String(first[0]);
    if (typeof first === 'string') return first;
  }
  return fallback;
}

function toSlotList(data: unknown): SlotValue[] {
  if (Array.isArray(data)) return data.filter(isSlotValue);
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const inner = record.slots ?? record.results ?? record.available ?? [];
    return Array.isArray(inner) ? inner.filter(isSlotValue) : [];
  }
  return [];
}

function MyAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
  const [slots, setSlots] = useState<SlotValue[]>([]);
  const [resending, setResending] = useState<boolean>(false);

  const profile = (user || {}) as unknown as Record<string, unknown>;
  const firstName = String(profile.first_name || '');
  const lastName = String(profile.last_name || '');
  const fullName = `${firstName} ${lastName}`.trim();
  const email = String(profile.email || '');
  const phone = String(profile.phone || '');
  const emailVerified = Boolean(profile.email_verified);

  const loadAppointments = useCallback(async () => {
    try {
      const list = await getAppointmentList();
      setAppointments(Array.isArray(list) ? list : []);
      setError('');
    } catch (err) {
      setError(extractMessage(err, 'We could not load your appointments. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadAppointments();
    }
  }, [user, loadAppointments]);

  useEffect(() => {
    if (!notice || notice.tone === 'neutral') return undefined;
    const timer = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const upcomingCount = useMemo(() => {
    const now = Date.now();
    return appointments.filter(
      (a) =>
        (a.status === 'scheduled' || a.status === 'checked_in') &&
        new Date(a.start_time).getTime() >= now
    ).length;
  }, [appointments]);

  const handleCancel = async (appointment: Appointment) => {
    if (!window.confirm('Cancel this appointment? The time will be released for other patients.')) return;
    setNotice({ tone: 'neutral', text: 'Cancelling appointment...' });
    try {
      await api.post(`/appointments/${appointment.id}/cancel/`);
      setNotice({ tone: 'success', text: 'Your appointment was cancelled.' });
      await loadAppointments();
    } catch (err) {
      setNotice({ tone: 'danger', text: extractMessage(err, 'We could not cancel this appointment.') });
    }
  };

  const loadSlots = useCallback(async (appointment: Appointment, date: string) => {
    if (!date) {
      setSlots([]);
      return;
    }
    try {
      const params: Record<string, string | number> = { doctor: Number(appointment.doctor), date };
      if (appointment.service) params.service = Number(appointment.service);
      const res = await api.get('/appointments/availability/', { params });
      setSlots(toSlotList(res.data));
    } catch (err) {
      setSlots([]);
      setNotice({ tone: 'danger', text: extractMessage(err, 'We could not load available times.') });
    }
  }, []);

  const handleReschedule = (appointment: Appointment) => {
    setRescheduling(appointment);
    setSlots([]);
    loadSlots(appointment, String(appointment.start_time).slice(0, 10));
  };

  const handleConfirmReschedule = async (slot: string) => {
    if (!rescheduling || !slot) return;
    setNotice({ tone: 'neutral', text: 'Rescheduling...' });
    try {
      await api.post(`/appointments/${rescheduling.id}/reschedule/`, { start_time: slot });
      setRescheduling(null);
      setSlots([]);
      setNotice({ tone: 'success', text: 'Your appointment was rescheduled.' });
      await loadAppointments();
    } catch (err) {
      setNotice({ tone: 'danger', text: extractMessage(err, 'That time is no longer available. Please pick another.') });
    }
  };

  const handleCloseReschedule = () => {
    setRescheduling(null);
    setSlots([]);
  };

  const handleResendVerification = async () => {
    setResending(true);
    setNotice({ tone: 'neutral', text: 'Sending verification email...' });
    try {
      await api.post('/auth/resend-verification/');
      setNotice({ tone: 'success', text: 'Verification email sent. Check your inbox.' });
    } catch (err) {
      setNotice({ tone: 'danger', text: extractMessage(err, 'We could not send the verification email.') });
    } finally {
      setResending(false);
    }
  };

  return (
    <Stack gap="lg">
      <MyAppointmentsHeader user={user} upcomingCount={upcomingCount} />
      {notice && (
        <div className="ds-container">
          <Alert tone={notice.tone}>{notice.text}</Alert>
        </div>
      )}
      <MyAppointmentsContent
        appointments={appointments}
        loading={loading}
        error={error}
        onCancel={handleCancel}
        onReschedule={handleReschedule}
      />
      <MyAppointmentsDetails
        fullName={fullName}
        email={email}
        phone={phone}
        emailVerified={emailVerified}
        onResendVerification={handleResendVerification}
        resending={resending}
      />
      {rescheduling && (
        <RescheduleModal
          appointment={rescheduling}
          slots={slots}
          onDateChange={(date: string) => loadSlots(rescheduling, date)}
          onConfirm={handleConfirmReschedule}
          onClose={handleCloseReschedule}
        />
      )}
    </Stack>
  );
}

export default MyAppointmentsPage;
