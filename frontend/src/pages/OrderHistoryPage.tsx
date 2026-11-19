import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Stack } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { getOrderList, updateOrder } from '../api';
import type { Order } from '../types';
import OrderHistoryHeader from '../components/OrderHistoryHeader';
import OrderHistoryContent from '../components/OrderHistoryContent';
import OrderHistoryDetails from '../components/OrderHistoryDetails';

const CLOSED_STATUSES = ['delivered', 'rejected', 'cancelled'];

function readText(source: Record<string, unknown> | null, key: string): string {
  if (!source) return '';
  const value = source[key];
  return typeof value === 'string' ? value : '';
}

function OrderHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [notice, setNotice] = useState<string>('');

  const profile = user ? (user as unknown as Record<string, unknown>) : null;
  const userId = profile && typeof profile.id === 'number' ? profile.id : null;
  const firstName = readText(profile, 'first_name');
  const lastName = readText(profile, 'last_name');
  const userEmail = readText(profile, 'email');
  const userPhone = readText(profile, 'phone');
  const userName = `${firstName} ${lastName}`.trim();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getOrderList();
      const all: Order[] = Array.isArray(list) ? list : [];
      const own =
        userId === null
          ? all
          : all.filter((order) => {
              const owner = (order as unknown as Record<string, unknown>).user;
              return typeof owner !== 'number' || owner === userId;
            });
      setOrders(own);
    } catch {
      setError('We could not load your pharmacy orders. Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 2000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const handlePay = useCallback(
    (order: Order) => {
      navigate(`/order-pay?order=${order.id}`);
    },
    [navigate]
  );

  const handleCancel = useCallback(
    async (order: Order) => {
      setError('');
      try {
        await updateOrder(order.id, { status: 'cancelled' });
        setNotice('Order cancelled');
        await loadOrders();
      } catch {
        setError('That order could not be cancelled. It may already be in preparation.');
      }
    },
    [loadOrders]
  );

  const openOrderCount = useMemo(
    () => orders.filter((order) => !CLOSED_STATUSES.includes(String(order.status))).length,
    [orders]
  );

  return (
    <Stack gap="lg">
      <OrderHistoryHeader
        section="Page header"
        page="OrderHistoryPage"
        userName={userName}
        userEmail={userEmail}
        orderCount={orders.length}
      />
      {error && (
        <div className="ds-container">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
      {notice && (
        <div className="ds-container">
          <Alert tone="success">{notice}</Alert>
        </div>
      )}
      <OrderHistoryContent
        orders={orders}
        loading={loading}
        onPay={handlePay}
        onCancel={handleCancel}
      />
      <OrderHistoryDetails
        section="Account details"
        page="OrderHistoryPage"
        name={userName}
        email={userEmail}
        phone={userPhone}
        orderCount={orders.length}
        openOrderCount={openOrderCount}
      />
    </Stack>
  );
}

export default OrderHistoryPage;