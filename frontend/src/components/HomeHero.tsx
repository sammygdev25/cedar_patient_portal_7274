import { Button, Hero, Media } from '../components/ui';
import { Icon } from '../components/icons';

interface HomeHeroProps {
  section?: string;
  page?: string;
  imageUrl?: string;
  imageAlt?: string;
  isAuthenticated?: boolean;
}

function HomeHero({ imageUrl = '/img/brand/hero.jpg', imageAlt, isAuthenticated = false }: HomeHeroProps) {
  const media = imageUrl ? (
    <Media src={imageUrl} alt={imageAlt || 'Cedar Hollow Health clinic'} ratio="wide" />
  ) : undefined;

  const actions = (
    <>
      <Button variant="primary" size="lg" to="/portal/book">
        <Icon name="calendar" size={18} />
        Book an appointment
      </Button>
      {isAuthenticated ? (
        <Button variant="ghost" size="lg" to="/portal">
          Go to my portal
          <Icon name="arrow-right" size={18} />
        </Button>
      ) : (
        <Button variant="ghost" size="lg" to="/login">
          <Icon name="login" size={18} />
          Patient sign in
        </Button>
      )}
    </>
  );

  return (
    <Hero
      eyebrow="Cedar Hollow Health"
      title="Care that fits your day, all in one place"
      text="Book visits with our doctors, read your visit notes and prescriptions, and keep your documents together in one secure patient portal. Pay your bills and order from our in-house pharmacy without leaving home."
      actions={actions}
      media={media}
    />
  );
}

export default HomeHero;