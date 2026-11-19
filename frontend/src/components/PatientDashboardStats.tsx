import { Grid, Stat, SkeletonCards } from '../components/ui';
import type { Appointment, Invoice, Order } from '../types';

interface PatientDashboardStatsProps {
  appointments?: Appointment[];
  invoices?: Invoice[];
  orders?: Order[];
  loading?: boolean;
  section?: string;
  page?: string;
}

const CLOSED_ORDER_STATUSES = ['delivered', 'rejected', 'cancelled'];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatVisit(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'To be confirmed';
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${day}, ${time}`;
}

export default function PatientDashboardStats({
  appointments = [],
  invoices = [],
  orders = [],
  loading = false,
}: PatientDashboardStatsProps) {
  if (loading) {
    return <SkeletonCards count={4} />;
  }

  const now = Date.now();
  const appointmentList = Array.isArray(appointments) ? appointments : [];
  const invoiceList = Array.isArray(invoices) ? invoices : [];
  const orderList = Array.isArray(orders) ? orders : [];

  const upcoming = appointmentList
    .filter(
      (a) =>
        (a.status === 'scheduled' || a.status === 'checked_in') &&
        new Date(a.start_time).getTime() >= now
    )
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const nextVisit = upcoming.length > 0 ? formatVisit(upcoming[0].start_time) : 'None booked';

  const unpaid = invoiceList.filter((i) => i.status === 'pending');
  const unpaidTotal = unpaid.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
  const unpaidValue = unpaid.length > 0 ? currencyFormatter.format(unpaidTotal) : 'All settled';

  const activeOrders = orderList.filter((o) => !CLOSED_ORDER_STATUSES.includes(o.status));

  return (
    <Grid size="sm">
      <Stat
        icon="calendar"
        value={String(upcoming.length)}
        label={upcoming.length === 1 ? 'Upcoming appointment' : 'Upcoming appointments'}
      />
      <Stat icon="clock" value={nextVisit} label="Next visit at Cedar Hollow" />
      <Stat
        icon="credit-card"
        value={unpaidValue}
        label={unpaid.length > 0 ? `${unpaid.length} unpaid bill${unpaid.length === 1 ? '' : 's'}` : 'Outstanding bills'}
      />
      <Stat
        icon="package"
        value={String(activeOrders.length)}
        label={activeOrders.length === 1 ? 'Pharmacy order in progress' : 'Pharmacy orders in progress'}
      />
    </Grid>
  );
}
