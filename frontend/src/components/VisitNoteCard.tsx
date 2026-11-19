import type { VisitNote } from '../types';
import { Badge, Card, CardBody, CardMeta, CardTitle, Stack, Cluster } from '../components/ui';
import { Icon } from '../components/icons';

interface VisitNoteCardProps {
  note: VisitNote;
}

function formatVisitDate(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function VisitNoteCard({ note }: VisitNoteCardProps) {
  const visitDate = formatVisitDate(note.created_at);
  const wasEdited =
    Boolean(note.updated_at) &&
    Boolean(note.created_at) &&
    formatVisitDate(note.updated_at) !== formatVisitDate(note.created_at);

  return (
    <Card>
      <CardBody>
        <Stack gap="md">
          <Stack gap="xs">
            <Cluster gap="sm" justify="between">
              <CardMeta>
                <Icon name="calendar" size={16} /> {visitDate || 'Visit note'}
              </CardMeta>
              {wasEdited && <Badge tone="soft">Updated {formatVisitDate(note.updated_at)}</Badge>}
            </Cluster>
            <CardTitle>{note.chief_complaint}</CardTitle>
          </Stack>

          <Stack gap="xs">
            <span className="ds-eyebrow">Diagnosis</span>
            <p style={{ whiteSpace: 'pre-wrap' }}>{note.diagnosis}</p>
          </Stack>

          {note.notes && (
            <Stack gap="xs">
              <span className="ds-eyebrow">Doctor's notes</span>
              <p className="ds-muted" style={{ whiteSpace: 'pre-wrap' }}>
                {note.notes}
              </p>
            </Stack>
          )}

          {note.follow_up_instructions && (
            <Stack gap="xs">
              <Cluster gap="sm">
                <Icon name="info" size={16} />
                <span className="ds-eyebrow">Follow-up instructions</span>
              </Cluster>
              <p style={{ whiteSpace: 'pre-wrap' }}>{note.follow_up_instructions}</p>
            </Stack>
          )}
        </Stack>
      </CardBody>
    </Card>
  );
}

export default VisitNoteCard;