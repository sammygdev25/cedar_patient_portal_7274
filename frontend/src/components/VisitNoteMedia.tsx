import type { Appointment } from '../types';
import { Section, Split, Media, Stack, Cluster, CardMeta, Badge, Button } from '../components/ui';
import { Icon } from '../components/icons';

interface VisitNoteMediaProps {
  appointment: Appointment;
  patientName: string;
  serviceName?: string;
  hasNote: boolean;
  saving?: boolean;
  onSave: () => void;
}

type BadgeTone = 'neutral' | 'primary' | 'soft' | 'success' | 'danger';

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  checked_in: 'Checked in',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No show',
};

const STATUS_TONES: Record<string, BadgeTone> = {
  scheduled: 'soft',
  checked_in: 'primary',
  completed: 'success',
  cancelled: 'danger',
  no_show: 'danger',
};

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

function VisitNoteMedia({
  appointment,
  patientName,
  serviceName,
  hasNote,
  saving = false,
  onSave,
}: VisitNoteMediaProps) {
  const status = String(appointment.status);
  const statusLabel = STATUS_LABELS[status] || status;
  const statusTone = STATUS_TONES[status] || 'neutral';
  const when = formatVisitTime(appointment.start_time);

  return (
    <Section tight>
      <Split>
        <Media alt={patientName} ratio="square" badge={statusLabel} />
        <Stack gap="md">
          <span className="ds-eyebrow">Visit note · Cedar Hollow Health</span>
          <h1>{patientName}</h1>
          <CardMeta>
            <Cluster gap="sm">
              <Icon name="calendar" size={16} />
              <span>{when}</span>
              {serviceName ? (
                <>
                  <Icon name="tag" size={16} />
                  <span>{serviceName}</span>
                </>
              ) : null}
            </Cluster>
          </CardMeta>
          <Cluster gap="sm">
            <Badge tone={statusTone}>{statusLabel}</Badge>
            <Badge tone={hasNote ? 'success' : 'neutral'}>
              {hasNote ? 'Note on file' : 'No note yet'}
            </Badge>
          </Cluster>
          {appointment.reason ? (
            <p className="ds-lead">Reason for visit: {appointment.reason}</p>
          ) : (
            <p className="ds-muted">
              No reason was given when this appointment was booked. Saving the note marks the visit as completed.
            </p>
          )}
          <Cluster gap="sm">
            <Button variant="primary" size="lg" onClick={onSave} disabled={saving}>
              <Icon name="edit" size={18} />
              {saving ? 'Saving…' : hasNote ? 'Update visit note' : 'Save visit note'}
            </Button>
            <Button variant="secondary" size="lg" to="/staff/doctor">
              <Icon name="arrow-left" size={18} />
              Back to dashboard
            </Button>
          </Cluster>
        </Stack>
      </Split>
    </Section>
  );
}

export default VisitNoteMedia;