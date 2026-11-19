import { Button, Cluster, EmptyState, LoadingBlock, Stack } from './ui';

type SlotValue =
  | string
  | {
      start_time?: string;
      start?: string;
      time?: string;
      available?: boolean;
      is_available?: boolean;
    };

interface SlotPickerProps {
  slots: SlotValue[];
  selectedSlot: string;
  onSelect: (slot: string) => void;
  loading?: boolean;
}

interface NormalizedSlot {
  value: string;
  label: string;
  hour: number;
  available: boolean;
}

interface SlotGroup {
  title: string;
  items: NormalizedSlot[];
}

function normalizeSlot(slot: SlotValue): NormalizedSlot | null {
  const value =
    typeof slot === 'string' ? slot : slot.start_time || slot.start || slot.time || '';
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const available =
    typeof slot === 'string' ? true : slot.available !== false && slot.is_available !== false;
  return {
    value,
    label: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    hour: date.getHours(),
    available,
  };
}

function groupSlots(slots: NormalizedSlot[]): SlotGroup[] {
  const groups: SlotGroup[] = [
    { title: 'Morning', items: slots.filter((s) => s.hour < 12) },
    { title: 'Afternoon', items: slots.filter((s) => s.hour >= 12 && s.hour < 17) },
    { title: 'Evening', items: slots.filter((s) => s.hour >= 17) },
  ];
  return groups.filter((g) => g.items.length > 0);
}

function SlotPicker({ slots, selectedSlot, onSelect, loading = false }: SlotPickerProps) {
  if (loading) {
    return <LoadingBlock label="Checking available times..." />;
  }

  const list = Array.isArray(slots) ? slots : [];
  const normalized = list
    .map(normalizeSlot)
    .filter((s): s is NormalizedSlot => s !== null)
    .sort((a, b) => new Date(a.value).getTime() - new Date(b.value).getTime());

  if (normalized.length === 0) {
    return (
      <EmptyState
        icon="clock"
        title="No open times for this day"
        text="Choose another date or a different doctor to see more appointment times at Cedar Hollow Health."
      />
    );
  }

  const groups = groupSlots(normalized);

  return (
    <Stack gap="md">
      {groups.map((group) => (
        <Stack gap="xs" key={group.title}>
          <span className="ds-eyebrow">{group.title}</span>
          <Cluster gap="sm">
            {group.items.map((slot) => {
              const isSelected = slot.value === selectedSlot;
              return (
                <Button
                  key={slot.value}
                  type="button"
                  variant={isSelected ? 'primary' : 'secondary'}
                  disabled={!slot.available}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(slot.value)}
                >
                  {slot.label}
                </Button>
              );
            })}
          </Cluster>
        </Stack>
      ))}
    </Stack>
  );
}

export default SlotPicker;