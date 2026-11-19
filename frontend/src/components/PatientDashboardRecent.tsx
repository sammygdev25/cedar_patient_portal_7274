import { Link } from 'react-router-dom';
import { Badge, Button, EmptyState, Grid, LoadingBlock, Price, Section, Stack } from '../components/ui';
import { Icon } from '../components/icons';
import type { Appointment, Invoice } from '../types';

interface PatientDashboardRecentProps {
  appointments: Appointment[];
  invoices: Invoice[];
  loading?: boolean;
  doctorLabel?: (doctorId: number) => string;
}

type Tone = 'neutral' | 'primary' | 'soft' | 'success' | 'danger';

const APPOINTMENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  scheduled: { label: 'Scheduled', tone: 'primary' },
  checked_in: { label: 'Checked in', tone: 'soft' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
  no_show: { label: 'No show', tone: 'danger' },
};

const INVOICE_STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: 'Pending', tone: 'primary' },
  paid: { label: 'Paid', tone: 'success' },
  void: { label: 'Void', tone: 'neutral' },
};

function formatWhen(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDay(value: string | null | undefined): string {
  if (!value) return 'No due date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function PatientDashboardRecent({ appointments, invoices, loading = false, doctorLabel }: PatientDashboardRecentProps) {
  const appointmentList = Array.isArray(appointments) ? appointments : [];
  const invoiceList = Array.isArray(invoices) ? invoices : [];

  const recentAppointments = [...appointmentList]
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    .slice(0, 4);
  const recentInvoices = invoiceList.slice(0, 4);

  return (
    <Section
      eyebrow="Recent activity"
      title="Your latest visits and bills"
      subtitle="A quick look at your most recent appointments with Cedar Hollow Health and any open bills."
    >
      {loading ? (
        <LoadingBlock label="Loading your recent activity" />
      ) : (
        <Grid size="lg" cols={2}>
          <Stack gap="sm">
            <h3>Appointments</h3>
            {recentAppointments.length === 0 ? (
              <EmptyState
                icon="calendar"
                title="No appointments yet"
                text="Book a visit with one of our doctors and it will show up here."
                action={<Button to="/portal/book">Book an appointment</Button>}
              />
            ) : (
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>When</th>
                      <th>Details</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentAppointments.map((appointment) => {
                      const status = APPOINTMENT_STATUS[String(appointment.status)] || {
                        label: String(appointment.status),
                        tone: 'neutral' as Tone,
                      };
                      return (
                        <tr key={appointment.id}>
                          <td>
                            <Link to="/portal/appointments">
                              <Icon name="clock" size={16} /> {formatWhen(appointment.start_time)}
                            </Link>
                          </td>
                          <td className="ds-muted">
                            {doctorLabel ? doctorLabel(appointment.doctor) : appointment.reason || 'Clinic visit'}
                          </td>
                          <td>
                            <Badge tone={status.tone}>{status.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {recentAppointments.length > 0 && (
              <Button to="/portal/appointments" variant="ghost">
                All appointments <Icon name="arrow-right" size={16} />
              </Button>
            )}
          </Stack>

          <Stack gap="sm">
            <h3>Bills</h3>
            {recentInvoices.length === 0 ? (
              <EmptyState
                icon="credit-card"
                title="No bills right now"
                text="Invoices from the clinic appear here and can be paid securely online."
                action={<Button to="/portal/bills" variant="secondary">Go to bills</Button>}
              />
            ) : (
              <div className="ds-table-wrap">
                <table className="ds-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentInvoices.map((invoice) => {
                      const status = INVOICE_STATUS[String(invoice.status)] || {
                        label: String(invoice.status),
                        tone: 'neutral' as Tone,
                      };
                      return (
                        <tr key={invoice.id}>
                          <td>
                            <Link to="/portal/bills">{invoice.description}</Link>
                            <div className="ds-small ds-muted">Due {formatDay(invoice.due_date)}</div>
                          </td>
                          <td>
                            <Price value={Number(invoice.total_amount)} />
                          </td>
                          <td>
                            <Badge tone={status.tone}>{status.label}</Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {recentInvoices.length > 0 && (
              <Button to="/portal/bills" variant="ghost">
                All bills <Icon name="arrow-right" size={16} />
              </Button>
            )}
          </Stack>
        </Grid>
      )}
    </Section>
  );
}

export default PatientDashboardRecent;