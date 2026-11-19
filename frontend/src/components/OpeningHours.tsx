import type { ClinicHour } from '../types';
import { Badge, Card, CardBody, CardTitle, CardMeta, EmptyState } from '../components/ui';
import { Icon } from '../components/icons';

interface OpeningHoursProps {
  hours: ClinicHour[];
}

const DAY_NAMES: string[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function formatTime(value: string | null | undefined): string {
  if (!value) return '';
  const [hourPart, minutePart] = value.split(':');
  const hour = parseInt(hourPart, 10);
  const minute = parseInt(minutePart || '0', 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return value;
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function todayIndex(): number {
  // Monday = 0 ... Sunday = 6
  return (new Date().getDay() + 6) % 7;
}

function OpeningHours({ hours }: OpeningHoursProps) {
  const list: ClinicHour[] = Array.isArray(hours) ? hours : [];
  const sorted = [...list].sort((a, b) => a.day_of_week - b.day_of_week);
  const today = todayIndex();

  if (sorted.length === 0) {
    return (
      <EmptyState
        icon="clock"
        title="Opening hours coming soon"
        text="Call the Cedar Hollow Health front desk to confirm when we are open."
      />
    );
  }

  return (
    <Card>
      <CardBody>
        <CardTitle>
          <Icon name="clock" size={20} /> Opening hours
        </CardTitle>
        <CardMeta>Cedar Hollow Health clinic hours, local time</CardMeta>
        <div className="ds-table-wrap">
          <table className="ds-table">
            <tbody>
              {sorted.map((entry) => {
                const closed = entry.is_closed || !entry.opens_at || !entry.closes_at;
                const isToday = entry.day_of_week === today;
                return (
                  <tr key={entry.day_of_week}>
                    <td>
                      <span className="ds-cluster">
                        {DAY_NAMES[entry.day_of_week] || `Day ${entry.day_of_week}`}
                        {isToday && <Badge tone="primary">Today</Badge>}
                      </span>
                    </td>
                    <td>
                      {closed ? (
                        <Badge tone="neutral">Closed</Badge>
                      ) : (
                        <span>
                          {formatTime(entry.opens_at)} – {formatTime(entry.closes_at)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}

export default OpeningHours;