import type { ReactNode } from 'react';
import {
  Section,
  Stack,
  Cluster,
  Card,
  CardBody,
  CardTitle,
  CardMeta,
  CardFooter,
  Button,
  Alert,
  Badge,
  EmptyState,
  LoadingBlock,
} from '../components/ui';
import { Icon } from '../components/icons';

export type VerifyEmailStatus = 'missing' | 'verifying' | 'success' | 'error';

interface VerifyEmailContentProps {
  section?: string;
  page?: string;
  status?: VerifyEmailStatus;
  message?: string;
  email?: string;
  isAuthenticated?: boolean;
  resending?: boolean;
  resent?: boolean;
  onResend?: () => void;
}

function VerifyEmailContent({
  status = 'missing',
  message = '',
  email = '',
  isAuthenticated = false,
  resending = false,
  resent = false,
  onResend,
}: VerifyEmailContentProps) {
  const resendButton: ReactNode = onResend ? (
    <Button variant="secondary" onClick={onResend} disabled={resending}>
      <Icon name="refresh" size={16} />
      {resending ? 'Sending...' : 'Send a new verification link'}
    </Button>
  ) : null;

  const resentAlert: ReactNode = resent ? (
    <Alert tone="success">
      A new verification link is on its way{email ? ` to ${email}` : ''}. It can take a minute or two to arrive.
    </Alert>
  ) : null;

  if (status === 'verifying') {
    return (
      <Section narrow>
        <LoadingBlock label="Confirming your email address..." />
      </Section>
    );
  }

  if (status === 'success') {
    return (
      <Section narrow>
        <Card>
          <CardBody>
            <Stack gap="md">
              <Cluster gap="sm" align="center">
                <Icon name="check" size={28} />
                <Badge tone="success">Email verified</Badge>
              </Cluster>
              <CardTitle>Your email is confirmed</CardTitle>
              <CardMeta>
                Thank you. Your Cedar Hollow Health patient account is fully active, so you can book
                appointments, read visit notes, download documents and pay bills online.
              </CardMeta>
            </Stack>
          </CardBody>
          <CardFooter>
            {isAuthenticated ? (
              <Button variant="primary" to="/portal">
                Go to my patient portal
                <Icon name="arrow-right" size={16} />
              </Button>
            ) : (
              <Button variant="primary" to="/login">
                Sign in to your account
                <Icon name="login" size={16} />
              </Button>
            )}
          </CardFooter>
        </Card>
      </Section>
    );
  }

  if (status === 'error') {
    return (
      <Section narrow>
        <Card>
          <CardBody>
            <Stack gap="md">
              <Cluster gap="sm" align="center">
                <Icon name="alert" size={28} />
                <Badge tone="danger">Link not valid</Badge>
              </Cluster>
              <CardTitle>We could not verify that link</CardTitle>
              <Alert tone="danger">
                {message || 'This verification link has expired or has already been used.'}
              </Alert>
              <CardMeta>
                Verification links expire for your security. Request a new one and use the most recent
                email from Cedar Hollow Health.
              </CardMeta>
              {resentAlert}
            </Stack>
          </CardBody>
          <CardFooter>
            <Cluster gap="sm">
              {resendButton}
              <Button variant="ghost" to={isAuthenticated ? '/profile' : '/login'}>
                {isAuthenticated ? 'Back to my profile' : 'Back to sign in'}
              </Button>
            </Cluster>
          </CardFooter>
        </Card>
      </Section>
    );
  }

  return (
    <Section narrow>
      <Stack gap="md">
        <EmptyState
          icon="mail"
          title="Check your inbox"
          text={
            email
              ? `We sent a verification link to ${email}. Open it on this device to confirm your patient account.`
              : 'We sent a verification link to the email you used to sign up. Open it to confirm your patient account.'
          }
          action={
            <Cluster gap="sm">
              {resendButton}
              <Button variant="ghost" to={isAuthenticated ? '/profile' : '/login'}>
                {isAuthenticated ? 'Go to my profile' : 'Sign in'}
              </Button>
            </Cluster>
          }
        />
        {resentAlert}
      </Stack>
    </Section>
  );
}

export default VerifyEmailContent;