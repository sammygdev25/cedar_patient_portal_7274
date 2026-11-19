import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { Alert, Badge, Button, Price, Stack } from './ui';
import { Icon } from './icons';
import { useAuth } from '../contexts/AuthContext';

type FulfillmentMethod = 'pickup' | 'delivery';

interface CheckoutDetails {
  fulfillment_method: FulfillmentMethod;
  delivery_address: string;
  phone: string;
  notes: string;
}

interface CheckoutFormProps {
  deliveryFee: number;
  onSubmit: (details: CheckoutDetails) => void | Promise<void>;
  submitting: boolean;
}

interface FormErrors {
  delivery_address?: string;
  phone?: string;
}

const PHONE_PATTERN = /^[0-9+()\-.\s]{7,30}$/;

function CheckoutForm({ deliveryFee, onSubmit, submitting }: CheckoutFormProps) {
  const { user } = useAuth();
  const profilePhone = user ? String((user as unknown as Record<string, unknown>).phone ?? '') : '';

  const [method, setMethod] = useState<FulfillmentMethod>('pickup');
  const [address, setAddress] = useState<string>('');
  const [phone, setPhone] = useState<string>(profilePhone);
  const [notes, setNotes] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});

  const isDelivery = method === 'delivery';
  const fee = Number.isFinite(Number(deliveryFee)) ? Number(deliveryFee) : 0;

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    const trimmedPhone = phone.trim();
    if (isDelivery && address.trim().length < 8) {
      next.delivery_address = 'Enter the full street address where we should deliver your medicines.';
    }
    if (isDelivery && !trimmedPhone) {
      next.phone = 'A phone number is required so the courier can reach you.';
    } else if (trimmedPhone && !PHONE_PATTERN.test(trimmedPhone)) {
      next.phone = 'Enter a valid phone number.';
    }
    return next;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSubmit({
      fulfillment_method: method,
      delivery_address: isDelivery ? address.trim() : '',
      phone: phone.trim(),
      notes: notes.trim(),
    });
  };

  const choose = (value: FulfillmentMethod) => {
    setMethod(value);
    setErrors({});
  };

  const renderOption = (value: FulfillmentMethod, title: string, text: string, icon: 'map-pin' | 'truck') => {
    const selected = method === value;
    return (
      <label
        key={value}
        className="card"
        style={{
          cursor: 'pointer',
          borderColor: selected ? 'var(--color-primary)' : 'var(--color-border)',
          padding: 'var(--space-md)',
        }}
      >
        <div className="ds-between">
          <div className="ds-cluster">
            <input
              type="radio"
              name="fulfillment_method"
              value={value}
              checked={selected}
              onChange={() => choose(value)}
              disabled={submitting}
            />
            <Icon name={icon} size={20} />
            <strong>{title}</strong>
          </div>
          {value === 'delivery' ? (
            fee > 0 ? <Price value={fee} /> : <Badge tone="success">Free</Badge>
          ) : (
            <Badge tone="success">Free</Badge>
          )}
        </div>
        <p className="ds-small ds-muted">{text}</p>
      </label>
    );
  };

  return (
    <form className="ds-form" onSubmit={handleSubmit} noValidate aria-label="Pharmacy checkout">
      <Stack gap="md">
        <div>
          <h2 className="ds-card-title">How would you like to receive your order?</h2>
          <p className="ds-small ds-muted">
            Collect at the Cedar Hollow Health pharmacy desk or have it brought to your door.
          </p>
        </div>

        <div className="ds-grid ds-grid-2">
          {renderOption(
            'pickup',
            'Pickup at the clinic',
            'Ready for collection at the reception pharmacy desk once your order is packed.',
            'map-pin'
          )}
          {renderOption(
            'delivery',
            'Home delivery',
            'A courier brings your packed order to your address.',
            'truck'
          )}
        </div>

        {isDelivery && (
          <div className="ds-field">
            <label className="ds-label" htmlFor="checkout-address">Delivery address</label>
            <textarea
              id="checkout-address"
              className="input"
              rows={3}
              value={address}
              placeholder="Street, number, apartment, city, postal code"
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAddress(e.target.value)}
              disabled={submitting}
              aria-invalid={Boolean(errors.delivery_address)}
            />
            {errors.delivery_address && (
              <span className="ds-help" style={{ color: 'var(--color-danger)' }}>
                {errors.delivery_address}
              </span>
            )}
          </div>
        )}

        <div className="ds-field">
          <label className="ds-label" htmlFor="checkout-phone">
            Contact phone{isDelivery ? '' : ' (optional)'}
          </label>
          <input
            id="checkout-phone"
            className="input"
            type="tel"
            value={phone}
            placeholder="+1 555 010 2030"
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
            disabled={submitting}
            aria-invalid={Boolean(errors.phone)}
          />
          {errors.phone ? (
            <span className="ds-help" style={{ color: 'var(--color-danger)' }}>{errors.phone}</span>
          ) : (
            <span className="ds-help">We call only if there is a question about your order.</span>
          )}
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor="checkout-notes">Notes for the pharmacy (optional)</label>
          <textarea
            id="checkout-notes"
            className="input"
            rows={3}
            value={notes}
            placeholder="Delivery instructions, preferred pickup time, packaging requests"
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
            disabled={submitting}
          />
        </div>

        {Object.keys(errors).length > 0 && (
          <Alert tone="danger">Please fix the highlighted fields before continuing.</Alert>
        )}

        <div className="ds-form-actions">
          <Button type="submit" variant="primary" size="lg" disabled={submitting}>
            {submitting ? 'Placing order...' : 'Place order and continue to payment'}
          </Button>
        </div>
        <p className="ds-small ds-muted">
          You will pay securely with Stripe on the next step. Your order is only sent to the pharmacy once payment succeeds.
        </p>
      </Stack>
    </form>
  );
}

export default CheckoutForm;