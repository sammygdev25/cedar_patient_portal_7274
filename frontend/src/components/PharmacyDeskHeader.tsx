import { PageHeader, Button, Grid, Stat } from '../components/ui';
import { Icon } from '../components/icons';

interface PharmacyDeskHeaderProps {
  totalOrders?: number;
  awaitingApproval?: number;
  readyToPack?: number;
  outForDelivery?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
}

function PharmacyDeskHeader({
  totalOrders = 0,
  awaitingApproval = 0,
  readyToPack = 0,
  outForDelivery = 0,
  refreshing = false,
  onRefresh,
}: PharmacyDeskHeaderProps) {
  return (
    <>
      <PageHeader
        eyebrow="Reception · In-house pharmacy"
        title="Pharmacy desk"
        subtitle="Every Cedar Hollow Health pharmacy order in one place. Move orders from received to approved, packed, out for delivery and delivered. Prescription orders show the medicine name only and wait for the prescribing doctor's approval before packing."
        actions={
          onRefresh ? (
            <Button variant="secondary" onClick={onRefresh} disabled={refreshing}>
              <Icon name="refresh" size={16} />
              {refreshing ? 'Refreshing...' : 'Refresh orders'}
            </Button>
          ) : undefined
        }
      />
      <Grid size="sm">
        <Stat value={String(totalOrders)} label="Orders on the desk" icon="package" />
        <Stat value={String(awaitingApproval)} label="Awaiting doctor approval" icon="clock" />
        <Stat value={String(readyToPack)} label="Ready to pack" icon="check" />
        <Stat value={String(outForDelivery)} label="Out for delivery" icon="truck" />
      </Grid>
    </>
  );
}

export default PharmacyDeskHeader;