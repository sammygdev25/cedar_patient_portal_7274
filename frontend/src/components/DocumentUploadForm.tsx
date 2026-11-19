import { useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { createMedicalDocument } from '../api';
import type { MedicalDocument } from '../types';
import { Alert, Button } from './ui';
import { Icon } from './icons';

interface DocumentUploadFormProps {
  onUploaded: (document: MedicalDocument) => void;
}

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

const DOCUMENT_TYPES: { value: string; label: string }[] = [
  { value: 'insurance', label: 'Insurance card' },
  { value: 'lab_result', label: 'Lab result' },
  { value: 'other', label: 'Other' },
];

function validateFile(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return 'Only PDF, JPEG, PNG or WebP files can be uploaded.';
  }
  if (file.type && !ALLOWED_TYPES.includes(file.type)) {
    return 'That file type is not accepted. Please choose a PDF, JPEG, PNG or WebP file.';
  }
  if (file.size > MAX_BYTES) {
    return 'This file is larger than 10 MB. Please choose a smaller file.';
  }
  return '';
}

function extractError(err: unknown): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === 'string' && data) return data;
  if (data && typeof data === 'object') {
    const first = Object.values(data as Record<string, unknown>)[0];
    if (Array.isArray(first) && first.length > 0) return String(first[0]);
    if (typeof first === 'string') return first;
  }
  return 'We could not upload your document. Please try again.';
}

function DocumentUploadForm({ onUploaded }: DocumentUploadFormProps) {
  const [title, setTitle] = useState<string>('');
  const [documentType, setDocumentType] = useState<string>('insurance');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const chosen = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null;
    setSuccess('');
    if (!chosen) {
      setFile(null);
      setError('');
      return;
    }
    const problem = validateFile(chosen);
    if (problem) {
      setError(problem);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    setError('');
    setFile(chosen);
    if (!title.trim()) {
      setTitle(chosen.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setError('Please choose a file to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Please give the document a title.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        title: title.trim(),
        document_type: documentType,
        file,
      } as unknown as Parameters<typeof createMedicalDocument>[0];
      const created = (await createMedicalDocument(payload)) as MedicalDocument;
      setTitle('');
      setDocumentType('insurance');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSuccess('Your document was uploaded to your private record.');
      onUploaded(created);
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="ds-form" onSubmit={handleSubmit} noValidate>
      {error && <Alert tone="danger">{error}</Alert>}
      {success && <Alert tone="success">{success}</Alert>}

      <div className="ds-form-row">
        <div className="ds-field">
          <label className="ds-label" htmlFor="document-title">Title</label>
          <input
            id="document-title"
            className="input"
            type="text"
            value={title}
            maxLength={200}
            placeholder="e.g. Blue Cross insurance card (front)"
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            disabled={submitting}
            required
          />
        </div>

        <div className="ds-field">
          <label className="ds-label" htmlFor="document-type">Document type</label>
          <select
            id="document-type"
            className="input"
            value={documentType}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => setDocumentType(e.target.value)}
            disabled={submitting}
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="ds-field">
        <label className="ds-label" htmlFor="document-file">File</label>
        <input
          id="document-file"
          ref={fileInputRef}
          className="input"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          disabled={submitting}
          required
        />
        <p className="ds-help">
          PDF, JPEG, PNG or WebP, up to 10 MB. Only you can see the files you upload; Cedar Hollow staff cannot browse them.
        </p>
      </div>

      <div className="ds-form-actions">
        <Button type="submit" variant="primary" disabled={submitting || !file}>
          <Icon name="upload" size={16} />
          {submitting ? 'Uploading...' : 'Upload document'}
        </Button>
      </div>
    </form>
  );
}

export default DocumentUploadForm;