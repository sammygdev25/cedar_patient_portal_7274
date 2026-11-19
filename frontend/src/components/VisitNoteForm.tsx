import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Appointment, VisitNote } from '../types';
import { Alert, Badge, Button, Stack } from './ui';
import { Icon } from './icons';

export interface VisitNoteFormValues {
  appointment: number;
  patient: number;
  doctor: number;
  chief_complaint: string;
  diagnosis: string;
  notes: string;
  follow_up_instructions: string;
}

interface VisitNoteFormProps {
  appointment: Appointment;
  existingNote?: VisitNote | null;
  onSubmit: (values: VisitNoteFormValues) => void | Promise<void>;
  submitting?: boolean;
}

function formatVisitTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function VisitNoteForm({ appointment, existingNote, onSubmit, submitting = false }: VisitNoteFormProps) {
  const [chiefComplaint, setChiefComplaint] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [followUp, setFollowUp] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (existingNote) {
      setChiefComplaint(existingNote.chief_complaint || '');
      setDiagnosis(existingNote.diagnosis || '');
      setNotes(existingNote.notes || '');
      setFollowUp(existingNote.follow_up_instructions || '');
    } else {
      setChiefComplaint(appointment.reason ? String(appointment.reason).slice(0, 255) : '');
      setDiagnosis('');
      setNotes('');
      setFollowUp('');
    }
  }, [existingNote, appointment.id, appointment.reason]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    if (!chiefComplaint.trim() || !diagnosis.trim() || !notes.trim()) {
      setError('Chief complaint, diagnosis and clinical notes are required before saving the visit.');
      return;
    }
    setError('');
    try {
      await onSubmit({
        appointment: appointment.id,
        patient: appointment.patient,
        doctor: appointment.doctor,
        chief_complaint: chiefComplaint.trim(),
        diagnosis: diagnosis.trim(),
        notes: notes.trim(),
        follow_up_instructions: followUp.trim(),
      });
    } catch (err) {
      setError('We could not save this visit note. Please try again.');
    }
  };

  const visitTime = formatVisitTime(appointment.start_time);

  return (
    <form className="ds-form" onSubmit={handleSubmit}>
      <Stack gap="md">
        <div className="ds-between">
          <div className="ds-cluster">
            <Icon name="book" size={20} />
            <h3 className="ds-card-title">{existingNote ? 'Update visit note' : 'Record visit note'}</h3>
          </div>
          {visitTime && (
            <Badge tone="soft">
              {visitTime}
            </Badge>
          )}
        </div>

        <p className="ds-help">
          Saving this note marks the appointment as completed and adds it to the patient's medical record.
        </p>

        {error && <Alert tone="danger">{error}</Alert>}

        <div className="ds-field">
          <label className="ds-label" htmlFor="visit-chief-complaint">Chief complaint</label>
          <input
            id="visit-chief-complaint"
            className="input"
            type="text"
            maxLength={255}
            value={chiefComplaint}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChiefComplaint(e.target.value)}
            placeholder="e.g. Persistent cough for two weeks"
            required
          />
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor="visit-diagnosis">Diagnosis</label>
          <textarea
            id="visit-diagnosis"
            className="input"
            rows={3}
            value={diagnosis}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDiagnosis(e.target.value)}
            placeholder="Working or confirmed diagnosis"
            required
          />
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor="visit-notes">Clinical notes</label>
          <textarea
            id="visit-notes"
            className="input"
            rows={6}
            value={notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            placeholder="Examination findings, observations and treatment discussed"
            required
          />
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor="visit-follow-up">Follow-up instructions</label>
          <textarea
            id="visit-follow-up"
            className="input"
            rows={3}
            value={followUp}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFollowUp(e.target.value)}
            placeholder="Optional: rest, tests, or when to return to Cedar Hollow Health"
          />
          <span className="ds-help">Patients see these instructions in their portal.</span>
        </div>

        <div className="ds-form-actions">
          <Button type="submit" variant="primary" disabled={submitting}>
            <Icon name="check" size={16} />
            {submitting ? 'Saving...' : existingNote ? 'Update visit note' : 'Save and complete visit'}
          </Button>
        </div>
      </Stack>
    </form>
  );
}

export default VisitNoteForm;