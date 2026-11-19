import { Badge, Button, PageHeader } from '../components/ui';
import { Icon } from '../components/icons';

interface CartHeaderProps {
  itemCount?: number;
  onClear?: () => void;
}

export default function CartHeader({ itemCount = 0, onClear }: CartHeaderProps) {
  const count = Math.max(0, Math.floor(Number(itemCount) || 0));
  const hasItems = count > 0;
  const noun = count === 1 ? 'item' : 'items';

  const subtitle = hasItems
    ? `${count} ${noun} from the Cedar Hollow in-house pharmacy. Choose pickup at the clinic or home delivery at checkout.`
    : 'Your cart is empty. Browse over-the-counter medicines from the Cedar Hollow in-house pharmacy to get started.';

  return (
    <PageHeader
      eyebrow="Cedar Hollow Pharmacy"
      title="Your cart"
      subtitle={subtitle}
      actions={
        <div className="ds-cluster">
          <Badge tone={hasItems ? 'primary' : 'neutral'}>
            <Icon name="cart" size={14} title="Cart" /> {count} {noun}
          </Badge>
          <Button to="/portal/pharmacy" variant="secondary">
            <Icon name="arrow-left" size={16} /> Continue shopping
          </Button>
          {hasItems && onClear && (
            <Button variant="ghost" onClick={onClear}>
              <Icon name="trash" size={16} /> Clear cart
            </Button>
          )}
        </div>
      }
    />
  );
}