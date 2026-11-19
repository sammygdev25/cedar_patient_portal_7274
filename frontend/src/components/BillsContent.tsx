import type { Invoice } from '../types';
import { Section, Grid, Stack, Stat, Alert, EmptyState, Button, SkeletonCards } from '../components/ui';
import InvoiceCard from './InvoiceCard';

interface BillsContentProps {
  invoices: Invoice[];
  loading: boolean;
  error?: string;
  payingId?: number | null;
  onPay: (invoice: Invoice) => void;
}

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

function BillsContent({ invoices, loading, error = '', payingId = null, onPay }: BillsContentProps) {
  const list: Invoice[] = Array.isArray(invoices) ? invoices : [];
  const pending = list.filter((inv) => inv.status === 'pending');
  const settled = list.filter((inv) => inv.status !== 'pending');
  const outstanding = pending.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
  const paidTotal = list
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);

  if (loading) {
    return (
      <Section title="Your bills" subtitle="Loading your statements from Cedar Hollow Health">
        <SkeletonCards count={3} />
      </Section>
    );
  }

  if (error) {
    return (
      <Section title="Your bills">
        <Alert tone="danger">{error}</Alert>
      </Section>
    );
  }

  if (list.length === 0) {
    return (
      <Section title="Your bills">
        <EmptyState
          icon="dollar"
          title="No bills yet"
          text="When the front desk issues a bill for a visit or service, it will appear here and you can pay it securely by card."
          action={<Button to="/portal/appointments" variant="secondary">View my appointments</Button>}
        />
      </Section>
    );
  }

  return (
    <Stack gap="lg">
      <Section tight title="Account summary" subtitle="Balances across all of your clinic bills">
        <Grid size="sm">
          <Stat value={money.format(outstanding)} label="Outstanding balance" icon="clock" />
          <Stat value={money.format(paidTotal)} label="Paid to date" icon="check" />
          <Stat value={String(pending.length)} label="Bills awaiting payment" icon="credit-card" />
        </Grid>
      </Section>

      <Section
        tight
        title="Awaiting payment"
        subtitle="Pay by card through our secure Stripe checkout. A bill is marked paid once the payment is confirmed."
      >
        {pending.length === 0 ? (
          <EmptyState icon="check" title="You are all caught up" text="There are no bills waiting for payment." />
        ) : (
          <Grid size="md">
            {pending.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onPay={() => onPay(invoice)}
                paying={payingId === invoice.id}
              />
            ))}
          </Grid>
        )}
      </Section>

      {settled.length > 0 && (
        <Section tight title="Payment history" subtitle="Paid and voided bills">
          <Grid size="md">
            {settled.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onPay={() => onPay(invoice)}
                paying={false}
              />
            ))}
          </Grid>
        </Section>
      )}
    </Stack>
  );
}

export default BillsContent;