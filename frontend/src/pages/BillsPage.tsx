import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInvoiceList } from '../api';
import { useAuth } from '../contexts/AuthContext';
import BillsHeader from '../components/BillsHeader';
import BillsContent from '../components/BillsContent';
import type { Invoice } from '../types';

function BillsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [payingId, setPayingId] = useState<number | null>(null);

  const loadInvoices = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const list = await getInvoiceList();
      setInvoices(Array.isArray(list) ? list : []);
    } catch (err) {
      setError('We could not load your bills right now. Please try again in a moment.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    loadInvoices(false);
  }, [authLoading, user, loadInvoices]);

  const pending = useMemo(
    () => invoices.filter((invoice) => invoice.status === 'pending'),
    [invoices]
  );

  const totalDue = useMemo(
    () => pending.reduce((sum, invoice) => sum + (Number(invoice.total_amount) || 0), 0),
    [pending]
  );

  const handlePay = (invoice: Invoice) => {
    setPayingId(invoice.id);
    navigate(`/order-pay?order=${invoice.id}`);
  };

  return (
    <div className="ds-stack-lg">
      <BillsHeader
        pendingCount={pending.length}
        totalDue={totalDue}
        onRefresh={() => loadInvoices(true)}
        refreshing={refreshing}
      />
      <BillsContent
        invoices={invoices}
        loading={loading || authLoading}
        error={error}
        payingId={payingId}
        onPay={handlePay}
      />
    </div>
  );
}

export default BillsPage;