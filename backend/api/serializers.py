"""Serializers aggregator — explicit imports from domain files."""
from .serializers_appointments import AppointmentSerializer, AvailabilitySerializer, UserSerializer  # noqa: F401
from .serializers_auth import LoginSerializer, RegisterSerializer  # noqa: F401
from .serializers_billing import InvoiceSerializer  # noqa: F401
from .serializers_clinical import PrescriptionSerializer, VisitNoteSerializer  # noqa: F401
from .serializers_core import ClinicHourSerializer, ContactMessageSerializer, DoctorProfileSerializer, ServiceSerializer  # noqa: F401
from .serializers_documents import MedicalDocumentSerializer  # noqa: F401
from .serializers_pharmacy import OrderItemSerializer, OrderSerializer, ProductSerializer  # noqa: F401
from .serializers_reports import MonthlyReportInvoiceSerializer, MonthlyReportSerializer  # noqa: F401
