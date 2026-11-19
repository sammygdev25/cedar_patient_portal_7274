"""Views aggregator — explicit imports from domain view files."""
from .views_appointments import AppointmentViewSet, AvailabilityView, DoctorListView, clinic_window, get_duration_minutes, get_role, parse_aware_datetime, within_clinic_hours  # noqa: F401
from .views_auth import CustomAuthToken, LogoutAllView, LogoutView, ProfileView, RegisterView  # noqa: F401
from .views_billing import InvoiceViewSet, IsReceptionist  # noqa: F401
from .views_clinical import IsPatientOrDoctor, PrescriptionViewSet, VisitNoteViewSet  # noqa: F401
from .views_core import ClinicHourViewSet, ContactMessageViewSet, DoctorProfileViewSet, IsReceptionistOrReadOnly, ServiceViewSet  # noqa: F401
from .views_documents import IsPatientUser, MedicalDocumentViewSet, validate_uploaded_file  # noqa: F401
from .views_people import PeopleView, listable_roles  # noqa: F401
from .views_pharmacy import IsReceptionOrReadOnly, OrderViewSet, ProductViewSet, is_doctor, is_reception, restore_stock, user_role  # noqa: F401
from .views_reports import MonthlyReportView  # noqa: F401
