import type { Invoice } from '../types';
import StatusBadge from './StatusBadge';
import { Button, EmptyState } from './ui';
import { Icon } from './icons';

interface InvoiceTableProps {
  invoices: Invoice[];
  onVoid: (id: number) => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});

function formatAmount(amount: unknown): string {
  const value = Number(amount);
  return Number.isFinite(value) ? currencyFormatter.format(value) : '—';
}

function formatDay(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function InvoiceTable({ invoices, onVoid }: InvoiceTableProps) {
  const rows: Invoice[] = Array.isArray(invoices) ? invoices : [];

  if (rows.length === 0) {
    return (
      <EmptyState
        icon="dollar"
        title="No bills yet"
        text="Bills you create for Cedar Hollow Health patients will appear here."
      />
    );
  }

  const handleVoid = (invoice: Invoice) => {
    const confirmed = window.confirm(
      `Void "${invoice.description}"? The patient will no longer be able to pay it.`
    );
    if (confirmed) {
      onVoid(invoice.id);
    }
  };

  return (
    <div className="ds-table-wrap">
      <table className="ds-table">
        <thead>
          <tr>
            <th>Bill</th>
            <th>Patient</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Due</th>
            <th>Paid</th>
            <th>Issued</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {rows.map((invoice) => (
            <tr key={invoice.id}>
              <td>
                <strong>{invoice.description}</strong>
                <div className="ds-small ds-muted">Bill #{invoice.id}</div>
              </td>
              <td>Patient #{invoice.user}</td>
              <td>{formatAmount(invoice.total_amount)}</td>
              <td>
                <StatusBadge status={invoice.status} />
              </td>
              <td>{formatDay(invoice.due_date)}</td>
              <td>{formatDay(invoice.paid_at)}</td>
              <td>{formatDay(invoice.created_at)}</td>
              <td>
                {invoice.status === 'pending' && (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={() => handleVoid(invoice)}
                  >
                    <Icon name="close" size={16} />
                    Void
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InvoiceTable;