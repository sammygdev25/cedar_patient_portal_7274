import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import type { Appointment } from '../types';
import SlotPicker from './SlotPicker';
import { Alert, Badge, Button, Stack } from './ui';
import { Icon } from './icons';

type SlotList = ComponentProps<typeof SlotPicker>['slots'];

interface RescheduleModalProps {
  appointment: Appointment;
  slots: SlotList;
  onDateChange: (date: string) => void;
  onConfirm: (slot: string) => void | Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

function toDateInput(value: Date): string {
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${value.getFullYear()}-${month}-${day}`;
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const date = d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${date} at ${time}`;
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(5, 12, 10, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 'var(--space-md)',
  zIndex: 1000,
};

const dialogStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '560px',
  maxHeight: '90vh',
  overflowY: 'auto',
};

function RescheduleModal({
  appointment,
  slots,
  onDateChange,
  onConfirm,
  onClose,
  loading = false,
}: RescheduleModalProps) {
  const initialDate = toDateInput(
    Number.isNaN(new Date(appointment.start_time).getTime())
      ? new Date()
      : new Date(appointment.start_time)
  );
  const today = toDateInput(new Date());
  const [date, setDate] = useState<string>(initialDate < today ? today : initialDate);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    onDateChange(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setDate(next);
    setSelectedSlot('');
    setError('');
    if (next) onDateChange(next);
  };

  const handleConfirm = async () => {
    if (!selectedSlot) {
      setError('Choose a new time slot before confirming.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await onConfirm(selectedSlot);
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : '';
      setError(message || 'That slot could not be booked. Please pick another time.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={overlayStyle}
      role="presentation"
      onClick={(e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="ds-card"
        style={dialogStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reschedule-title"
      >
        <div className="ds-card-body">
          <Stack gap="md">
            <div className="ds-between">
              <div>
                <p className="ds-eyebrow">Cedar Hollow Health</p>
                <h2 id="reschedule-title" className="ds-card-title">
                  Reschedule appointment
                </h2>
              </div>
              <Button variant="ghost" onClick={onClose} aria-label="Close reschedule dialog">
                <Icon name="close" />
              </Button>
            </div>

            <div className="ds-cluster">
              <Icon name="calendar" />
              <span className="ds-small ds-muted">Currently booked for</span>
              <Badge tone="soft">{formatWhen(appointment.start_time)}</Badge>
            </div>

            <div className="ds-field">
              <label className="ds-label" htmlFor="reschedule-date">
                New date
              </label>
              <input
                id="reschedule-date"
                type="date"
                className="input"
                value={date}
                min={today}
                onChange={handleDate}
              />
              <span className="ds-help">Pick a day, then choose one of the open times.</span>
            </div>

            <SlotPicker
              slots={slots}
              selectedSlot={selectedSlot}
              onSelect={(slot: string) => {
                setSelectedSlot(slot);
                setError('');
              }}
              loading={loading}
            />

            {error && <Alert tone="danger">{error}</Alert>}

            <div className="ds-form-actions">
              <Button variant="secondary" onClick={onClose} disabled={submitting}>
                Keep current time
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={submitting || !selectedSlot}
              >
                {submitting ? 'Rescheduling...' : 'Confirm new time'}
              </Button>
            </div>
          </Stack>
        </div>
      </div>
    </div>
  );
}

export default RescheduleModal;