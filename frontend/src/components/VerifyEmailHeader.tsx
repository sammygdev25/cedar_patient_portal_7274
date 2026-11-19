import { PageHeader, Button } from '../components/ui';
import { Icon } from '../components/icons';

type VerifyStatus = 'pending' | 'verifying' | 'success' | 'error';

interface VerifyEmailHeaderProps {
  status?: VerifyStatus;
  email?: string;
  isAuthenticated?: boolean;
}

const COPY: Record<VerifyStatus, { title: string; subtitle: string }> = {
  pending: {
    title: 'Verify your email address',
    subtitle:
      'Confirming your email keeps your Cedar Hollow Health portal secure and lets us send appointment reminders, visit summaries and bill notices.',
  },
  verifying: {
    title: 'Verifying your email',
    subtitle: 'One moment while we confirm your verification link.',
  },
  success: {
    title: 'Your email is verified',
    subtitle:
      'Thank you. You now have full access to appointments, records, documents, bills and the pharmacy in your patient portal.',
  },
  error: {
    title: 'We could not verify your email',
    subtitle:
      'The verification link may have expired or already been used. You can request a new link below.',
  },
};

function VerifyEmailHeader({
  status = 'pending',
  email = '',
  isAuthenticated = false,
}: VerifyEmailHeaderProps) {
  const copy = COPY[status] || COPY.pending;
  const subtitle = email && status === 'pending'
    ? `${copy.subtitle} We sent a link to ${email}.`
    : copy.subtitle;

  return (
    <PageHeader
      eyebrow="Patient portal"
      title={copy.title}
      subtitle={subtitle}
      actions={
        isAuthenticated ? (
          <Button variant="ghost" to="/portal">
            <Icon name="arrow-left" size={16} /> Back to my portal
          </Button>
        ) : (
          <Button variant="ghost" to="/login">
            <Icon name="arrow-left" size={16} /> Back to sign in
          </Button>
        )
      }
    />
  );
}

export default VerifyEmailHeader;