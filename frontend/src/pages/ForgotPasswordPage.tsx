import { useState } from 'react';
import type { FormEvent } from 'react';
import api from '../api';
import ForgotPasswordForm from '../components/ForgotPasswordForm';

function extractError(err: unknown): string {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
  if (data) {
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.email) && typeof data.email[0] === 'string') return data.email[0];
    if (typeof data.error === 'string') return data.error;
  }
  return 'We could not send the reset email. Please check the address and try again.';
}

function ForgotPasswordPage() {
  const [email, setEmail] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await api.post('/auth/password-reset/', { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(extractError(err));
      setSent(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (error) setError('');
    if (sent) setSent(false);
  };

  return (
    <div className="ds-stack-lg">
      <ForgotPasswordForm
        email={email}
        submitting={submitting}
        sent={sent}
        error={error}
        onEmailChange={handleEmailChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default ForgotPasswordPage;