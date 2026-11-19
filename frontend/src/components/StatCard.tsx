import { Card, CardBody } from './ui';

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
}

function StatCard({ label, value, hint }: StatCardProps) {
  return (
    <Card>
      <CardBody>
        <div className="ds-stack">
          <span className="ds-eyebrow">{label}</span>
          <strong className="ds-price">{value}</strong>
          {hint ? <span className="ds-muted ds-small">{hint}</span> : null}
        </div>
      </CardBody>
    </Card>
  );
}

export default StatCard;