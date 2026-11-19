import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getOrderList, updateOrder } from '../api';
import { useAuth } from '../contexts/AuthContext';
import PharmacyDeskHeader from '../components/PharmacyDeskHeader';
import PharmacyDeskContent from '../components/PharmacyDeskContent';
import { Alert, LoadingBlock } from '../components/ui';
import type { Order } from '../types';

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Pending payment',
  received: 'Received',
  approved: 'Approved',
  packed: 'Packed',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

function errorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const maybe = err as { message?: unknown; response?: { data?: { detail?: unknown } } };
    const detail = maybe.response?.data?.detail;
    if (typeof detail === 'string' && detail) return detail;
    if (typeof maybe.message === 'string' && maybe.message) return maybe.message;
  }
  return fallback;
}

function PharmacyDeskPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const role = (user as { role?: string } | null)?.role;
  const isReceptionist = role === 'receptionist';

  const loadOrders = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const list = await getOrderList();
      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(errorMessage(err, 'Could not load pharmacy orders. Please try again.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isReceptionist) return;
    loadOrders(false);
  }, [authLoading, isReceptionist, loadOrders]);

  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccess(message);
    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccess(''), 2000);
  }, []);

  const handleSelect = useCallback((id: number) => {
    setSelectedId((current) => (current === id ? null : id));
  }, []);

  const handleChangeStatus = useCallback(
    async (order: Order, status: string) => {
      setUpdating(true);
      setError('');
      setSuccess('');
      try {
        const updated = await updateOrder(order.id, { status } as Partial<Order>);
        setOrders((current) =>
          current.map((item) => (item.id === order.id ? { ...item, ...updated } : item))
        );
        showSuccess(`Order #${order.id} marked as ${STATUS_LABELS[status] || status}`);
      } catch (err) {
        setError(errorMessage(err, `Could not update order #${order.id}.`));
      } finally {
        setUpdating(false);
      }
    },
    [showSuccess]
  );

  const handleRefresh = useCallback(() => {
    loadOrders(true);
  }, [loadOrders]);

  const counts = useMemo(() => {
    const list = Array.isArray(orders) ? orders : [];
    return {
      total: list.length,
      awaitingApproval: list.filter(
        (o) => o.order_type === 'prescription' && o.status === 'received'
      ).length,
      readyToPack: list.filter((o) => o.status === 'approved').length,
      outForDelivery: list.filter((o) => o.status === 'out_for_delivery').length,
    };
  }, [orders]);

  if (authLoading) {
    return <LoadingBlock label="Checking your access..." />;
  }

  if (!isReceptionist) {
    return (
      <div className="ds-container ds-section">
        <Alert tone="danger">
          The pharmacy desk is only available to Cedar Hollow Health reception staff.
        </Alert>
      </div>
    );
  }

  return (
    <div className="ds-stack-lg">
      <PharmacyDeskHeader
        totalOrders={counts.total}
        awaitingApproval={counts.awaitingApproval}
        readyToPack={counts.readyToPack}
        outForDelivery={counts.outForDelivery}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />
      {success && (
        <div className="ds-container">
          <Alert tone="success">{success}</Alert>
        </div>
      )}
      <PharmacyDeskContent
        orders={orders}
        loading={loading}
        error={error}
        selectedId={selectedId}
        updating={updating}
        onSelect={handleSelect}
        onChangeStatus={handleChangeStatus}
        onRefresh={handleRefresh}
      />
    </div>
  );
}

export default PharmacyDeskPage;