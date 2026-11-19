import type { VisitNote, Prescription } from '../types';
import {
  Section,
  Grid,
  Stack,
  Cluster,
  Card,
  CardBody,
  CardTitle,
  CardMeta,
  CardFooter,
  Badge,
  Button,
  EmptyState,
  SkeletonCards,
  Alert,
} from '../components/ui';
import { Icon } from '../components/icons';

interface MedicalRecordsContentProps {
  visitNotes: VisitNote[];
  prescriptions: Prescription[];
  loading: boolean;
  error?: string;
  onOrder: (prescription: Prescription) => void;
}

function formatDay(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function MedicalRecordsContent({
  visitNotes,
  prescriptions,
  loading,
  error,
  onOrder,
}: MedicalRecordsContentProps) {
  const notes = Array.isArray(visitNotes) ? visitNotes : [];
  const scripts = Array.isArray(prescriptions) ? prescriptions : [];

  return (
    <>
      {error ? (
        <Section tight>
          <Alert tone="danger">{error}</Alert>
        </Section>
      ) : null}

      <Section
        eyebrow="Visit notes"
        title="Notes from your Cedar Hollow visits"
        subtitle="Each note is written by your doctor after an appointment and is visible only to you."
      >
        {loading ? (
          <SkeletonCards count={3} />
        ) : notes.length === 0 ? (
          <EmptyState
            icon="book"
            title="No visit notes yet"
            text="Once a doctor completes one of your appointments, the visit note will appear here."
            action={<Button variant="primary" to="/portal/book">Book an appointment</Button>}
          />
        ) : (
          <Grid size="md">
            {notes.map((note) => (
              <Card key={note.id}>
                <CardBody>
                  <Stack gap="sm">
                    <Cluster gap="xs" align="center">
                      <Icon name="calendar" size={16} />
                      <CardMeta>{formatDay(note.created_at)}</CardMeta>
                    </Cluster>
                    <CardTitle>{note.chief_complaint}</CardTitle>
                    <p className="ds-small">
                      <strong>Diagnosis:</strong> {note.diagnosis}
                    </p>
                    <p className="ds-muted ds-small">{note.notes}</p>
                  </Stack>
                </CardBody>
                {note.follow_up_instructions ? (
                  <CardFooter>
                    <Cluster gap="xs" align="center">
                      <Icon name="info" size={16} />
                      <span className="ds-small">Follow-up: {note.follow_up_instructions}</span>
                    </Cluster>
                  </CardFooter>
                ) : null}
              </Card>
            ))}
          </Grid>
        )}
      </Section>

      <Section
        eyebrow="Prescriptions"
        title="Your prescriptions"
        subtitle="Active prescriptions linked to a pharmacy product can be ordered straight from the Cedar Hollow pharmacy."
      >
        {loading ? (
          <SkeletonCards count={3} />
        ) : scripts.length === 0 ? (
          <EmptyState
            icon="package"
            title="No prescriptions on file"
            text="Prescriptions written by your doctor will be listed here, ready to order."
            action={<Button variant="secondary" to="/portal/pharmacy">Browse the pharmacy</Button>}
          />
        ) : (
          <Grid size="md">
            {scripts.map((rx) => {
              const canOrder = rx.is_active && rx.product !== null && rx.product !== undefined;
              return (
                <Card key={rx.id}>
                  <CardBody>
                    <Stack gap="sm">
                      <Cluster gap="xs" align="center" justify="between">
                        <CardTitle>{rx.medicine_name}</CardTitle>
                        <Badge tone={rx.is_active ? 'success' : 'neutral'}>
                          {rx.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </Cluster>
                      <CardMeta>
                        {rx.dosage} · Prescribed {formatDay(rx.created_at)}
                      </CardMeta>
                      <p className="ds-small">{rx.instructions}</p>
                      <p className="ds-muted ds-small">
                        Refills allowed: {rx.refills_allowed}
                      </p>
                    </Stack>
                  </CardBody>
                  <CardFooter>
                    <Button
                      variant="primary"
                      disabled={!canOrder}
                      onClick={() => onOrder(rx)}
                    >
                      <Icon name="cart" size={16} /> Order from pharmacy
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </Grid>
        )}
      </Section>
    </>
  );
}

export default MedicalRecordsContent;