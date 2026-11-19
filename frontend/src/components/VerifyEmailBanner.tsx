import { useState } from 'react';
import { Button } from './ui';
import { Icon } from './icons';

interface VerifyEmailBannerUser {
  email?: string;
  email_verified?: boolean;
}

interface VerifyEmailBannerProps {
  user: VerifyEmailBannerUser | null;
  onResend?: () => Promise<unknown> | void;
}

type SendState = 'idle' | 'sending' | 'sent' | 'error';

function VerifyEmailBanner({ user, onResend }: VerifyEmailBannerProps) {
  const [state, setState] = useState<SendState>('idle');

  if (!user || user.email_verified) {
    return null;
  }

  const handleResend = async () => {
    if (!onResend || state === 'sending') return;
    setState('sending');
    try {
      await onResend();
      setState('sent');
    } catch (err) {
      setState('error');
    }
  };

  return (
    <div className="ds-alert" role="status" aria-live="polite">
      <div className="ds-stack">
        <div className="ds-cluster">
          <Icon name="mail" size={20} />
          <strong>Please verify your email address</strong>
        </div>
        <p className="ds-small ds-muted">
          We sent a verification link to {user.email ? <strong>{user.email}</strong> : 'your email address'}.
          Confirm it to book appointments, view your records and pay bills in the Cedar Hollow Health portal.
        </p>
        {state === 'sent' && (
          <p className="ds-small" style={{ color: 'var(--color-success)' }}>
            A new verification email is on its way. Check your inbox and spam folder.
          </p>
        )}
        {state === 'error' && (
          <p className="ds-small" style={{ color: 'var(--color-danger)' }}>
            We could not send the email just now. Please try again in a moment.
          </p>
        )}
        {onResend && (
          <div className="ds-cluster">
            <Button
              variant="secondary"
              type="button"
              onClick={handleResend}
              disabled={state === 'sending'}
            >
              {state === 'sending' ? 'Sending...' : state === 'sent' ? 'Send again' : 'Resend verification email'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default VerifyEmailBanner;