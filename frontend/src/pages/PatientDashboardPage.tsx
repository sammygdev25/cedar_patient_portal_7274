import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getAppointmentList,
  getDoctorProfileList,
  getInvoiceList,
  getOrderList,
} from '../api';
import type { Appointment, Invoice, Order } from '../types';
import { Alert } from '../components/ui';
import VerifyEmailBanner from '../components/VerifyEmailBanner';
import PatientDashboardHeader from '../components/PatientDashboardHeader';
import PatientDashboardStats from '../components/PatientDashboardStats';
import PatientDashboardRecent from '../components/PatientDashboardRecent';
import PatientDashboardActions from '../components/PatientDashboardActions';

const ACTIVE_STATUSES = ['scheduled', 'checked_in'];

function PatientDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [doctorNames, setDoctorNames] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError('');
      let failures = 0;
      const safe = async <T,>(request: Promise<T[]>): Promise<T[]> => {
        try {
          return await request;
        } catch {
          failures += 1;
          return [];
        }
      };

      const [appointmentList, invoiceList, orderList, doctorList] = await Promise.all([
        safe(getAppointmentList()),
        safe(getInvoiceList()),
        safe(getOrderList()),
        safe(getDoctorProfileList()),
      ]);

      if (cancelled) return;

      const names: Record<number, string> = {};
      (Array.isArray(doctorList) ? doctorList : []).forEach((profile) => {
        names[profile.user] = profile.full_name;
      });

      setAppointments(appointmentList);
      setInvoices(invoiceList);
      setOrders(orderList);
      setDoctorNames(names);
      if (failures >= 3) {
        setError('We could not load your portal activity. Please refresh the page or try again shortly.');
      }
      setLoading(false);
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const upcomingCount = useMemo(() => {
    const now = Date.now();
    return (Array.isArray(appointments) ? appointments : []).filter(
      (appointment) =>
        ACTIVE_STATUSES.includes(appointment.status) &&
        new Date(appointment.end_time).getTime() >= now
    ).length;
  }, [appointments]);

  const pendingBillCount = useMemo(
    () => (Array.isArray(invoices) ? invoices : []).filter((invoice) => invoice.status === 'pending').length,
    [invoices]
  );

  const doctorLabel = (doctorId: number): string => doctorNames[doctorId] || 'Your Cedar Hollow doctor';

  const rawFirstName: unknown = user?.first_name;
  const rawLastName: unknown = user?.last_name;
  const rawEmailVerified: unknown = user?.email_verified;
  const firstName: string = typeof rawFirstName === 'string' ? rawFirstName : '';
  const lastName: string = typeof rawLastName === 'string' ? rawLastName : '';
  const emailVerified: boolean | undefined =
    typeof rawEmailVerified === 'boolean' ? rawEmailVerified : undefined;

  return (
    <div className="ds-stack-lg">
      <VerifyEmailBanner user={user} />
      <PatientDashboardHeader
        firstName={firstName}
        lastName={lastName}
        emailVerified={emailVerified}
        upcomingCount={upcomingCount}
        onBookAppointment={() => navigate('/portal/book')}
      />
      {error && (
        <div className="ds-container">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
      <PatientDashboardStats
        appointments={appointments}
        invoices={invoices}
        orders={orders}
        loading={loading}
      />
      <PatientDashboardRecent
        appointments={appointments}
        invoices={invoices}
        loading={loading}
        doctorLabel={doctorLabel}
      />
      <PatientDashboardActions
        emailVerified={emailVerified}
        pendingBillCount={pendingBillCount}
      />
    </div>
  );
}

export default PatientDashboardPage;
