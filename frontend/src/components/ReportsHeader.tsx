import type { ReactNode } from 'react';
import { PageHeader, Badge } from '../components/ui';
import { Icon } from '../components/icons';

interface ReportsHeaderProps {
  section?: string;
  page?: string;
  actions?: ReactNode;
}

export default function ReportsHeader({ actions }: ReportsHeaderProps) {
  return (
    <PageHeader
      eyebrow="Reception desk"
      title="Monthly reports"
      subtitle="Export a CSV of Cedar Hollow Health appointments and bills for any year and month, ready for reconciliation and clinic reviews."
      actions={
        actions ?? (
          <Badge tone="soft">
            <Icon name="shield" size={14} /> Reception only
          </Badge>
        )
      }
    />
  );
}