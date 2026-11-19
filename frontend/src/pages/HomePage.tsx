import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getServiceList, getDoctorProfileList } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Alert } from '../components/ui';
import HomeHero from '../components/HomeHero';
import HomeFeatured from '../components/HomeFeatured';
import HomeCategories from '../components/HomeCategories';
import HomeAbout from '../components/HomeAbout';
import HomeCta from '../components/HomeCta';
import type { Service, DoctorProfile } from '../types';

const CLINIC_NAME = 'Cedar Hollow Health';

function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [serviceList, doctorList] = await Promise.all([
          getServiceList(),
          getDoctorProfileList(),
        ]);
        if (cancelled) return;
        setServices(Array.isArray(serviceList) ? serviceList : []);
        setDoctors(Array.isArray(doctorList) ? doctorList : []);
      } catch (err) {
        if (cancelled) return;
        setError('We could not load our services right now. Please try again shortly.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeServices = useMemo<Service[]>(
    () => services.filter((service) => service.is_active),
    [services]
  );

  const featuredServices = useMemo<Service[]>(
    () => activeServices.slice(0, 8),
    [activeServices]
  );

  const heroImage = useMemo<string | undefined>(() => {
    const withPhoto = doctors.find((doctor) => Boolean(doctor.photo));
    return withPhoto && withPhoto.photo ? String(withPhoto.photo) : undefined;
  }, [doctors]);

  const goToBooking = () => {
    navigate(isAuthenticated ? '/portal/book' : '/register');
  };

  const handleSelectService = (service: Service) => {
    if (isAuthenticated) {
      navigate(`/portal/book?service=${service.slug}`);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="ds-stack-lg">
      <HomeHero
        section="Hero"
        page="HomePage"
        imageUrl={heroImage ?? '/img/brand/hero.jpg'}
        imageAlt="A Cedar Hollow Health doctor"
        isAuthenticated={isAuthenticated}
      />
      {error && (
        <div className="ds-container">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
      <HomeFeatured
        services={featuredServices}
        loading={loading}
        onSelectService={handleSelectService}
      />
      <HomeCategories services={activeServices} onBrowseAll={goToBooking} />
      <HomeAbout
        clinicName={CLINIC_NAME}
        doctorCount={doctors.length}
        serviceCount={activeServices.length}
        onBook={goToBooking}
      />
      <HomeCta
        clinicName={CLINIC_NAME}
        isAuthenticated={isAuthenticated}
        onBrowse={goToBooking}
      />
    </div>
  );
}

export default HomePage;