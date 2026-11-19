import { Hero, Button, Cluster, Badge } from './ui';
import { Icon } from './icons';

interface HeroSectionProps {
  clinicName?: string;
  tagline?: string;
}

function HeroSection({
  clinicName = 'Cedar Hollow Health',
  tagline = 'Book visits, read your visit notes, manage prescriptions and pay bills in one secure patient portal.',
}: HeroSectionProps) {
  return (
    <Hero
      eyebrow="Your neighborhood clinic"
      title={`Welcome to ${clinicName}`}
      text={tagline}
      actions={
        <Cluster gap="sm">
          <Button to="/portal/book" variant="primary" size="lg">
            <Icon name="calendar" size={18} /> Book an appointment
          </Button>
          <Button to="/login" variant="secondary" size="lg">
            <Icon name="login" size={18} /> Patient sign in
          </Button>
          <Button to="/portal/pharmacy" variant="ghost" size="lg">
            <Icon name="package" size={18} /> Visit our pharmacy
          </Button>
        </Cluster>
      }
      media={
        <Cluster gap="sm">
          <Badge tone="soft">
            <Icon name="shield" size={14} /> Secure records
          </Badge>
          <Badge tone="soft">
            <Icon name="clock" size={14} /> Same-week visits
          </Badge>
          <Badge tone="soft">
            <Icon name="credit-card" size={14} /> Pay bills online
          </Badge>
        </Cluster>
      }
    />
  );
}

export default HeroSection;