import { Section, Split, Stack, Card, CardBody, CardTitle, CardMeta, Button, Stat } from '../components/ui';
import { Icon } from '../components/icons';
import type { IconName } from '../components/icons';

interface HomeAboutProps {
  clinicName?: string;
  doctorCount?: number;
  serviceCount?: number;
  onBook?: () => void;
}

interface ValuePoint {
  icon: IconName;
  title: string;
  text: string;
}

const VALUES: ValuePoint[] = [
  {
    icon: 'calendar',
    title: 'Book on your own time',
    text: 'Pick a doctor and a slot from the patient portal, and see every upcoming visit in one place.',
  },
  {
    icon: 'book',
    title: 'Your records, always at hand',
    text: 'Visit notes, prescriptions and documents sit next to each other, so nothing gets lost between appointments.',
  },
  {
    icon: 'shield',
    title: 'Care that stays in-house',
    text: 'Bills are paid securely online, and prescriptions are approved by your doctor and filled by our own pharmacy.',
  },
];

function HomeAbout({ clinicName = 'Cedar Hollow Health', doctorCount = 0, serviceCount = 0, onBook }: HomeAboutProps) {
  return (
    <Section
      id="about"
      eyebrow="About us"
      title={`Why patients choose ${clinicName}`}
      subtitle="A neighborhood clinic with a connected patient portal, from the front desk to the pharmacy counter."
    >
      <Split>
        <Stack gap="md">
          <p className="ds-lead">
            {clinicName} brings everything about your care under one roof. Our doctors write up each visit,
            our reception team keeps your schedule and billing straight, and our in-house pharmacy fills the
            prescriptions your doctor approves.
          </p>
          <p className="ds-muted">
            The patient portal gives you the same clarity online: book appointments, read your visit notes,
            download documents, pay bills and order medicine without picking up the phone.
          </p>
          {(doctorCount > 0 || serviceCount > 0) && (
            <div className="ds-cluster">
              {doctorCount > 0 && <Stat value={doctorCount} label="Doctors on our team" icon="users" />}
              {serviceCount > 0 && <Stat value={serviceCount} label="Services offered" icon="heart" />}
            </div>
          )}
          <div className="ds-cluster">
            {onBook ? (
              <Button variant="primary" onClick={onBook}>
                Book an appointment
              </Button>
            ) : (
              <Button variant="primary" to="/register">
                Create your patient account
              </Button>
            )}
            <Button variant="ghost" to="/login">
              Sign in <Icon name="arrow-right" size={16} />
            </Button>
          </div>
        </Stack>

        <Stack gap="sm">
          {VALUES.map((point) => (
            <Card key={point.title}>
              <CardBody>
                <div className="ds-cluster">
                  <Icon name={point.icon} size={24} title={point.title} />
                  <CardTitle>{point.title}</CardTitle>
                </div>
                <CardMeta>{point.text}</CardMeta>
              </CardBody>
            </Card>
          ))}
        </Stack>
      </Split>
    </Section>
  );
}

export default HomeAbout;