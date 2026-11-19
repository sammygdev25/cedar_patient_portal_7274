import { Section, Card, CardBody, CardTitle, Badge, Button, Stack, Cluster, Alert } from '../components/ui';
import { Icon } from '../components/icons';

interface MyAppointmentsDetailsProps {
  section?: string;
  page?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  emailVerified?: boolean;
  onResendVerification?: () => void;
  resending?: boolean;
}

export default function MyAppointmentsDetails({
  fullName = '',
  email = '',
  phone = '',
  emailVerified = false,
  onResendVerification,
  resending = false,
}: MyAppointmentsDetailsProps) {
  return (
    <Section
      narrow
      eyebrow="Account details"
      title="Booking under your account"
      subtitle="Cedar Hollow Health books appointments under the contact details below. Reception uses them to reach you about changes."
    >
      <Stack gap="md">
        {!emailVerified && (
          <Alert tone="danger">
            <Stack gap="sm">
              <span>
                Your email is not verified yet. A verified email is required before you can book a new appointment.
              </span>
              <Cluster gap="sm">
                {onResendVerification && (
                  <Button variant="secondary" onClick={onResendVerification} disabled={resending}>
                    <Icon name="mail" size={16} /> {resending ? 'Sending...' : 'Resend verification email'}
                  </Button>
                )}
                <Button variant="ghost" to="/verify-email">
                  Enter verification code <Icon name="arrow-right" size={16} />
                </Button>
              </Cluster>
            </Stack>
          </Alert>
        )}

        <Card>
          <CardBody>
            <Stack gap="md">
              <Cluster gap="sm" justify="between">
                <CardTitle>{fullName || 'Patient'}</CardTitle>
                <Badge tone={emailVerified ? 'success' : 'danger'}>
                  <Icon name="shield" size={14} /> {emailVerified ? 'Email verified' : 'Email unverified'}
                </Badge>
              </Cluster>

              <div className="ds-field">
                <span className="ds-label">Email</span>
                <Cluster gap="sm">
                  <Icon name="mail" size={16} />
                  <span>{email || 'Not provided'}</span>
                </Cluster>
              </div>

              <div className="ds-field">
                <span className="ds-label">Phone</span>
                <Cluster gap="sm">
                  <Icon name="phone" size={16} />
                  <span>{phone || 'Not provided'}</span>
                </Cluster>
                <span className="ds-help">Reception may call this number if your doctor needs to reschedule.</span>
              </div>

              <div className="ds-form-actions">
                <Button variant="secondary" to="/profile">
                  <Icon name="edit" size={16} /> Edit profile
                </Button>
                <Button variant="primary" to="/portal/book">
                  <Icon name="calendar" size={16} /> Book a visit
                </Button>
              </div>
            </Stack>
          </CardBody>
        </Card>
      </Stack>
    </Section>
  );
}