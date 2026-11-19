import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAppointmentList, getPatientList } from '../api';
import { useAuth } from '../contexts/AuthContext';
import type { Appointment } from '../types';
import { Alert, LoadingBlock } from '../components/ui';
import DoctorDashboardHeader from '../components/DoctorDashboardHeader';
import DoctorDashboardStats from '../components/DoctorDashboardStats';
import DoctorDashboardRecent from '../components/DoctorDashboardRecent';
import DoctorDashboardActions from '../components/DoctorDashboardActions';

const POLL_INTERVAL_MS = 5000;

interface PatientLike {
  id: number;
  first_name?: string;
  last_name?: string;
  email?: string;
}

function isToday(value: string): boolean {
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function DoctorDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<PatientLike[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const mounted = useRef<boolean>(true);

  const loadAppointments = useCallback(async (manual: boolean) => {
    if (manual) setRefreshing(true);
    try {
      const list = await getAppointmentList();
      if (!mounted.current) return;
      setAppointments(Array.isArray(list) ? list : []);
      setLastUpdated(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' }));
      setError('');
    } catch (err) {
      if (!mounted.current) return;
      setError('We could not refresh your schedule. Retrying automatically.');
    } finally {
      if (mounted.current) {
        setLoading(false);
        if (manual) setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    loadAppointments(false);
    const timer = window.setInterval(() => {
      loadAppointments(false);
    }, POLL_INTERVAL_MS);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
    };
  }, [loadAppointments]);

  useEffect(() => {
    let active = true;
    getPatientList()
      .then((list) => {
        if (active) setPatients(Array.isArray(list) ? (list as unknown as PatientLike[]) : []);
      })
      .catch(() => {
        if (active) setPatients([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const patientNames = useMemo(() => {
    const map = new Map<number, string>();
    patients.forEach((p) => {
      const full = `${p.first_name || ''} ${p.last_name || ''}`.trim();
      map.set(p.id, full || p.email || `Patient #${p.id}`);
    });
    return map;
  }, [patients]);

  const getPatientName = useCallback(
    (appointment: Appointment): string => {
      const id = Number(appointment.patient);
      return patientNames.get(id) || `Patient #${id}`;
    },
    [patientNames]
  );

  const todayCount = useMemo(
    () => appointments.filter((a) => isToday(a.start_time) && a.status !== 'cancelled').length,
    [appointments]
  );
  const waitingCount = useMemo(
    () => appointments.filter((a) => a.status === 'checked_in').length,
    [appointments]
  );

  const doctorName = useMemo(() => {
    if (!user) return '';
    const u = user as unknown as { first_name?: string; last_name?: string; email?: string };
    const last = (u.last_name || '').trim();
    if (last) return `Dr. ${last}`;
    return (u.first_name || u.email || '').trim();
  }, [user]);

  const handleOpenVisit = (appointmentId: number) => {
    navigate(`/staff/doctor/appointments/${appointmentId}/visit`);
  };

  if (loading) {
    return <LoadingBlock label="Loading your schedule..." />;
  }

  return (
    <div className="ds-stack-lg">
      <DoctorDashboardHeader
        doctorName={doctorName}
        todayCount={todayCount}
        waitingCount={waitingCount}
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        onRefresh={() => loadAppointments(true)}
      />
      {error && (
        <div className="ds-container">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
      <DoctorDashboardStats appointments={appointments} loading={loading} />
      <DoctorDashboardRecent
        appointments={appointments}
        getPatientName={getPatientName}
        onOpenVisit={handleOpenVisit}
      />
      <DoctorDashboardActions onRefresh={() => loadAppointments(true)} />
    </div>
  );
}

export default DoctorDashboardPage;