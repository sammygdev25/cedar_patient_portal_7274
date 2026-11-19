import './App.css';
import type { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import { Footer } from './components/ui';
import { STAFF_ROLES, homeFor } from './lib/roles';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ProfilePage from './pages/ProfilePage';
import PatientDashboardPage from './pages/PatientDashboardPage';
import MyAppointmentsPage from './pages/MyAppointmentsPage';
import BookAppointmentPage from './pages/BookAppointmentPage';
import MedicalRecordsPage from './pages/MedicalRecordsPage';
import DocumentsPage from './pages/DocumentsPage';
import BillsPage from './pages/BillsPage';
import PharmacyPage from './pages/PharmacyPage';
import CartPage from './pages/CartPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import DoctorDashboardPage from './pages/DoctorDashboardPage';
import DoctorPatientsPage from './pages/DoctorPatientsPage';
import PatientDetailPage from './pages/PatientDetailPage';
import VisitNotePage from './pages/VisitNotePage';
import PrescriptionApprovalsPage from './pages/PrescriptionApprovalsPage';
import ReceptionDashboardPage from './pages/ReceptionDashboardPage';
import ReceptionAppointmentsPage from './pages/ReceptionAppointmentsPage';
import BillingManagementPage from './pages/BillingManagementPage';
import PharmacyDeskPage from './pages/PharmacyDeskPage';
import InventoryManagementPage from './pages/InventoryManagementPage';
import ReportsPage from './pages/ReportsPage';
import GoogleAuthDonePage from './pages/GoogleAuthDonePage';
import OrderPayPage from './pages/OrderPayPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import UnpaidNotice from './components/UnpaidNotice';

interface RequireAuthProps { children: ReactNode }

function RequireAuth({ children }: RequireAuthProps) {
  const auth = useAuth() as { isAuthenticated?: boolean; loading?: boolean };
  if (auth && auth.loading) {
    return null;
  }
  const authed = auth && typeof auth.isAuthenticated === 'boolean' ? auth.isAuthenticated : Boolean(localStorage.getItem('token'));
  if (!authed) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

interface RequireRoleProps { roles: readonly string[]; children: ReactNode }

function RequireRole({ roles, children }: RequireRoleProps) {
  const auth = useAuth() as { isAuthenticated?: boolean; loading?: boolean; user?: { role?: string } | null };
  if (auth && auth.loading) {
    return null;
  }
  if (auth == null || auth.isAuthenticated !== true) {
    return <Navigate to="/login" replace />;
  }
  const role = (auth.user && auth.user?.role) || '';
  if (roles.indexOf(role) < 0) {
    return <Navigate to={homeFor(role)} replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ErrorBoundary>
          <div className="ds-page">
            <Navbar />
            <main className="ds-page-main">
              <UnpaidNotice />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
                <Route path="/portal" element={<RequireRole roles={['patient']}><PatientDashboardPage /></RequireRole>} />
                <Route path="/portal/appointments" element={<RequireAuth><MyAppointmentsPage /></RequireAuth>} />
                <Route path="/portal/book" element={<RequireAuth><BookAppointmentPage /></RequireAuth>} />
                <Route path="/portal/records" element={<RequireAuth><MedicalRecordsPage /></RequireAuth>} />
                <Route path="/portal/documents" element={<RequireAuth><DocumentsPage /></RequireAuth>} />
                <Route path="/portal/bills" element={<RequireAuth><BillsPage /></RequireAuth>} />
                <Route path="/portal/pharmacy" element={<RequireAuth><PharmacyPage /></RequireAuth>} />
                <Route path="/portal/cart" element={<RequireAuth><CartPage /></RequireAuth>} />
                <Route path="/portal/orders" element={<RequireAuth><OrderHistoryPage /></RequireAuth>} />
                <Route path="/staff/doctor" element={<RequireRole roles={['doctor']}><DoctorDashboardPage /></RequireRole>} />
                <Route path="/staff/doctor/patients" element={<RequireRole roles={['doctor']}><DoctorPatientsPage /></RequireRole>} />
                <Route path="/staff/doctor/patients/:id" element={<RequireRole roles={['doctor']}><PatientDetailPage /></RequireRole>} />
                <Route path="/staff/doctor/appointments/:id/visit" element={<RequireRole roles={['doctor']}><VisitNotePage /></RequireRole>} />
                <Route path="/staff/doctor/approvals" element={<RequireRole roles={['doctor']}><PrescriptionApprovalsPage /></RequireRole>} />
                <Route path="/staff/reception" element={<RequireRole roles={STAFF_ROLES}><ReceptionDashboardPage /></RequireRole>} />
                <Route path="/staff/reception/appointments" element={<RequireRole roles={STAFF_ROLES}><ReceptionAppointmentsPage /></RequireRole>} />
                <Route path="/staff/reception/billing" element={<RequireRole roles={STAFF_ROLES}><BillingManagementPage /></RequireRole>} />
                <Route path="/staff/reception/pharmacy" element={<RequireRole roles={STAFF_ROLES}><PharmacyDeskPage /></RequireRole>} />
                <Route path="/staff/reception/stock" element={<RequireRole roles={STAFF_ROLES}><InventoryManagementPage /></RequireRole>} />
                <Route path="/staff/reception/reports" element={<RequireRole roles={STAFF_ROLES}><ReportsPage /></RequireRole>} />
                <Route path="/auth/google/done" element={<GoogleAuthDonePage />} />
                <Route path="/order-pay" element={<RequireAuth><OrderPayPage /></RequireAuth>} />
                <Route path="/payment-cancel" element={<PaymentCancelPage />} />
                <Route path="/payment-success" element={<RequireAuth><PaymentSuccessPage /></RequireAuth>} />
                <Route path="/dashboard" element={<HomePage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer brand="Cedar Patient Portal 7274" columns={[{ title: 'Explore', links: [{ label: 'Home', to: '/' }, { label: 'Reset Password', to: '/reset-password' }, { label: 'Verify Email', to: '/verify-email' }] }]} />
          </div>
        </ErrorBoundary>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
