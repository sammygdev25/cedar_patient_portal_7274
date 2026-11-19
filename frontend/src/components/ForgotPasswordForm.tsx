import React from 'react';

interface ForgotPasswordFormProps {
  email?: any;
  submitting?: any;
  sent?: any;
  error?: any;
  onEmailChange?: any;
  onSubmit?: any;
}

function ForgotPasswordForm({ email, submitting, sent, error, onEmailChange, onSubmit }: ForgotPasswordFormProps) {
  return (
    <div style={{ padding: 'var(--space-md)' }}>
      <p style={{ color: 'var(--color-text-secondary)' }}>ForgotPasswordForm</p>
    </div>
  );
}

export default ForgotPasswordForm;
