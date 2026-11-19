import { Section, Stat, Button, Alert } from '../components/ui';
import { Icon } from '../components/icons';

interface OrderHistoryDetailsProps {
  section?: string;
  page?: string;
  name?: string;
  email?: string;
  phone?: string;
  orderCount?: number;
  openOrderCount?: number;
}

function OrderHistoryDetails({
  name = '',
  email = '',
  phone = '',
  orderCount = 0,
  openOrderCount = 0,
}: OrderHistoryDetailsProps) {
  const hasPhone = phone.trim().length > 0;

  return (
    <Section
      narrow
      eyebrow="Account details"
      title="Where we send your orders"
      subtitle="Cedar Hollow Pharmacy uses these details to confirm pickups, reach you about deliveries and email your receipts."
    >
      <div className="ds-grid ds-grid-2">
        <Stat value={String(orderCount)} label="Pharmacy orders" icon="package" />
        <Stat value={String(openOrderCount)} label="Orders in progress" icon="truck" />
      </div>

      <form className="ds-form" onSubmit={(e: React.FormEvent<HTMLFormElement>) => e.preventDefault()}>
        <div className="ds-field">
          <label className="ds-label" htmlFor="order-account-name">
            <Icon name="user" size={16} /> Name
          </label>
          <input
            id="order-account-name"
            className="input"
            type="text"
            value={name}
            placeholder="Your name"
            readOnly
          />
        </div>

        <div className="ds-form-row">
          <div className="ds-field">
            <label className="ds-label" htmlFor="order-account-email">
              <Icon name="mail" size={16} /> Email
            </label>
            <input
              id="order-account-email"
              className="input"
              type="email"
              value={email}
              placeholder="you@example.com"
              readOnly
            />
          </div>
          <div className="ds-field">
            <label className="ds-label" htmlFor="order-account-phone">
              <Icon name="phone" size={16} /> Phone
            </label>
            <input
              id="order-account-phone"
              className="input"
              type="tel"
              value={phone}
              placeholder="No phone number on file"
              readOnly
            />
          </div>
        </div>

        {!hasPhone && (
          <Alert tone="neutral">
            Add a phone number to your profile so our pharmacy team can reach you about home deliveries.
          </Alert>
        )}

        <p className="ds-help">
          Prescription orders show only the medicine name to our reception team. Your doctor's notes stay private.
        </p>

        <div className="ds-form-actions">
          <Button to="/profile" variant="secondary">
            <Icon name="edit" size={16} /> Update my details
          </Button>
          <Button to="/portal/pharmacy" variant="ghost">
            Back to the pharmacy <Icon name="arrow-right" size={16} />
          </Button>
        </div>
      </form>
    </Section>
  );
}

export default OrderHistoryDetails;