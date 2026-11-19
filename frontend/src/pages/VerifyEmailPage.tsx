import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../contexts/AuthContext';
import VerifyEmailHeader from '../components/VerifyEmailHeader';
import VerifyEmailContent from '../components/VerifyEmailContent';

type HeaderStatus = ComponentProps<typeof VerifyEmailHeader>['status'];
type ContentStatus = ComponentProps<typeof VerifyEmailContent>['status'];

function extractMessage(err: unknown, fallback: string): string {
  const data = (err as { response?: { data?: { detail?: string; error?: string; token?: string[] } } })
    ?.response?.data;
  if (data?.detail) return data.detail;
  if (data?.error) return data.error;
  if (Array.isArray(data?.token) && data.token.length > 0) return data.token[0];
  return fallback;
}

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();
  const token = searchParams.get('token') || '';
  const uid = searchParams.get('uid') || '';
  const email = user?.email || searchParams.get('email') || '';

  const [status, setStatus] = useState<string>(token ? 'verifying' : 'idle');
  const [message, setMessage] = useState<string>('');
  const [resending, setResending] = useState<boolean>(false);
  const [resent, setResent] = useState<boolean>(false);
  const startedRef = useRef<string>('');
  const resentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token || startedRef.current === token) return;
    startedRef.current = token;
    setStatus('verifying');
    setMessage('');
    const payload: Record<string, string> = { token };
    if (uid) payload.uid = uid;
    api
      .post('/auth/verify-email/', payload)
      .then(() => {
        setStatus('success');
        setMessage('Your email address is verified. You can now book appointments and use the full Cedar Hollow Health portal.');
      })
      .catch((err: unknown) => {
        setStatus('error');
        setMessage(
          extractMessage(err, 'This verification link is invalid or has expired. Request a new one below.')
        );
      });
  }, [token, uid]);

  useEffect(() => {
    return () => {
      if (resentTimer.current) clearTimeout(resentTimer.current);
    };
  }, []);

  const handleResend = useCallback(async () => {
    if (resending) return;
    setResending(true);
    setResent(false);
    try {
      await api.post('/auth/resend-verification/', email ? { email } : {});
      setResent(true);
      if (resentTimer.current) clearTimeout(resentTimer.current);
      resentTimer.current = setTimeout(() => setResent(false), 2000);
    } catch (err: unknown) {
      setStatus('error');
      setMessage(extractMessage(err, 'We could not send a new verification email. Please try again shortly.'));
    } finally {
      setResending(false);
    }
  }, [email, resending]);

  return (
    <div className="ds-stack-lg">
      <VerifyEmailHeader
        status={status as HeaderStatus}
        email={email}
        isAuthenticated={isAuthenticated}
      />
      <VerifyEmailContent
        status={status as ContentStatus}
        message={message}
        email={email}
        isAuthenticated={isAuthenticated}
        resending={resending}
        resent={resent}
        onResend={handleResend}
      />
    </div>
  );
}

export default VerifyEmailPage;