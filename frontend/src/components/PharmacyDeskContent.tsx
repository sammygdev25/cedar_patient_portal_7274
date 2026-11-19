import { useMemo, useState } from 'react';
import type { Order, OrderItem } from '../types';
import { Alert, Badge, Button, Card, CardBody, CardMeta, CardTitle, EmptyState, Price, Section, SkeletonCards, Split, Stack, Cluster } from '../components/ui';
import { Icon } from '../components/icons';
import OrderDeskTable from './OrderDeskTable';
import OrderStatusControl from './OrderStatusControl';

interface PharmacyDeskContentProps {
  orders: Order[];
  loading: boolean;
  error?: string;
  selectedId: number | null;
  updating: boolean;
  onSelect: (id: number) => void;
  onChangeStatus: (order: Order, status: string) => void;
  onRefresh?: () => void;
}

const FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All orders' },
  { value: 'received', label: 'Received' },
  { value: 'approved', label: 'Approved' },
  { value: 'packed', label: 'Packed' },
  { value: 'out_for_delivery', label: 'Out for delivery' },
  { value: 'delivered', label: 'Delivered' },
];

type OrderWithItems = Order & { items?: OrderItem[] };

function PharmacyDeskContent({
  orders,
  loading,
  error,
  selectedId,
  updating,
  onSelect,
  onChangeStatus,
  onRefresh,
}: PharmacyDeskContentProps) {
  const [filter, setFilter] = useState<string>('all');

  const safeOrders: Order[] = Array.isArray(orders) ? orders : [];
  const visible = useMemo(
    () => (filter === 'all' ? safeOrders : safeOrders.filter((o) => o.status === filter)),
    [safeOrders, filter]
  );
  const selected = (safeOrders.find((o) => o.id === selectedId) as OrderWithItems | undefined) || undefined;
  const items: OrderItem[] = selected && Array.isArray(selected.items) ? selected.items : [];

  const handleSelect = (arg: Order | number) => onSelect(typeof arg === 'number' ? arg : arg.id);
  const handleStatus = (...args: unknown[]) => {
    const status = args.find((a): a is string => typeof a === 'string');
    if (selected && status) onChangeStatus(selected, status);
  };

  return (
    <Section
      eyebrow="Pharmacy desk"
      title="Orders from every patient"
      subtitle="Move each order from received to delivered. Prescription orders only show the medicine name and must be approved by the prescribing doctor before packing."
      actions={
        onRefresh ? (
          <Button variant="secondary" onClick={onRefresh}>
            <Icon name="refresh" size={16} /> Refresh
          </Button>
        ) : undefined
      }
    >
      <Stack gap="md">
        <Cluster gap="sm">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              variant={filter === f.value ? 'primary' : 'ghost'}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </Button>
          ))}
        </Cluster>

        {error && <Alert tone="danger">{error}</Alert>}

        {loading ? (
          <SkeletonCards count={3} />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="package"
            title={filter === 'all' ? 'No pharmacy orders yet' : 'No orders with this status'}
            text="New orders from the patient portal will appear here as soon as they are paid."
            action={
              filter !== 'all' ? (
                <Button variant="secondary" onClick={() => setFilter('all')}>
                  Show all orders
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Split>
            <OrderDeskTable orders={visible} onSelect={handleSelect} selectedId={selectedId as number} />
            {selected ? (
              <Card>
                <CardBody>
                  <CardTitle>Order #{selected.id}</CardTitle>
                  <CardMeta>
                    <Badge tone="soft">{selected.order_type === 'prescription' ? 'Prescription' : 'Over the counter'}</Badge>{' '}
                    <Badge tone="neutral">{selected.fulfillment_method === 'delivery' ? 'Home delivery' : 'Pickup'}</Badge>
                  </CardMeta>
                  <Stack gap="sm">
                    {items.map((item) => (
                      <Cluster key={item.id} justify="between">
                        <span>{item.medicine_name} × {item.quantity}</span>
                        <Price value={Number(item.unit_price) * item.quantity} />
                      </Cluster>
                    ))}
                    <Cluster justify="between">
                      <strong>Total</strong>
                      <Price value={Number(selected.total_amount)} />
                    </Cluster>
                    {selected.fulfillment_method === 'delivery' && (
                      <p className="ds-small ds-muted">
                        <Icon name="map-pin" size={14} /> {selected.delivery_address || 'No address given'}
                        {selected.phone ? ` · ${selected.phone}` : ''}
                      </p>
                    )}
                  </Stack>
                  <OrderStatusControl order={selected} onChangeStatus={handleStatus} updating={updating} />
                </CardBody>
              </Card>
            ) : (
              <EmptyState
                icon="list"
                title="Select an order"
                text="Choose an order from the table to see its items and update its progress."
              />
            )}
          </Split>
        )}
      </Stack>
    </Section>
  );
}

export default PharmacyDeskContent;