import { Section, Grid, Card, CardBody, CardTitle, CardMeta, CardFooter, Badge, Cluster } from '../components/ui';
import { Icon } from '../components/icons';
import type { Service } from '../types';

interface VisitNoteRelatedProps {
  section?: string;
  page?: string;
  services: Service[];
  currentServiceId?: number | null;
  onSelect?: (service: Service) => void;
}

const MAX_ITEMS = 6;

function shorten(text: string | undefined, limit: number): string {
  if (!text) return '';
  return text.length > limit ? `${text.slice(0, limit).trim()}...` : text;
}

export default function VisitNoteRelated({
  services,
  currentServiceId = null,
  onSelect,
}: VisitNoteRelatedProps) {
  const list = (Array.isArray(services) ? services : [])
    .filter((service) => service.is_active !== false && service.id !== currentServiceId)
    .slice(0, MAX_ITEMS);

  if (list.length === 0) return null;

  return (
    <Section
      eyebrow="Follow-up care"
      title="Related services"
      subtitle="Other Cedar Hollow Health services this patient may need after today's visit. Pick one when arranging a follow-up."
    >
      <Grid size="sm">
        {list.map((service) => (
          <Card key={service.id} onClick={onSelect ? () => onSelect(service) : undefined}>
            <CardBody>
              <Cluster gap="sm" align="center">
                <Icon name="package" size={18} />
                <CardTitle>{service.name}</CardTitle>
              </Cluster>
              <CardMeta>
                {shorten(service.description, 110) || 'Available at the clinic by appointment.'}
              </CardMeta>
            </CardBody>
            <CardFooter>
              <Badge tone="soft">
                <Icon name="clock" size={14} /> {service.duration_minutes} min
              </Badge>
              {onSelect && (
                <span className="ds-small ds-muted">
                  Book follow-up <Icon name="arrow-right" size={14} />
                </span>
              )}
            </CardFooter>
          </Card>
        ))}
      </Grid>
    </Section>
  );
}