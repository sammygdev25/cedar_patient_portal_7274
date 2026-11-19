import { PageHeader, Button } from '../components/ui';
import { Icon } from '../components/icons';

interface BookAppointmentHeaderProps {
  section?: string;
  page?: string;
  isStaff?: boolean;
  backTo?: string;
  backLabel?: string;
}

export default function BookAppointmentHeader({
  isStaff = false,
  backTo = '/portal/appointments',
  backLabel = 'My appointments',
}: BookAppointmentHeaderProps) {
  const title = isStaff ? 'Book a patient visit' : 'Book an appointment';
  const subtitle = isStaff
    ? 'Choose a patient, a Cedar Hollow Health doctor and an open time slot to add the visit to the schedule.'
    : 'Pick a doctor, a service and an open time slot at Cedar Hollow Health. Your email must be verified before you can book.';

  return (
    <PageHeader
      eyebrow="Cedar Hollow Health"
      title={title}
      subtitle={subtitle}
      actions={
        <Button variant="ghost" to={backTo}>
          <Icon name="arrow-left" size={16} />
          {backLabel}
        </Button>
      }
    />
  );
}