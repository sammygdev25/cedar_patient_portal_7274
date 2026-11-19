import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  getAppointment,
  getVisitNoteList,
  getServiceList,
  getProductList,
  createVisitNote,
  updateVisitNote,
  createPrescription,
} from '../api';
import { useAuth } from '../contexts/AuthContext';
import type { Appointment, Product, Service, VisitNote } from '../types';
import { Alert, Button, EmptyState, LoadingBlock, Section, Stack } from '../components/ui';
import VisitNoteMedia from '../components/VisitNoteMedia';
import VisitNoteFacts from '../components/VisitNoteFacts';
import VisitNoteRelated from '../components/VisitNoteRelated';
import VisitNoteForm from '../components/VisitNoteForm';
import PrescriptionForm from '../components/PrescriptionForm';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Payload = Record<string, any>;

interface Feedback {
  tone: 'success' | 'danger';
  text: string;
}

function VisitNotePage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const appointmentId = Number(id);

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [note, setNote] = useState<VisitNote | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [savingNote, setSavingNote] = useState<boolean>(false);
  const [savingRx, setSavingRx] = useState<boolean>(false);
  const [noteFeedback, setNoteFeedback] = useState<Feedback | null>(null);
  const [rxFeedback, setRxFeedback] = useState<Feedback | null>(null);
  const [rxCount, setRxCount] = useState<number>(0);

  const role = (user as unknown as { role?: string } | null)?.role;

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [appt, notes, serviceList, productList] = await Promise.all([
        getAppointment(appointmentId),
        getVisitNoteList(),
        getServiceList(),
        getProductList(),
      ]);
      setAppointment(appt);
      const existing = (Array.isArray(notes) ? notes : []).find(
        (n: VisitNote) => Number(n.appointment) === appointmentId
      );
      setNote(existing || null);
      setServices(Array.isArray(serviceList) ? serviceList : []);
      setProducts(Array.isArray(productList) ? productList : []);
    } catch (err) {
      setError('This appointment could not be loaded. It may not be booked with you.');
    } finally {
      setLoading(false);
    }
  }, [appointmentId]);

  useEffect(() => {
    if (!authLoading && user && Number.isFinite(appointmentId)) {
      load();
    }
  }, [authLoading, user, appointmentId, load]);

  const handleNoteSubmit = async (values: Payload) => {
    if (!appointment) return;
    setSavingNote(true);
    setNoteFeedback(null);
    try {
      let saved: VisitNote;
      if (note) {
        saved = await updateVisitNote(note.id, values as Parameters<typeof updateVisitNote>[1]);
      } else {
        saved = await createVisitNote({
          ...values,
          appointment: appointment.id,
          patient: appointment.patient,
          doctor: appointment.doctor,
        } as unknown as Parameters<typeof createVisitNote>[0]);
      }
      setNote(saved);
      const refreshed = await getAppointment(appointmentId);
      setAppointment(refreshed);
      setNoteFeedback({ tone: 'success', text: 'Visit note saved. The appointment is marked completed.' });
    } catch (err) {
      setNoteFeedback({ tone: 'danger', text: 'The visit note could not be saved. Please check the fields and try again.' });
    } finally {
      setSavingNote(false);
    }
  };

  const handlePrescriptionSubmit = async (values: Payload) => {
    if (!appointment) return;
    setSavingRx(true);
    setRxFeedback(null);
    try {
      await createPrescription({
        ...values,
        appointment: appointment.id,
        patient: appointment.patient,
        doctor: appointment.doctor,
      } as unknown as Parameters<typeof createPrescription>[0]);
      setRxCount((c) => c + 1);
      setRxFeedback({ tone: 'success', text: 'Prescription added. The patient can now order it from the pharmacy.' });
    } catch (err) {
      setRxFeedback({ tone: 'danger', text: 'The prescription could not be saved. Please try again.' });
    } finally {
      setSavingRx(false);
    }
  };

  const scrollToForm = () => {
    const el = document.getElementById('visit-note-form');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (authLoading || loading) {
    return <LoadingBlock label="Loading appointment..." />;
  }

  if (role && role !== 'doctor') {
    return (
      <Section narrow>
        <EmptyState
          icon="shield"
          title="Doctors only"
          text="Visit notes and prescriptions are written by the doctor booked for the appointment."
          action={<Button to="/" variant="secondary">Back to home</Button>}
        />
      </Section>
    );
  }

  if (error || !appointment) {
    return (
      <Section narrow>
        <Alert tone="danger">{error || 'Appointment not found.'}</Alert>
        <Stack gap="md">
          <Button to="/staff/doctor" variant="secondary">Back to my schedule</Button>
        </Stack>
      </Section>
    );
  }

  const apptRecord = appointment as unknown as Record<string, unknown>;
  const patientName =
    (typeof apptRecord.patient_name === 'string' && apptRecord.patient_name) ||
    `Patient #${appointment.patient}`;
  const serviceName =
    typeof apptRecord.service_name === 'string' && apptRecord.service_name
      ? apptRecord.service_name
      : services.find((s) => s.id === appointment.service)?.name;

  return (
    <div className="ds-stack-lg">
      <VisitNoteMedia
        appointment={appointment}
        patientName={patientName}
        serviceName={serviceName}
        hasNote={Boolean(note)}
        saving={savingNote}
        onSave={scrollToForm}
      />

      <VisitNoteFacts appointment={appointment} note={note} />

      <Section
        id="visit-note-form"
        eyebrow="Documentation"
        title={note ? 'Update visit note' : 'Write visit note'}
        subtitle="Saving the note marks this appointment as completed."
      >
        {noteFeedback && <Alert tone={noteFeedback.tone}>{noteFeedback.text}</Alert>}
        <VisitNoteForm
          appointment={appointment}
          existingNote={note}
          onSubmit={handleNoteSubmit}
          submitting={savingNote}
        />
      </Section>

      <Section
        eyebrow="Pharmacy"
        title="Prescribe medicine"
        subtitle={
          rxCount > 0
            ? `${rxCount} prescription${rxCount === 1 ? '' : 's'} added during this visit.`
            : 'Link a pharmacy product so the patient can order it directly.'
        }
      >
        {rxFeedback && <Alert tone={rxFeedback.tone}>{rxFeedback.text}</Alert>}
        <PrescriptionForm
          appointment={appointment}
          products={products}
          onSubmit={handlePrescriptionSubmit}
          submitting={savingRx}
        />
      </Section>

      <VisitNoteRelated
        services={services}
        currentServiceId={appointment.service ?? null}
      />
    </div>
  );
}

export default VisitNotePage;