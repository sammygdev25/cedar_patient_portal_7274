import { Section, Grid, Card, CardBody, CardTitle, CardMeta, Badge, Alert, EmptyState, SkeletonCards, Button } from '../components/ui';
import { Icon } from '../components/icons';

interface LastReport {
  year: number;
  month: number;
  filename?: string;
  appointmentRows?: number;
  billRows?: number;
}

interface ReportsContentProps {
  loading?: boolean;
  error?: string;
  lastReport?: LastReport | null;
  onRetry?: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const APPOINTMENT_COLUMNS = [
  { name: 'Start time', note: 'Date and time of the visit' },
  { name: 'Patient', note: 'Name and email of the patient' },
  { name: 'Doctor', note: 'Treating clinician' },
  { name: 'Service', note: 'Consultation or procedure booked' },
  { name: 'Status', note: 'Scheduled, checked in, completed, cancelled or no show' },
];

const BILL_COLUMNS = [
  { name: 'Description', note: 'What the bill covers' },
  { name: 'Patient', note: 'Who the bill was issued to' },
  { name: 'Total amount', note: 'Billed amount in USD' },
  { name: 'Status', note: 'Pending, paid or void' },
  { name: 'Paid at', note: 'Date the Stripe payment was confirmed' },
];

function ReportsContent({ loading = false, error = '', lastReport = null, onRetry }: ReportsContentProps) {
  if (loading) {
    return (
      <Section title="Report contents" subtitle="Preparing the monthly summary for Cedar Hollow Health">
        <SkeletonCards count={2} />
      </Section>
    );
  }

  return (
    <Section
      eyebrow="What you get"
      title="Report contents"
      subtitle="Each monthly CSV combines the clinic's appointments and bills for the year and month you choose."
    >
      {error && (
        <Alert tone="danger">
          <div className="ds-between">
            <span>{error}</span>
            {onRetry && (
              <Button variant="secondary" onClick={onRetry}>
                <Icon name="refresh" size={16} /> Try again
              </Button>
            )}
          </div>
        </Alert>
      )}

      <Grid size="lg" cols={2}>
        <Card>
          <CardBody>
            <CardTitle>
              <Icon name="calendar" size={18} /> Appointments
            </CardTitle>
            <CardMeta>One row per appointment starting in the selected month</CardMeta>
            <div className="ds-table-wrap">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {APPOINTMENT_COLUMNS.map((col) => (
                    <tr key={col.name}>
                      <td>{col.name}</td>
                      <td className="ds-muted">{col.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <CardTitle>
              <Icon name="credit-card" size={18} /> Bills
            </CardTitle>
            <CardMeta>One row per bill created in the selected month</CardMeta>
            <div className="ds-table-wrap">
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Column</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {BILL_COLUMNS.map((col) => (
                    <tr key={col.name}>
                      <td>{col.name}</td>
                      <td className="ds-muted">{col.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </Grid>

      {lastReport ? (
        <Card>
          <CardBody>
            <CardTitle>
              <Icon name="download" size={18} /> Last report downloaded
            </CardTitle>
            <CardMeta>
              {MONTHS[lastReport.month - 1] || `Month ${lastReport.month}`} {lastReport.year}
            </CardMeta>
            <div className="ds-cluster">
              <Badge tone="success">Downloaded</Badge>
              {lastReport.filename && <span className="ds-small ds-muted">{lastReport.filename}</span>}
              {typeof lastReport.appointmentRows === 'number' && (
                <Badge tone="soft">{lastReport.appointmentRows} appointments</Badge>
              )}
              {typeof lastReport.billRows === 'number' && (
                <Badge tone="soft">{lastReport.billRows} bills</Badge>
              )}
            </div>
          </CardBody>
        </Card>
      ) : (
        <EmptyState
          icon="download"
          title="No report downloaded yet"
          text="Pick a year and month above to export the appointments and bills for that period as a CSV file."
        />
      )}
    </Section>
  );
}

export default ReportsContent;