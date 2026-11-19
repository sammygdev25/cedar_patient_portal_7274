import { Button, Card, CardBody, Cluster, Section, Stack } from '../components/ui';
import { Icon } from '../components/icons';

interface HomeCtaProps {
  clinicName?: string;
  isAuthenticated?: boolean;
  onBrowse?: () => void;
}

export default function HomeCta({
  clinicName = 'Cedar Hollow Health',
  isAuthenticated = false,
  onBrowse,
}: HomeCtaProps) {
  return (
    <Section tight narrow>
      <Card>
        <CardBody>
          <Stack gap="md" align="center">
            <p className="ds-eyebrow">{clinicName}</p>
            <h2>
              {isAuthenticated
                ? 'Ready for your next visit?'
                : 'Your care, one secure portal'}
            </h2>
            <p className="ds-lead ds-muted">
              {isAuthenticated
                ? 'Book an appointment, review visit notes and prescriptions, or pay a bill in a few taps.'
                : 'Browse our services and doctors, or create a patient account to book visits, view records and order from our in-house pharmacy.'}
            </p>
            <Cluster gap="sm" justify="center">
              {isAuthenticated ? (
                <>
                  <Button variant="primary" size="lg" to="/portal/book">
                    <Icon name="calendar" size={18} />
                    Book an appointment
                  </Button>
                  <Button variant="secondary" size="lg" to="/portal">
                    Go to my portal
                    <Icon name="arrow-right" size={18} />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="primary" size="lg" to="/register">
                    <Icon name="user" size={18} />
                    Create patient account
                  </Button>
                  {onBrowse ? (
                    <Button variant="secondary" size="lg" onClick={onBrowse}>
                      Browse our services
                      <Icon name="arrow-right" size={18} />
                    </Button>
                  ) : (
                    <Button variant="secondary" size="lg" to="/login">
                      <Icon name="login" size={18} />
                      Sign in
                    </Button>
                  )}
                </>
              )}
            </Cluster>
          </Stack>
        </CardBody>
      </Card>
    </Section>
  );
}