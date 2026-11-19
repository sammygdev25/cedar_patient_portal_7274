import { Badge, Button, Card, CardBody, CardMeta, CardTitle, Grid, Section, Stat } from '../components/ui';
import { Icon } from '../components/icons';
import type { Service } from '../types';

interface HomeCategoriesProps {
  services: Service[];
  onBrowseAll?: () => void;
}

const STEPS = [
  {
    value: '1',
    label: 'Create your patient account',
    icon: 'user' as const,
  },
  {
    value: '2',
    label: 'Pick a service and a doctor, then book a time',
    icon: 'calendar' as const,
  },
  {
    value: '3',
    label: 'See your visit notes, bills and prescriptions in one place',
    icon: 'book' as const,
  },
];

function HomeCategories({ services, onBrowseAll }: HomeCategoriesProps) {
  const list = (Array.isArray(services) ? services : []).filter((s) => s.is_active !== false);

  if (list.length === 0) {
    return (
      <Section
        eyebrow="How it works"
        title="Care at Cedar Hollow in three steps"
        subtitle="Book visits, review your records and order from our in-house pharmacy without leaving the portal."
      >
        <Grid size="sm">
          {STEPS.map((step) => (
            <Stat key={step.value} value={step.value} label={step.label} icon={step.icon} />
          ))}
        </Grid>
      </Section>
    );
  }

  return (
    <Section
      eyebrow="Browse by category"
      title="Find the care you need"
      subtitle="From routine check-ups to specialist consultations, choose a service and book it with a Cedar Hollow doctor."
      actions={
        <Button variant="ghost" to="/portal/book" onClick={onBrowseAll}>
          Book an appointment
          <Icon name="arrow-right" size={16} />
        </Button>
      }
    >
      <Grid size="sm">
        {list.map((service) => (
          <Card key={service.slug} to={`/portal/book?category=${service.slug}`}>
            <CardBody>
              <Icon name="tag" size={24} />
              <CardTitle>{service.name}</CardTitle>
              <CardMeta>
                <Badge tone="soft">
                  <Icon name="clock" size={14} /> {service.duration_minutes} min
                </Badge>
              </CardMeta>
              <p className="ds-muted ds-small">{service.description}</p>
            </CardBody>
          </Card>
        ))}
      </Grid>
    </Section>
  );
}

export default HomeCategories;