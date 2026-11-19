import type { Service } from '../types';
import { Section, Grid, Card, CardBody, CardTitle, CardMeta, CardFooter, Media, Badge, Button, EmptyState, SkeletonCards } from '../components/ui';
import { Icon } from '../components/icons';

interface HomeFeaturedProps {
  services: Service[];
  loading?: boolean;
  onSelectService?: (service: Service) => void;
}

function HomeFeatured({ services, loading = false, onSelectService }: HomeFeaturedProps) {
  const list: Service[] = Array.isArray(services) ? services : [];
  const featured = list.filter((s) => s.is_active).slice(0, 8);

  return (
    <Section
      id="services"
      eyebrow="Our services"
      title="Care for every stage of life"
      subtitle="From routine check-ups to chronic condition management, Cedar Hollow Health offers unhurried appointments with clinicians who know your name."
      actions={
        <Button variant="ghost" to="/portal/book">
          Book an appointment
          <Icon name="arrow-right" size={16} />
        </Button>
      }
    >
      {loading ? (
        <SkeletonCards count={6} />
      ) : featured.length === 0 ? (
        <EmptyState
          icon="calendar"
          title="Services are being updated"
          text="Our service list is not available right now. Please check back soon or contact the front desk."
          action={
            <Button variant="secondary" to="/portal/book">
              Book an appointment
            </Button>
          }
        />
      ) : (
        <Grid size="md">
          {featured.map((service) => (
            <Card
              key={service.slug}
              to={onSelectService ? undefined : '/portal/book'}
              onClick={onSelectService ? () => onSelectService(service) : undefined}
            >
              <Media alt={service.name} ratio="wide" badge={`${service.duration_minutes} min`} />
              <CardBody>
                <CardTitle>{service.name}</CardTitle>
                <CardMeta>{service.description}</CardMeta>
              </CardBody>
              <CardFooter>
                <Badge tone="soft">
                  <Icon name="clock" size={14} /> {service.duration_minutes} minutes
                </Badge>
                <Badge tone="primary">
                  Book now <Icon name="chevron-right" size={14} />
                </Badge>
              </CardFooter>
            </Card>
          ))}
        </Grid>
      )}
    </Section>
  );
}

export default HomeFeatured;