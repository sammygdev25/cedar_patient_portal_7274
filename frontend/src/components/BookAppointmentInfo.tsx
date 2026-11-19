import { Section, Grid, Card, CardBody, CardTitle, CardMeta, Button, Stack } from '../components/ui';
import { Icon } from '../components/icons';

interface BookAppointmentInfoProps {
  section?: string;
  page?: string;
}

interface InfoItem {
  icon: 'mail' | 'clock' | 'check' | 'calendar';
  title: string;
  text: string;
}

const ITEMS: InfoItem[] = [
  {
    icon: 'mail',
    title: 'Verify your email first',
    text: 'Booking is open to patients with a verified email address. If you have not confirmed yours yet, use the link we sent when you registered.',
  },
  {
    icon: 'clock',
    title: 'Pick a slot that suits you',
    text: 'Choose a doctor and a service, then select an open time. Each slot is held for one patient only, so a time you can pick is a time that is free.',
  },
  {
    icon: 'check',
    title: 'What happens next',
    text: 'Arrive a few minutes early and our reception team will check you in. Your doctor sees the check-in right away and can open your visit notes.',
  },
  {
    icon: 'calendar',
    title: 'Plans change',
    text: 'You can reschedule or cancel your own appointment at any time from My appointments. Bills and prescriptions from the visit appear in your portal afterwards.',
  },
];

function BookAppointmentInfo({ section = 'Good to know', page }: BookAppointmentInfoProps) {
  return (
    <Section
      tight
      eyebrow={page ? undefined : 'Cedar Hollow Health'}
      title={section}
      subtitle="A few things to keep in mind before you confirm your booking."
    >
      <Grid size="sm">
        {ITEMS.map((item) => (
          <Card key={item.title}>
            <CardBody>
              <Stack gap="sm">
                <Icon name={item.icon} size={24} />
                <CardTitle>{item.title}</CardTitle>
                <CardMeta>{item.text}</CardMeta>
              </Stack>
            </CardBody>
          </Card>
        ))}
      </Grid>
      <Stack gap="sm" align="start">
        <Button variant="ghost" to="/portal/appointments">
          View my appointments
        </Button>
      </Stack>
    </Section>
  );
}

export default BookAppointmentInfo;