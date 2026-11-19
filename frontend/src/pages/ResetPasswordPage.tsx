import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';
import ResetPasswordForm from '../components/ResetPasswordForm';

function extractError(err: unknown): string {
  const fallback = 'We could not reset your password. The link may have expired, so request a new one.';
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (typeof record.detail === 'string') return record.detail;
    const messages: string[] = [];
    Object.values(record).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach((item) => messages.push(String(item)));
      } else if (typeof value === 'string') {
        messages.push(value);
      }
    });
    if (messages.length > 0) return messages.join(' ');
  }
  return fallback;
}

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uid = searchParams.get('uid') || '';
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('This reset link is incomplete. Please request a new password reset email.');
      return;
    }
    if (password.length < 8) {
      setError('Your new password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('The two passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/auth/password-reset-confirm/', {
        uid,
        token,
        password,
        new_password: password,
        new_password_confirm: confirmPassword,
      });
      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
      window.setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ResetPasswordForm
      password={password}
      confirmPassword={confirmPassword}
      onPasswordChange={setPassword}
      onConfirmPasswordChange={setConfirmPassword}
      onSubmit={handleSubmit}
      submitting={submitting}
      success={success}
      error={error}
      hasToken={Boolean(token)}
    />
  );
}

export default ResetPasswordPage;