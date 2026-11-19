import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getUser,
  getAppointmentList,
  getVisitNoteList,
  getPrescriptionList,
  getServiceList,
} from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Button, Grid, LoadingBlock, Section } from '../components/ui';
import { Icon } from '../components/icons';
import PatientDetailMedia from '../components/PatientDetailMedia';
import PatientDetailFacts from '../components/PatientDetailFacts';
import PatientDetailRelated from '../components/PatientDetailRelated';
import VisitNoteCard from '../components/VisitNoteCard';
import PrescriptionCard from '../components/PrescriptionCard';
import type {
  Appointment,
  Prescription,
  Service,
  User,
  VisitNote,
} from '../types';

const OPEN_STATUSES = ['scheduled', 'checked_in'];

function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loading: authLoading } = useAuth();

  const [patient, setPatient] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [visitNotes, setVisitNotes] = useState<VisitNote[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const patientId = Number(id);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [person, allAppointments, allNotes, allPrescriptions, allServices] =
          await Promise.all([
            getUser(patientId),
            getAppointmentList(),
            getVisitNoteList(),
            getPrescriptionList(),
            getServiceList(),
          ]);
        if (cancelled) return;
        setPatient(person);
        setAppointments(
          (Array.isArray(allAppointments) ? allAppointments : []).filter((a: Appointment) => Number(a.patient) === patientId)
        );
        setVisitNotes(
          (Array.isArray(allNotes) ? allNotes : []).filter((n: VisitNote) => Number(n.patient) === patientId)
        );
        setPrescriptions(
          (Array.isArray(allPrescriptions) ? allPrescriptions : []).filter((p: Prescription) => Number(p.patient) === patientId)
        );
        setServices(allServices.slice(0, 6));
      } catch (err) {
        if (!cancelled) {
          setError(
            'We could not load this patient record. It may not belong to one of your booked patients.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [authLoading, patientId]);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return appointments
      .filter(
        (a) =>
          OPEN_STATUSES.includes(a.status) &&
          new Date(a.end_time).getTime() >= now
      )
      .sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
  }, [appointments]);

  const visitAppointment = useMemo(() => {
    const noted = new Set(visitNotes.map((n) => Number(n.appointment)));
    return (
      appointments.find(
        (a) => a.status === 'checked_in' && !noted.has(Number(a.id))
      ) ||
      upcoming.find((a) => !noted.has(Number(a.id))) ||
      null
    );
  }, [appointments, upcoming, visitNotes]);

  const handleStartVisit = () => {
    if (visitAppointment) {
      navigate(`/staff/doctor/appointments/${visitAppointment.id}/visit`);
    }
  };

  const patientName = patient
    ? `${patient.first_name} ${patient.last_name}`.trim() || patient.email
    : undefined;

  if (loading || authLoading) {
    return <LoadingBlock label="Loading patient record..." />;
  }

  if (error || !patient) {
    return (
      <Section narrow>
        <Alert tone="danger">{error || 'Patient not found.'}</Alert>
        <Button variant="secondary" to="/staff/doctor/patients">
          <Icon name="arrow-left" size={16} /> Back to patients
        </Button>
      </Section>
    );
  }

  return (
    <div className="ds-stack-lg">
      <PatientDetailMedia
        patient={patient}
        upcomingCount={upcoming.length}
        canStartVisit={visitAppointment !== null}
        onStartVisit={handleStartVisit}
      />
      <PatientDetailFacts
        patient={patient}
        appointments={appointments}
        visitNotes={visitNotes}
        prescriptions={prescriptions}
      />
      {visitNotes.length > 0 && (
        <Section eyebrow="Clinical history" title="Visit notes" tight>
          <Grid size="md">
            {(Array.isArray(visitNotes) ? visitNotes : []).map((note) => (
              <VisitNoteCard key={note.id} note={note} />
            ))}
          </Grid>
        </Section>
      )}
      {prescriptions.length > 0 && (
        <Section eyebrow="Medication" title="Prescriptions" tight>
          <Grid size="md">
            {(Array.isArray(prescriptions) ? prescriptions : []).map((prescription) => (
              <PrescriptionCard
                key={prescription.id}
                prescription={prescription}
                canOrder={false}
              />
            ))}
          </Grid>
        </Section>
      )}
      <PatientDetailRelated services={services} patientName={patientName} />
    </div>
  );
}

export default PatientDetailPage;