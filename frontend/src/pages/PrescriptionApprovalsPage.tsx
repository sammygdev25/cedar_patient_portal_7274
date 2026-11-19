import { useCallback, useEffect, useRef, useState } from 'react';
import { getOrderList, updateOrder } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Alert } from '../components/ui';
import PrescriptionApprovalsHeader from '../components/PrescriptionApprovalsHeader';
import PrescriptionApprovalsContent from '../components/PrescriptionApprovalsContent';
import type { Order } from '../types';

function describeError(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    const maybe = err as { response?: { data?: { detail?: string } }; message?: string };
    const detail = maybe.response?.data?.detail;
    if (detail) return detail;
    if (maybe.message) return maybe.message;
  }
  return fallback;
}

function PrescriptionApprovalsPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const successTimer = useRef<number | null>(null);

  const role = (user as unknown as { role?: string } | null)?.role;
  const notDoctor = Boolean(user && role && role !== 'doctor');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getOrderList();
      const all: Order[] = Array.isArray(list) ? list : [];
      setOrders(
        all.filter(
          (order) => order.order_type === 'prescription' && order.status === 'received'
        )
      );
    } catch (err) {
      setError(describeError(err, 'Could not load prescription orders awaiting approval.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    return () => {
      if (successTimer.current !== null) window.clearTimeout(successTimer.current);
    };
  }, [loadOrders]);

  const flashSuccess = (message: string) => {
    setSuccess(message);
    if (successTimer.current !== null) window.clearTimeout(successTimer.current);
    successTimer.current = window.setTimeout(() => setSuccess(''), 2000);
  };

  const decide = async (orderId: number, status: 'approved' | 'rejected') => {
    setBusyId(orderId);
    setError('');
    try {
      await updateOrder(orderId, { status } as Partial<Order>);
      setOrders((current) => current.filter((order) => order.id !== orderId));
      flashSuccess(status === 'approved' ? 'Prescription approved' : 'Prescription rejected');
    } catch (err) {
      setError(
        describeError(
          err,
          status === 'approved'
            ? 'Could not approve this prescription order.'
            : 'Could not reject this prescription order.'
        )
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleApprove = (orderId: number) => {
    decide(orderId, 'approved');
  };

  const handleReject = (orderId: number) => {
    decide(orderId, 'rejected');
  };

  return (
    <div className="ds-stack-lg">
      <PrescriptionApprovalsHeader
        section="Page header"
        page="PrescriptionApprovalsPage"
        pendingCount={orders.length}
        loading={loading}
        onRefresh={loadOrders}
      />
      {notDoctor && (
        <div className="ds-container">
          <Alert tone="danger">
            Prescription approvals are only available to the prescribing doctor.
          </Alert>
        </div>
      )}
      {success && (
        <div className="ds-container">
          <Alert tone="success">{success}</Alert>
        </div>
      )}
      <PrescriptionApprovalsContent
        orders={orders}
        loading={loading}
        error={error}
        busyId={busyId}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </div>
  );
}

export default PrescriptionApprovalsPage;