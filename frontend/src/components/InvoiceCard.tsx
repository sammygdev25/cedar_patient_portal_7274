import type { Invoice } from '../types';
import { Badge, Button, Card, CardBody, CardFooter, CardMeta, CardTitle, Price } from './ui';
import { Icon } from './icons';
import StatusBadge from './StatusBadge';

interface InvoiceCardProps {
  invoice: Invoice;
  onPay: (id: number) => void;
  paying: boolean;
}

function formatDay(value: string | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function InvoiceCard({ invoice, onPay, paying }: InvoiceCardProps) {
  const isPending = invoice.status === 'pending';
  const dueLabel = formatDay(invoice.due_date);
  const paidLabel = formatDay(invoice.paid_at);
  const issuedLabel = formatDay(invoice.created_at);

  const isOverdue =
    isPending && !!invoice.due_date && new Date(invoice.due_date).getTime() < Date.now();

  return (
    <Card>
      <CardBody>
        <div className="ds-between">
          <CardTitle>{invoice.description}</CardTitle>
          <StatusBadge status={invoice.status} />
        </div>

        <div className="ds-stack">
          <Price value={Number(invoice.total_amount)} />

          <CardMeta>
            <span className="ds-cluster">
              <Icon name="calendar" size={16} />
              <span>Issued {issuedLabel || 'recently'}</span>
            </span>
          </CardMeta>

          {isPending && dueLabel && (
            <CardMeta>
              <span className="ds-cluster">
                <Icon name="clock" size={16} />
                <span>Due {dueLabel}</span>
                {isOverdue && <Badge tone="danger">Overdue</Badge>}
              </span>
            </CardMeta>
          )}

          {invoice.status === 'paid' && paidLabel && (
            <CardMeta>
              <span className="ds-cluster">
                <Icon name="check" size={16} />
                <span>Paid on {paidLabel}</span>
              </span>
            </CardMeta>
          )}

          {invoice.status === 'void' && (
            <CardMeta>
              <span className="ds-cluster">
                <Icon name="info" size={16} />
                <span>This bill was voided by Cedar Hollow Health and needs no payment.</span>
              </span>
            </CardMeta>
          )}
        </div>
      </CardBody>

      {isPending && (
        <CardFooter>
          <Button
            variant="primary"
            disabled={paying}
            onClick={() => onPay(invoice.id)}
          >
            <Icon name="credit-card" size={16} />
            {paying ? 'Opening secure checkout...' : 'Pay now'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}