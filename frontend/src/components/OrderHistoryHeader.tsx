import { PageHeader, Button, Badge } from '../components/ui';
import { Icon } from '../components/icons';
import { useAuth } from '../contexts/AuthContext';

interface HeaderUser {
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface OrderHistoryHeaderProps {
  section?: string;
  page?: string;
  user?: HeaderUser | null;
  userName?: string;
  userEmail?: string;
  orderCount?: number;
}

function resolveName(user: HeaderUser | null | undefined, userName?: string): string {
  if (userName && userName.trim()) return userName.trim();
  if (user) {
    const full = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    if (full) return full;
  }
  return '';
}

export default function OrderHistoryHeader({
  user,
  userName,
  userEmail,
  orderCount,
}: OrderHistoryHeaderProps) {
  const auth = useAuth();
  const authUser = (auth.user || null) as HeaderUser | null;
  const activeUser = user || authUser;

  const name = resolveName(activeUser, userName);
  const email = userEmail || activeUser?.email || '';
  const who = name || email;

  const subtitle = who
    ? `Pharmacy orders for ${who}${name && email ? ` (${email})` : ''}. Follow each order from payment and doctor approval through packing to pickup or delivery.`
    : 'Follow each pharmacy order from payment and doctor approval through packing to pickup or delivery.';

  const actions = (
    <>
      {typeof orderCount === 'number' && (
        <Badge tone="soft">
          {orderCount} {orderCount === 1 ? 'order' : 'orders'}
        </Badge>
      )}
      <Button to="/portal/pharmacy" variant="primary">
        <Icon name="package" size={16} />
        Browse pharmacy
      </Button>
      <Button to="/portal/cart" variant="secondary">
        <Icon name="cart" size={16} />
        View cart
      </Button>
    </>
  );

  return (
    <PageHeader
      eyebrow="Cedar Hollow Pharmacy"
      title="My orders"
      subtitle={subtitle}
      actions={actions}
    />
  );
}