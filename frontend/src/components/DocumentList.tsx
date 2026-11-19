import { useState } from 'react';
import { Badge, Card, CardBody, CardFooter, CardMeta, CardTitle, EmptyState, Grid } from '../components/ui';
import { Icon } from '../components/icons';
import type { MedicalDocument } from '../types';

interface DocumentListProps {
  documents: MedicalDocument[];
  onDelete: (id: number) => void | Promise<void>;
}

const TYPE_LABELS: Record<string, string> = {
  insurance: 'Insurance card',
  lab_result: 'Lab result',
  other: 'Other',
};

function typeTone(type: string): 'primary' | 'success' | 'neutral' {
  if (type === 'insurance') return 'primary';
  if (type === 'lab_result') return 'success';
  return 'neutral';
}

function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUploaded(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fileKind(contentType: string): string {
  if (contentType === 'application/pdf') return 'PDF';
  if (contentType === 'image/jpeg') return 'JPEG';
  if (contentType === 'image/png') return 'PNG';
  if (contentType === 'image/webp') return 'WebP';
  return 'File';
}

function DocumentList({ documents, onDelete }: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const items: MedicalDocument[] = Array.isArray(documents) ? documents : [];

  const handleDelete = async (doc: MedicalDocument) => {
    if (!window.confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setDeletingId(doc.id);
    try {
      await onDelete(doc.id);
    } finally {
      setDeletingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon="book"
        title="No documents on file yet"
        text="Upload your insurance card or lab results and they will appear here. Only you can see your files."
      />
    );
  }

  return (
    <Grid size="md">
      {items.map((doc) => {
        const isImage = (doc.content_type || '').startsWith('image/');
        const isDeleting = deletingId === doc.id;
        return (
          <Card key={doc.id}>
            <CardBody>
              <div className="ds-between">
                <Badge tone={typeTone(doc.document_type)}>
                  {TYPE_LABELS[doc.document_type] || 'Other'}
                </Badge>
                <span className="ds-small ds-muted">
                  <Icon name={isImage ? 'image' : 'book'} size={16} /> {fileKind(doc.content_type)}
                </span>
              </div>
              <CardTitle>{doc.title}</CardTitle>
              <CardMeta>
                {formatSize(doc.size_bytes)} &middot; Uploaded {formatUploaded(doc.created_at)}
              </CardMeta>
            </CardBody>
            <CardFooter>
              <a
                className="btn btn-secondary"
                href={doc.file}
                target="_blank"
                rel="noopener noreferrer"
                download
              >
                <Icon name="download" size={16} /> Download
              </a>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleDelete(doc)}
                disabled={isDeleting}
                aria-label={`Delete ${doc.title}`}
              >
                <Icon name="trash" size={16} /> {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </CardFooter>
          </Card>
        );
      })}
    </Grid>
  );
}

export default DocumentList;