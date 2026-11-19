import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getInvoiceList,
  createInvoice,
  updateInvoice,
  getUserList,
  getAppointmentList,
} from '../api';
import type { Invoice, User, Appointment } from '../types';
import BillingManagementHeader from '../components/BillingManagementHeader';
import BillingManagementContent from '../components/BillingManagementContent';
import InvoiceForm from '../components/InvoiceForm';
import { Alert, Card, CardBody, CardTitle, EmptyState } from '../components/ui';

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function BillingManagementPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [patients, setPatients] = useState<User[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [notice, setNotice] = useState<string>('');

  const isReceptionist = user?.role === 'receptionist';

  const loadInvoices = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getInvoiceList();
      setInvoices(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(errorMessage(err, 'Could not load bills. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadLookups = useCallback(async () => {
    try {
      const [users, appointments] = await Promise.all([getUserList(), getAppointmentList()]);
      const userList: User[] = Array.isArray(users) ? users : [];
      setPatients(userList.filter((u) => u.role === 'patient'));
      setAllAppointments(Array.isArray(appointments) ? appointments : []);
    } catch (err) {
      setError(errorMessage(err, 'Could not load the patient list.'));
    }
  }, []);

  useEffect(() => {
    if (!isReceptionist) {
      setLoading(false);
      return;
    }
    loadInvoices();
    loadLookups();
  }, [isReceptionist, loadInvoices, loadLookups]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 2000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const patientAppointments = useMemo(
    () =>
      selectedPatient === null
        ? []
        : allAppointments.filter((a) => Number(a.patient) === selectedPatient),
    [allAppointments, selectedPatient],
  );

  const pendingInvoices = useMemo(() => invoices.filter((i) => i.status === 'pending'), [invoices]);
  const outstandingTotal = useMemo(
    () => pendingInvoices.reduce((sum, i) => sum + Number(i.total_amount || 0), 0),
    [pendingInvoices],
  );

  const handlePatientChange = (value: unknown) => {
    const id = Number(value);
    setSelectedPatient(Number.isFinite(id) && id > 0 ? id : null);
  };

  const handleSubmit = async (values: unknown) => {
    setSubmitting(true);
    setError('');
    try {
      await createInvoice(values as Record<string, unknown>);
      await loadInvoices();
      setShowForm(false);
      setSelectedPatient(null);
      setNotice('Bill created');
    } catch (err) {
      setError(errorMessage(err, 'Could not create the bill. Check the details and try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoid = async (target: unknown) => {
    const id =
      typeof target === 'object' && target !== null
        ? Number((target as { id: number }).id)
        : Number(target);
    setError('');
    try {
      await updateInvoice(id, { status: 'void' });
      await loadInvoices();
      setNotice('Bill voided');
    } catch (err) {
      setError(errorMessage(err, 'Could not void the bill.'));
    }
  };

  if (!isReceptionist) {
    return (
      <EmptyState
        icon="shield"
        title="Reception access only"
        text="Billing management is available to Cedar Hollow Health reception staff. Patients can view and pay their bills from the patient portal."
      />
    );
  }

  return (
    <div className="ds-stack-lg">
      <BillingManagementHeader
        section="Page header"
        page="BillingManagementPage"
        pendingCount={pendingInvoices.length}
        outstandingTotal={outstandingTotal}
        onNewInvoice={() => setShowForm((open) => !open)}
        onRefresh={loadInvoices}
      />
      <BillingManagementContent
        invoices={invoices}
        loading={loading}
        onVoid={handleVoid}
      >
        {error && <Alert tone="danger">{error}</Alert>}
        {notice && <Alert tone="success">{notice}</Alert>}
        {showForm && (
          <Card>
            <CardBody>
              <CardTitle>New patient bill</CardTitle>
              <InvoiceForm
                patients={patients}
                appointments={patientAppointments}
                onPatientChange={handlePatientChange}
                onSubmit={handleSubmit}
                submitting={submitting}
              />
            </CardBody>
          </Card>
        )}
      </BillingManagementContent>
    </div>
  );
}

export default BillingManagementPage;