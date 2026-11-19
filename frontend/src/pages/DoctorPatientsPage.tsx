import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPatientList } from '../api';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';
import DoctorPatientsHeader from '../components/DoctorPatientsHeader';
import DoctorPatientsContent from '../components/DoctorPatientsContent';

function DoctorPatientsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [patients, setPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const loadPatients = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const list = await getPatientList();
      setPatients(Array.isArray(list) ? list : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(message || 'We could not load your patients. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated) {
      return;
    }
    loadPatients(false);
  }, [authLoading, isAuthenticated, loadPatients]);

  const handleRefresh = () => {
    loadPatients(true);
  };

  const handleSelect = (patient: User) => {
    navigate(`/staff/doctor/patients/${patient.id}`);
  };

  return (
    <div className="ds-stack-lg">
      <DoctorPatientsHeader
        patientCount={patients.length}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
      <DoctorPatientsContent
        section="Content"
        page="DoctorPatientsPage"
        patients={patients}
        loading={loading || authLoading}
        error={error}
        onSelect={handleSelect}
      />
    </div>
  );
}

export default DoctorPatientsPage;
