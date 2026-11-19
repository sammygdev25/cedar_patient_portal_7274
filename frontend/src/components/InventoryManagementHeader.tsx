import { PageHeader, Button, Badge } from '../components/ui';
import { Icon } from '../components/icons';

interface InventoryManagementHeaderProps {
  totalProducts?: number;
  lowStockCount?: number;
  outOfStockCount?: number;
  onAddProduct?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
}

function InventoryManagementHeader({
  totalProducts = 0,
  lowStockCount = 0,
  outOfStockCount = 0,
  onAddProduct,
  onRefresh,
  refreshing = false,
}: InventoryManagementHeaderProps) {
  const subtitle =
    'Keep the Cedar Hollow pharmacy shelves accurate. Update prices and stock levels, ' +
    'mark medicines out of stock, and add new over-the-counter products to the patient catalog.';

  return (
    <PageHeader
      eyebrow="Reception · Pharmacy stock"
      title="Pharmacy inventory"
      subtitle={subtitle}
      actions={
        <div className="ds-cluster">
          <Badge tone="soft">
            {totalProducts} {totalProducts === 1 ? 'product' : 'products'}
          </Badge>
          {lowStockCount > 0 && (
            <Badge tone="primary">{lowStockCount} low on stock</Badge>
          )}
          {outOfStockCount > 0 && (
            <Badge tone="danger">{outOfStockCount} out of stock</Badge>
          )}
          {onRefresh && (
            <Button
              variant="ghost"
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
            >
              <Icon name="refresh" size={16} /> {refreshing ? 'Refreshing' : 'Refresh'}
            </Button>
          )}
          {onAddProduct && (
            <Button variant="primary" type="button" onClick={onAddProduct}>
              <Icon name="plus" size={16} /> Add product
            </Button>
          )}
        </div>
      }
    />
  );
}

export default InventoryManagementHeader;