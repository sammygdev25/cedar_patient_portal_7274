import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { createContactMessage } from '../api';
import { Section, Button, Alert, Card, CardBody, CardTitle, CardMeta } from '../components/ui';
import { Icon } from '../components/icons';

interface ContactFormState {
  name: string;
  email: string;
  phone: string;
  message: string;
}

const EMPTY_FORM: ContactFormState = { name: '', email: '', phone: '', message: '' };

function ContactSection() {
  const [form, setForm] = useState<ContactFormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleChange =
    (field: keyof ContactFormState) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (sent) setSent(false);
    };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please add your name, email address and a short message so we can get back to you.');
      return;
    }
    setSubmitting(true);
    try {
      await createContactMessage({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
      });
      setSent(true);
      setForm(EMPTY_FORM);
    } catch (err) {
      setError('We could not send your message just now. Please try again or call the front desk.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section
      id="contact"
      eyebrow="Contact"
      title="Talk to the Cedar Hollow front desk"
      subtitle="Questions about services, new patient registration or your next visit? Send us a note and a member of our reception team will reply within one working day."
    >
      <div className="ds-grid-split">
        <form className="ds-form" onSubmit={handleSubmit} noValidate>
          {sent && (
            <Alert tone="success">
              Thank you. Your message has reached our reception team and we will be in touch soon.
            </Alert>
          )}
          {error && <Alert tone="danger">{error}</Alert>}

          <div className="ds-form-row">
            <div className="ds-field">
              <label className="ds-label" htmlFor="contact-name">Full name</label>
              <input
                id="contact-name"
                className="input"
                type="text"
                value={form.name}
                onChange={handleChange('name')}
                placeholder="Jane Whitaker"
                autoComplete="name"
                required
              />
            </div>
            <div className="ds-field">
              <label className="ds-label" htmlFor="contact-email">Email</label>
              <input
                id="contact-email"
                className="input"
                type="email"
                value={form.email}
                onChange={handleChange('email')}
                placeholder="jane@example.com"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="ds-field">
            <label className="ds-label" htmlFor="contact-phone">Phone (optional)</label>
            <input
              id="contact-phone"
              className="input"
              type="tel"
              value={form.phone}
              onChange={handleChange('phone')}
              placeholder="(555) 014-2290"
              autoComplete="tel"
            />
            <span className="ds-help">Only if you would like us to call you back.</span>
          </div>

          <div className="ds-field">
            <label className="ds-label" htmlFor="contact-message">How can we help?</label>
            <textarea
              id="contact-message"
              className="input"
              rows={5}
              value={form.message}
              onChange={handleChange('message')}
              placeholder="Tell us what you need, for example a question about booking a check-up or transferring your records."
              required
            />
            <span className="ds-help">Please do not include urgent medical details. In an emergency call 911.</span>
          </div>

          <div className="ds-form-actions">
            <Button type="submit" variant="primary" size="lg" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send message'}
            </Button>
          </div>
        </form>

        <Card>
          <CardBody>
            <CardTitle>Visit or call us</CardTitle>
            <div className="ds-stack">
              <div className="ds-cluster">
                <Icon name="map-pin" />
                <CardMeta>12 Cedar Hollow Lane, Maple Ridge</CardMeta>
              </div>
              <div className="ds-cluster">
                <Icon name="phone" />
                <CardMeta>(555) 014-2200</CardMeta>
              </div>
              <div className="ds-cluster">
                <Icon name="mail" />
                <CardMeta>hello@cedarhollowhealth.example</CardMeta>
              </div>
              <div className="ds-cluster">
                <Icon name="clock" />
                <CardMeta>Opening hours are listed on this page</CardMeta>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </Section>
  );
}

export default ContactSection;