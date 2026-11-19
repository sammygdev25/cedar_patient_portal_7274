import React from 'react';

interface ResetPasswordFormProps {
  password?: any;
  confirmPassword?: any;
  onPasswordChange?: any;
  onConfirmPasswordChange?: any;
  onSubmit?: any;
  submitting?: any;
  success?: any;
  error?: any;
  hasToken?: any;
}

function ResetPasswordForm({ password, confirmPassword, onPasswordChange, onConfirmPasswordChange, onSubmit, submitting, success, error, hasToken }: ResetPasswordFormProps) {
  return (
    <div style={{ padding: 'var(--space-md)' }}>
      <p style={{ color: 'var(--color-text-secondary)' }}>ResetPasswordForm</p>
    </div>
  );
}

export default ResetPasswordForm;
