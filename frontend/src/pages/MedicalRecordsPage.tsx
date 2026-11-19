import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPrescriptionList, getVisitNoteList } from '../api';
import { useAuth } from '../contexts/AuthContext';
import MedicalRecordsHeader from '../components/MedicalRecordsHeader';
import MedicalRecordsContent from '../components/MedicalRecordsContent';
import type { Prescription, VisitNote } from '../types';

function readName(user: unknown): string {
  if (!user || typeof user !== 'object') return '';
  const record = user as Record<string, unknown>;
  const first = typeof record.first_name === 'string' ? record.first_name : '';
  const last = typeof record.last_name === 'string' ? record.last_name : '';
  const full = `${first} ${last}`.trim();
  if (full) return full;
  if (typeof record.username === 'string') return record.username;
  if (typeof record.email === 'string') return record.email;
  return '';
}

function MedicalRecordsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [visitNotes, setVisitNotes] = useState<VisitNote[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [notes, scripts] = await Promise.all([
        getVisitNoteList(),
        getPrescriptionList(),
      ]);
      setVisitNotes(Array.isArray(notes) ? notes : []);
      setPrescriptions(Array.isArray(scripts) ? scripts : []);
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'We could not load your medical records. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleOrder = (prescription: Prescription) => {
    navigate(`/portal/pharmacy?prescription=${prescription.id}`);
  };

  return (
    <div className="ds-stack-lg">
      <MedicalRecordsHeader
        patientName={readName(user)}
        noteCount={visitNotes.length}
        prescriptionCount={prescriptions.length}
        loading={loading}
        onRefresh={loadRecords}
      />
      <MedicalRecordsContent
        visitNotes={visitNotes}
        prescriptions={prescriptions}
        loading={loading}
        error={error}
        onOrder={handleOrder}
      />
    </div>
  );
}

export default MedicalRecordsPage;