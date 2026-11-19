import { useState } from 'react';
import {
  Section,
  Grid,
  Card,
  CardBody,
  CardTitle,
  CardMeta,
  CardFooter,
  Badge,
  Button,
  EmptyState,
  SkeletonCards,
  Alert,
} from '../components/ui';
import { Icon } from '../components/icons';
import type { MedicalDocument } from '../types';

interface DocumentsContentProps {
  documents?: MedicalDocument[];
  loading?: boolean;
  error?: string | null;
  onDelete?: (id: number) => void | Promise<void>;
  onAddClick?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  insurance: 'Insurance card',
  lab_result: 'Lab result',
  other: 'Other',
};

const TYPE_ICONS: Record<string, 'shield' | 'book' | 'info'> = {
  insurance: 'shield',
  lab_result: 'book',
  other: 'info',
};

function formatSize(bytes: number): string {
  if (!bytes || bytes < 1) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUploaded(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function DocumentsContent({
  documents = [],
  loading = false,
  error = null,
  onDelete,
  onAddClick,
}: DocumentsContentProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const items: MedicalDocument[] = Array.isArray(documents) ? documents : [];

  const handleDelete = async (doc: MedicalDocument) => {
    if (!onDelete) return;
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setDeletingId(doc.id);
    try {
      await onDelete(doc.id);
    } finally {
      setDeletingId(null);
    }
  };

  const subtitle = items.length > 0
    ? `${items.length} private ${items.length === 1 ? 'file' : 'files'} on record. Only you can see, download or delete them.`
    : 'Insurance cards and lab results you share with Cedar Hollow Health stay private to your account.';

  return (
    <Section eyebrow="Your files" title="Uploaded documents" subtitle={subtitle} tight>
      {error && <Alert tone="danger">{error}</Alert>}

      {loading ? (
        <SkeletonCards count={3} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="book"
          title="No documents uploaded yet"
          text="Upload an insurance card or lab result as a PDF, JPEG, PNG or WebP file up to 10 MB."
          action={
            onAddClick ? (
              <Button variant="primary" onClick={onAddClick}>
                <Icon name="upload" size={16} /> Upload a document
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Grid size="md">
          {items.map((doc) => (
            <Card key={doc.id}>
              <CardBody>
                <div className="ds-between">
                  <Badge tone="soft">
                    <Icon name={TYPE_ICONS[doc.document_type] || 'info'} size={14} />{' '}
                    {TYPE_LABELS[doc.document_type] || 'Other'}
                  </Badge>
                  <span className="ds-small ds-muted">{formatSize(doc.size_bytes)}</span>
                </div>
                <CardTitle>{doc.title}</CardTitle>
                <CardMeta>
                  <Icon name="calendar" size={14} /> Uploaded {formatUploaded(doc.created_at)}
                </CardMeta>
              </CardBody>
              <CardFooter>
                <Button variant="secondary" href={doc.file}>
                  <Icon name="download" size={16} /> View
                </Button>
                {onDelete && (
                  <Button
                    variant="danger"
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc.id}
                  >
                    <Icon name="trash" size={16} /> {deletingId === doc.id ? 'Deleting...' : 'Delete'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </Grid>
      )}
    </Section>
  );
}

export default DocumentsContent;