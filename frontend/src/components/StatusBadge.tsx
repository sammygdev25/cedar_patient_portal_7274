import { Badge } from './ui';

interface StatusBadgeProps {
  status: string;
}

type BadgeTone = 'neutral' | 'primary' | 'soft' | 'success' | 'danger';

const SUCCESS_STATES = [
  'paid',
  'completed',
  'complete',
  'fulfilled',
  'delivered',
  'approved',
  'verified',
  'active',
  'handled',
  'ready',
];

const PRIMARY_STATES = [
  'confirmed',
  'checked_in',
  'in_progress',
  'processing',
  'shipped',
  'out_for_delivery',
];

const SOFT_STATES = [
  'scheduled',
  'booked',
  'pending',
  'pending_approval',
  'awaiting_approval',
  'unpaid',
  'open',
  'new',
  'draft',
];

const DANGER_STATES = [
  'cancelled',
  'canceled',
  'rejected',
  'declined',
  'overdue',
  'failed',
  'no_show',
  'expired',
  'refused',
];

function normalize(status: string): string {
  return (status || '').toString().trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function toneFor(key: string): BadgeTone {
  if (SUCCESS_STATES.includes(key)) return 'success';
  if (DANGER_STATES.includes(key)) return 'danger';
  if (PRIMARY_STATES.includes(key)) return 'primary';
  if (SOFT_STATES.includes(key)) return 'soft';
  return 'neutral';
}

function labelFor(key: string): string {
  if (!key) return 'Unknown';
  const words = key.split('_').filter(Boolean);
  return words
    .map((word, index) => (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');
}

function StatusBadge({ status }: StatusBadgeProps) {
  const key = normalize(status);
  return <Badge tone={toneFor(key)}>{labelFor(key)}</Badge>;
}

export default StatusBadge;