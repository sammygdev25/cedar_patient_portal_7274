import type { DoctorProfile } from '../types';
import { Badge, Button, Card, CardBody, CardFooter, CardMeta, CardTitle, Media } from '../components/ui';
import { Icon } from '../components/icons';

interface DoctorCardProps {
  doctor: DoctorProfile;
  onBook?: (doctor: DoctorProfile) => void;
}

const BIO_PREVIEW_LENGTH = 140;

function previewBio(bio: string): string {
  if (!bio) return '';
  if (bio.length <= BIO_PREVIEW_LENGTH) return bio;
  return `${bio.slice(0, BIO_PREVIEW_LENGTH).trimEnd()}…`;
}

function DoctorCard({ doctor, onBook }: DoctorCardProps) {
  const accepting = doctor.accepts_new_patients;

  return (
    <Card>
      <Media
        src={doctor.photo || undefined}
        alt={`Portrait of ${doctor.full_name}`}
        ratio="portrait"
        badge={accepting ? 'Accepting new patients' : undefined}
      />
      <CardBody>
        <CardTitle>{doctor.full_name}</CardTitle>
        <CardMeta>
          <Icon name="award" size={16} /> {doctor.specialty}
        </CardMeta>
        <CardMeta>
          <Icon name="clock" size={16} /> {doctor.consultation_minutes} min consultations
        </CardMeta>
        {doctor.bio ? <p className="ds-small ds-muted">{previewBio(doctor.bio)}</p> : null}
      </CardBody>
      <CardFooter>
        <Badge tone={accepting ? 'success' : 'neutral'}>
          {accepting ? 'New patients welcome' : 'Existing patients only'}
        </Badge>
        {onBook ? (
          <Button
            variant="primary"
            onClick={() => onBook(doctor)}
            disabled={!accepting}
            title={accepting ? `Book with ${doctor.full_name}` : 'Not accepting new patients'}
          >
            Book visit
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}

export default DoctorCard;