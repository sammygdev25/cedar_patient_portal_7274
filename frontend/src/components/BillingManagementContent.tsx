import type { ComponentProps, ReactNode } from 'react';
import { Section, Grid, Stack, Card, CardBody, Stat, SkeletonCards, EmptyState } from '../components/ui';
import { Icon } from '../components/icons';
import InvoiceTable from './InvoiceTable';
import type { Invoice } from '../types';

interface BillingManagementContentProps {
  invoices?: Invoice[];
  loading?: boolean;
  onVoid: ComponentProps<typeof InvoiceTable>['onVoid'];
  children?: ReactNode;
}

function BillingManagementContent({ invoices = [], loading = false, onVoid, children }: BillingManagementContentProps) {
  const list = Array.isArray(invoices) ? invoices : [];
  const pending = list.filter((inv) => inv.status === 'pending');
  const paid = list.filter((inv) => inv.status === 'paid');
  const outstanding = pending.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
  const collected = paid.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0);
  const money = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  return (
    <>
      <Section
        eyebrow="Front desk"
        title="Billing overview"
        subtitle="Bills turn to paid only once the Stripe payment is confirmed, so this view always matches what the clinic has actually collected."
      >
        {loading ? (
          <SkeletonCards count={3} />
        ) : (
          <Grid size="sm">
            <Stat value={pending.length} label="Bills awaiting payment" icon="clock" />
            <Stat value={money(outstanding)} label="Outstanding balance" icon="dollar" />
            <Stat value={money(collected)} label="Collected by card" icon="check" />
          </Grid>
        )}
      </Section>

      {children && (
        <Section
          title="Create a bill"
          subtitle="Choose a patient, optionally link one of their visits, and set the amount they will pay online from their portal."
          tight
        >
          <Card>
            <CardBody>{children}</CardBody>
          </Card>
        </Section>
      )}

      <Section
        title="All patient bills"
        subtitle="Newest first. Void a pending bill if it was raised in error; paid bills cannot be changed."
        tight
      >
        {loading ? (
          <SkeletonCards count={4} />
        ) : list.length === 0 ? (
          <EmptyState
            icon="credit-card"
            title="No bills have been created yet"
            text="Once you bill a patient for a visit, it will appear here and in their portal under Bills."
          />
        ) : (
          <Stack gap="sm">
            <p className="ds-small ds-muted">
              <Icon name="info" size={14} /> Showing {list.length} {list.length === 1 ? 'bill' : 'bills'} across all patients.
            </p>
            <InvoiceTable invoices={list} onVoid={onVoid} />
          </Stack>
        )}
      </Section>
    </>
  );
}

export default BillingManagementContent;