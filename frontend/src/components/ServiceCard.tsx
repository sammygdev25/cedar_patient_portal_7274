import type { ComponentProps } from 'react';
import { Badge, Button, Card, CardBody, CardFooter, CardMeta, CardTitle } from './ui';
import { Icon } from './icons';
import type { Service } from '../types';

type IconName = ComponentProps<typeof Icon>['name'];

interface ServiceCardProps {
  service: Service;
}

const KNOWN_ICONS: ReadonlySet<string> = new Set([
  'search', 'cart', 'user', 'users', 'menu', 'close', 'plus', 'minus', 'trash', 'edit', 'check',
  'star', 'heart', 'home', 'book', 'tag', 'filter', 'grid', 'list', 'calendar', 'clock', 'mail',
  'phone', 'map-pin', 'info', 'alert', 'package', 'truck', 'credit-card', 'dollar', 'settings',
  'eye', 'download', 'upload', 'image', 'refresh', 'shield', 'bell', 'sun', 'moon', 'award',
  'message', 'sparkle',
]);

const MAX_DESCRIPTION_LENGTH = 140;

function resolveIcon(icon: string | undefined | null): IconName {
  const key = (icon || '').trim().toLowerCase();
  return (KNOWN_ICONS.has(key) ? key : 'heart') as IconName;
}

function summarize(text: string | undefined | null): string {
  const clean = (text || '').trim();
  if (clean.length <= MAX_DESCRIPTION_LENGTH) return clean;
  return `${clean.slice(0, MAX_DESCRIPTION_LENGTH).trimEnd()}…`;
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const description = summarize(service.description);

  return (
    <Card>
      <CardBody>
        <div className="ds-cluster">
          <Badge tone="soft">
            <Icon name={resolveIcon(service.icon)} size={16} />
          </Badge>
          {!service.is_active && <Badge tone="neutral">Currently unavailable</Badge>}
        </div>
        <CardTitle>{service.name}</CardTitle>
        <CardMeta>
          <Icon name="clock" size={14} /> {service.duration_minutes} min appointment
        </CardMeta>
        {description && <p className="ds-muted">{description}</p>}
      </CardBody>
      <CardFooter>
        {service.is_active ? (
          <Button to="/portal/book" variant="secondary">
            Book this service
            <Icon name="arrow-right" size={16} />
          </Button>
        ) : (
          <span className="ds-small ds-muted">Ask reception about availability</span>
        )}
      </CardFooter>
    </Card>
  );
}