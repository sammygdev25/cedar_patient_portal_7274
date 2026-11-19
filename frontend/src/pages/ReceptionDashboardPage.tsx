import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getAppointmentList, getUserList, getDoctorProfileList, getInvoiceList } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Alert, LoadingBlock } from '../components/ui';
import ReceptionDashboardHeader from '../components/ReceptionDashboardHeader';
import ReceptionDashboardStats from '../components/ReceptionDashboardStats';
import ReceptionDashboardRecent from '../components/ReceptionDashboardRecent';
import ReceptionDashboardActions from '../components/ReceptionDashboardActions';
import type { Appointment, DoctorProfile, Invoice, User } from '../types';

const POLL_INTERVAL_MS = 8000;

interface DisplayUser {
  first_name?: string;
  last_name?: string;
  email?: string;
}

function isToday(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toDateString() === new Date().toDateString();
}

function ReceptionDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [notice, setNotice] = useState<string>('');

  const loadAppointments = useCallback(async () => {
    try {
      const list = await getAppointmentList();
      setAppointments(Array.isArray(list) ? list : []);
      setError('');
    } catch (err) {
      setError('We could not load the clinic schedule. Please try again in a moment.');
    } finally { setLoading(false); }
  }, []);

  const loadReferenceData = useCallback(async () => {
    const [patientList, doctorList, invoiceList] = await Promise.all([
      getUserList().catch(() => [] as User[]),
      getDoctorProfileList().catch(() => [] as DoctorProfile[]),
      getInvoiceList().catch(() => [] as Invoice[]),
    ]);
    setPatients(Array.isArray(patientList) ? patientList.filter((p) => p.role === 'patient') : []);
    setDoctors(Array.isArray(doctorList) ? doctorList : []);
    setInvoices(Array.isArray(invoiceList) ? invoiceList : []);
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([loadAppointments(), loadReferenceData()]).finally(() => {
      if (active) setLoading(false);
    });
    const timer = window.setInterval(() => {
      loadAppointments();
    }, POLL_INTERVAL_MS);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [loadAppointments, loadReferenceData]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 2000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handleCheckIn = useCallback(
    async (id: number) => {
      setError('');
      try {
        await api.post(`/appointments/${id}/check-in/`);
        setNotice('Patient checked in');
        await loadAppointments();
      } catch (err) {
        setError('Check-in failed. The appointment may already be checked in or cancelled.');
      } finally { setLoading(false); }
    },
    [loadAppointments]
  );

  const stats = useMemo(() => {
    const todays = appointments.filter((a) => isToday(a.start_time) && a.status !== 'cancelled');
    return {
      todayCount: todays.length,
      checkedInCount: todays.filter((a) => a.status === 'checked_in').length,
      waitingCount: todays.filter((a) => a.status === 'scheduled').length,
      unpaidBillsCount: invoices.filter((inv) => inv.status === 'pending').length,
    };
  }, [appointments, invoices]);

  const recentAppointments = useMemo(
    () =>
      [...appointments]
        .filter((a) => a.status !== 'cancelled')
        .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
        .slice(0, 8),
    [appointments]
  );

  const display = user as unknown as DisplayUser | null;
  const userName = display
    ? [display.first_name, display.last_name].filter(Boolean).join(' ') || display.email || ''
    : '';

  if (loading) {
    return <LoadingBlock label="Loading the front desk" />;
  }

  return (
    <div className="ds-stack">
      <ReceptionDashboardHeader
        section="Page header"
        page="ReceptionDashboardPage"
        userName={userName}
        checkedInCount={stats.checkedInCount}
        todayCount={stats.todayCount}
        onBookAppointment={() => navigate('/staff/reception/appointments')}
        onCreateInvoice={() => navigate('/staff/reception/billing')}
      />
      {error && (
        <div className="ds-container">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
      {notice && (
        <div className="ds-container">
          <Alert tone="success">{notice}</Alert>
        </div>
      )}
      <ReceptionDashboardStats
        todayCount={stats.todayCount}
        checkedInCount={stats.checkedInCount}
        waitingCount={stats.waitingCount}
        unpaidBillsCount={stats.unpaidBillsCount}
        loading={loading}
      />
      <ReceptionDashboardRecent
        appointments={recentAppointments}
        patients={patients}
        doctors={doctors}
        onCheckIn={handleCheckIn}
      />
      <ReceptionDashboardActions
        section="Quick actions"
        page="ReceptionDashboardPage"
        waitingCheckIns={stats.waitingCount}
        unpaidBills={stats.unpaidBillsCount}
      />
    </div>
  );
}

export default ReceptionDashboardPage;