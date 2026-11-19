import { useMemo, useState } from 'react';
import type { Prescription } from '../types';
import { Alert, Badge, Button, Card, CardBody, CardMeta, CardTitle, EmptyState, Stack } from './ui';
import { Icon } from './icons';
import CheckoutForm from './CheckoutForm';

interface PrescriptionOrderPanelProps {
  prescriptions: Prescription[];
  deliveryFee: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onOrder: (prescriptionId: number, details: any) => void | Promise<void>;
  submitting: boolean;
}

function formatIssued(value: unknown): string {
  if (!value) return '';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function PrescriptionOrderPanel({ prescriptions, deliveryFee, onOrder, submitting }: PrescriptionOrderPanelProps) {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const active = useMemo<Prescription[]>(
    () => (Array.isArray(prescriptions) ? prescriptions : []).filter((p) => p.is_active),
    [prescriptions]
  );

  const selected = active.find((p) => p.id === selectedId) || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = (details: any) => {
    if (!selected) return;
    void onOrder(selected.id, details);
  };

  if (active.length === 0) {
    return (
      <EmptyState
        icon="shield"
        title="No active prescriptions to order"
        text="When your Cedar Hollow doctor prescribes a medicine, it will appear here so you can request it from our in-house pharmacy."
      />
    );
  }

  return (
    <Stack gap="md">
      <Alert tone="neutral">
        Prescription orders are reviewed by the prescribing doctor. Your order is packed only after approval.
      </Alert>

      <div className="ds-grid ds-grid-sm">
        {active.map((prescription) => {
          const isSelected = prescription.id === selectedId;
          const issued = formatIssued(prescription.created_at);
          return (
            <Card key={prescription.id}>
              <CardBody>
                <CardTitle>{prescription.medicine_name}</CardTitle>
                <CardMeta>
                  {prescription.dosage}
                  {issued ? ` · Issued ${issued}` : ''}
                </CardMeta>
                {prescription.instructions ? (
                  <p className="ds-small ds-muted">{prescription.instructions}</p>
                ) : null}
                <div className="ds-between">
                  <Badge tone="soft">
                    {prescription.refills_allowed} refill{prescription.refills_allowed === 1 ? '' : 's'}
                  </Badge>
                  <Button
                    variant={isSelected ? 'secondary' : 'primary'}
                    onClick={() => setSelectedId(isSelected ? null : prescription.id)}
                    disabled={submitting}
                  >
                    <Icon name={isSelected ? 'close' : 'package'} size={16} />
                    {isSelected ? 'Cancel' : 'Order this medicine'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {selected ? (
        <Card>
          <CardBody>
            <CardTitle>Order {selected.medicine_name}</CardTitle>
            <CardMeta>Choose pickup or delivery and confirm your contact details.</CardMeta>
            <CheckoutForm deliveryFee={deliveryFee} onSubmit={handleSubmit} submitting={submitting} />
          </CardBody>
        </Card>
      ) : null}
    </Stack>
  );
}

export default PrescriptionOrderPanel;
