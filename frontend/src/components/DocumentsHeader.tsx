import type { ReactNode } from 'react';
import { PageHeader, Button, Badge, Cluster } from '../components/ui';
import { Icon } from '../components/icons';

interface DocumentsHeaderProps {
  section?: string;
  page?: string;
  documentCount?: number;
  onUploadClick?: () => void;
  children?: ReactNode;
}

export default function DocumentsHeader({
  documentCount,
  onUploadClick,
  children,
}: DocumentsHeaderProps) {
  const countLabel =
    typeof documentCount === 'number'
      ? `${documentCount} ${documentCount === 1 ? 'file' : 'files'} on record`
      : null;

  const actions = onUploadClick ? (
    <Button variant="primary" onClick={onUploadClick}>
      <Icon name="upload" size={18} /> Upload a document
    </Button>
  ) : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Patient portal"
        title="My documents"
        subtitle="Keep your insurance card and lab results on file with Cedar Hollow Health. Only you can see, download or delete what you upload here."
        actions={actions}
      />
      <Cluster gap="sm">
        <Badge tone="soft">
          <Icon name="shield" size={14} /> Private to your account
        </Badge>
        <Badge tone="neutral">
          <Icon name="download" size={14} /> PDF, JPEG, PNG or WebP
        </Badge>
        <Badge tone="neutral">
          <Icon name="info" size={14} /> Up to 10 MB per file
        </Badge>
        {countLabel !== null && typeof documentCount === 'number' && documentCount > 0 && (
          <Badge tone="primary">
            <Icon name="book" size={14} /> {countLabel}
          </Badge>
        )}
      </Cluster>
      {children}
    </>
  );
}
