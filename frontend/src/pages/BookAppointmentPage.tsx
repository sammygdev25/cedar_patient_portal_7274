import { useCallback, useEffect, useState } from 'react';
import api, { getDoctorProfileList, getServiceList } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Alert, LoadingBlock } from '../components/ui';
import VerifyEmailBanner from '../components/VerifyEmailBanner';
import BookAppointmentHeader from '../components/BookAppointmentHeader';
import BookAppointmentForm from '../components/BookAppointmentForm';
import BookAppointmentInfo from '../components/BookAppointmentInfo';
import type { DoctorProfile, Service } from '../types';

interface Selection {
  doctorId: number | null;
  serviceId: number | null;
  date: string;
}

function normalizeSlots(data: unknown): string[] {
  const source: unknown[] = Array.isArray(data)
    ? data
    : Array.isArray((data as { slots?: unknown[] })?.slots)
      ? (data as { slots: unknown[] }).slots
      : Array.isArray((data as { available_slots?: unknown[] })?.available_slots)
        ? (data as { available_slots: unknown[] }).available_slots
        : Array.isArray((data as { results?: unknown[] })?.results)
          ? (data as { results: unknown[] }).results
          : [];
  const result: string[] = [];
  source.forEach((item) => {
    if (typeof item === 'string') {
      result.push(item);
    } else if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      const value = record.start_time ?? record.start ?? record.time ?? record.slot;
      if (typeof value === 'string') result.push(value);
    }
  });
  return result;
}

function BookAppointmentPage() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [selection, setSelection] = useState<Selection>({ doctorId: null, serviceId: null, date: '' });
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    async function loadReferenceData() {
      try {
        const [doctorList, serviceList] = await Promise.all([getDoctorProfileList(), getServiceList()]);
        if (cancelled) return;
        setDoctors(Array.isArray(doctorList) ? doctorList : []);
        setServices((Array.isArray(serviceList) ? serviceList : []).filter((s: Service) => s.is_active));
      } catch (err) {
        if (!cancelled) setError('We could not load our doctors and services. Please refresh and try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadReferenceData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!selection.doctorId || !selection.date) {
      setSlots([]);
      setLoadingSlots(false);
      return undefined;
    }
    async function loadSlots() {
      setLoadingSlots(true);
      try {
        const params: Record<string, string | number> = {
          doctor: selection.doctorId as number,
          date: selection.date,
        };
        if (selection.serviceId) params.service = selection.serviceId;
        const response = await api.get('/appointments/availability/', { params });
        if (!cancelled) setSlots(normalizeSlots(response.data));
      } catch (err) {
        if (!cancelled) {
          setSlots([]);
          setError('We could not check availability for that day. Please pick another date or try again.');
        }
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }
    loadSlots();
    return () => {
      cancelled = true;
    };
  }, [selection.doctorId, selection.serviceId, selection.date, refreshKey]);

  const handleSelectionChange = useCallback(
    (doctorId: number | null, serviceId: number | null, date: string) => {
      setError('');
      setSelection((prev) =>
        prev.doctorId === doctorId && prev.serviceId === serviceId && prev.date === date
          ? prev
          : { doctorId, serviceId, date }
      );
    },
    []
  );

  const handleBooked = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  return (
    <div className="ds-stack-lg">
      <BookAppointmentHeader />
      <VerifyEmailBanner user={user} />
      {error && (
        <div className="ds-container">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
      {loading ? (
        <LoadingBlock label="Loading doctors and services..." />
      ) : (
        <BookAppointmentForm
          doctors={doctors}
          services={services}
          slots={slots}
          loadingSlots={loadingSlots}
          onSelectionChange={handleSelectionChange}
          onBooked={handleBooked}
        />
      )}
      <BookAppointmentInfo />
    </div>
  );
}

export default BookAppointmentPage;