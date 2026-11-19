import type { Appointment, VisitNote } from '../types';
import { Section, Grid, Card, CardBody, CardTitle, CardMeta, Badge, Stack, Cluster } from '../components/ui';
import { Icon } from '../components/icons';

interface VisitNoteFactsProps {
  appointment?: Appointment | null;
  note?: VisitNote | null;
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
  scheduled: 'primary',
  checked_in: 'soft',
  completed: 'success',
  cancelled: 'danger',
  no_show: 'danger',
};

function formatDateTime(value?: string | null): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function Paragraphs({ text, empty }: { text?: string | null; empty: string }) {
  const lines = (text || '').split('\n').filter((line) => line.trim() !== '');
  if (lines.length === 0) return <p className="ds-muted">{empty}</p>;
  return (
    <Stack gap="sm">
      {(Array.isArray(lines) ? lines : []).map((line, index) => (
        <p key={index}>{line}</p>
      ))}
    </Stack>
  );
}

function Fact({ icon, label, children }: { icon: 'calendar' | 'clock' | 'check' | 'info' | 'message' | 'edit' | 'book' | 'alert'; label: string; children: React.ReactNode }) {
  return (
    <Stack gap="xs">
      <Cluster gap="xs" align="center">
        <Icon name={icon} size={16} />
        <span className="ds-eyebrow">{label}</span>
      </Cluster>
      <div>{children}</div>
    </Stack>
  );
}

function VisitNoteFacts({ appointment = null, note = null }: VisitNoteFactsProps) {
  const status = appointment?.status || 'scheduled';

  return (
    <Section
      eyebrow="Visit record"
      title="Visit details"
      subtitle="Appointment information and the clinical note that Cedar Hollow Health keeps for this visit."
    >
      <Grid cols={2}>
        <Card>
          <CardBody>
            <CardTitle>Appointment</CardTitle>
            <CardMeta>Booking details for this visit</CardMeta>
            <Stack gap="md">
              <Fact icon="calendar" label="Starts">
                <p>{formatDateTime(appointment?.start_time)}</p>
              </Fact>
              <Fact icon="clock" label="Ends">
                <p>{formatDateTime(appointment?.end_time)}</p>
              </Fact>
              <Fact icon="check" label="Status">
                <Badge tone={STATUS_TONES[status] || 'neutral'}>{STATUS_LABELS[status] || status}</Badge>
              </Fact>
              <Fact icon="clock" label="Checked in at">
                <p>{formatDateTime(appointment?.checked_in_at)}</p>
              </Fact>
              <Fact icon="info" label="Reason for visit">
                <Paragraphs text={appointment?.reason} empty="The patient gave no reason when booking." />
              </Fact>
            </Stack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle>Clinical note</CardTitle>
            <CardMeta>
              {note ? `Last saved ${formatDateTime(note.updated_at)}` : 'Saving a note marks this appointment completed'}
            </CardMeta>
            <Stack gap="md">
              <Fact icon="message" label="Chief complaint">
                <Paragraphs text={note?.chief_complaint} empty="No note saved yet." />
              </Fact>
              <Fact icon="book" label="Diagnosis">
                <Paragraphs text={note?.diagnosis} empty="No diagnosis recorded." />
              </Fact>
              <Fact icon="edit" label="Doctor's notes">
                <Paragraphs text={note?.notes} empty="No notes recorded." />
              </Fact>
              <Fact icon="alert" label="Follow-up instructions">
                <Paragraphs text={note?.follow_up_instructions} empty="No follow-up instructions given." />
              </Fact>
            </Stack>
          </CardBody>
        </Card>
      </Grid>
    </Section>
  );
}

export default VisitNoteFacts;