import type { Prescription } from '../types';
import { Badge, Button, Card, CardBody, CardFooter, CardMeta, CardTitle } from '../components/ui';
import { Icon } from '../components/icons';

interface PrescriptionCardProps {
  prescription: Prescription;
  canOrder?: boolean;
  onOrder?: (prescription: Prescription) => void;
}

function formatPrescribed(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function PrescriptionCard({ prescription, canOrder = false, onOrder }: PrescriptionCardProps) {
  const prescribedOn = formatPrescribed(prescription.created_at);
  const refills = prescription.refills_allowed;
  const orderable = canOrder && prescription.is_active && prescription.product !== null && Boolean(onOrder);

  const handleOrder = () => {
    if (onOrder) onOrder(prescription);
  };

  return (
    <Card>
      <CardBody>
        <div className="ds-between">
          <CardTitle>{prescription.medicine_name}</CardTitle>
          <Badge tone={prescription.is_active ? 'success' : 'neutral'}>
            {prescription.is_active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <CardMeta>
          <span className="ds-cluster">
            <Icon name="package" size={16} />
            Dosage: {prescription.dosage}
          </span>
        </CardMeta>

        <div className="ds-stack">
          <p>{prescription.instructions}</p>
          {prescription.notes ? (
            <p className="ds-muted ds-small">Doctor's note: {prescription.notes}</p>
          ) : null}
        </div>
      </CardBody>

      <CardFooter>
        <div className="ds-between">
          <div className="ds-stack">
            <span className="ds-small ds-muted">
              {refills === 0
                ? 'No refills'
                : `${refills} ${refills === 1 ? 'refill' : 'refills'} allowed`}
            </span>
            {prescribedOn ? (
              <span className="ds-small ds-muted">
                <Icon name="calendar" size={14} /> Prescribed {prescribedOn}
              </span>
            ) : null}
          </div>

          {orderable ? (
            <Button variant="primary" onClick={handleOrder}>
              <Icon name="cart" size={16} /> Order from pharmacy
            </Button>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
}

export default PrescriptionCard;