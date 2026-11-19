import { Section, Grid, Card, CardBody, CardTitle, CardMeta, CardFooter, Badge, Button } from '../components/ui';
import { Icon } from '../components/icons';
import type { Service } from '../types';

interface PatientDetailRelatedProps {
  services: Service[];
  patientName?: string;
  onSelectService?: (service: Service) => void;
}

const MAX_ITEMS = 6;

function truncate(text: string, length: number): string {
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length).trim()}...` : text;
}

export default function PatientDetailRelated({
  services,
  patientName,
  onSelectService,
}: PatientDetailRelatedProps) {
  const items = (Array.isArray(services) ? services : [])
    .filter((service) => service.is_active)
    .slice(0, MAX_ITEMS);

  if (items.length === 0) {
    return null;
  }

  const subtitle = patientName
    ? `Other Cedar Hollow Health services you can book as a follow-up for ${patientName}.`
    : 'Other Cedar Hollow Health services available as a follow-up.';

  return (
    <Section
      eyebrow="Care options"
      title="Related services"
      subtitle={subtitle}
    >
      <Grid size="sm">
        {items.map((service) => (
          <Card key={service.id}>
            <CardBody>
              <Badge tone="soft">
                <Icon name="clock" size={14} /> {service.duration_minutes} min
              </Badge>
              <CardTitle>{service.name}</CardTitle>
              <CardMeta>{truncate(service.description, 110)}</CardMeta>
            </CardBody>
            <CardFooter>
              <Button
                variant="secondary"
                onClick={() => onSelectService && onSelectService(service)}
              >
                <Icon name="calendar" size={16} /> Schedule follow-up
              </Button>
            </CardFooter>
          </Card>
        ))}
      </Grid>
    </Section>
  );
}