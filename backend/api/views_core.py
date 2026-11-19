from django.db.models import QuerySet
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import SAFE_METHODS, AllowAny, BasePermission
from rest_framework.response import Response

from api.models import ClinicHour, ContactMessage, DoctorProfile, Service
from api.serializers_core import (
    ClinicHourSerializer,
    ContactMessageSerializer,
    DoctorProfileSerializer,
    ServiceSerializer,
)
from api.access import AccessMixin, AccessPermission  # Shikshya's access table
from api.lookups import IdOrSlugLookupMixin


def _is_front_desk(user) -> bool:
    """Receptionists (and superusers) manage the public clinic content."""
    if not user or not user.is_authenticated:
        return False
    return bool(user.is_superuser or getattr(user, 'role', None) == 'receptionist')


class IsReceptionistOrReadOnly(BasePermission):
    """Anyone can read public clinic content; only the front desk can change it."""

    message = 'Only reception staff can change clinic information.'

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return _is_front_desk(request.user)


class IsReceptionist(BasePermission):
    """Front desk only (used for the contact message inbox)."""

    message = 'Only reception staff can manage contact messages.'

    def has_permission(self, request, view):
        return _is_front_desk(request.user)


class ServiceViewSet(AccessMixin, IdOrSlugLookupMixin, viewsets.ModelViewSet):
    """Public list of clinic services. Visitors only see active services."""
    access_model = 'Service'

    queryset = Service.objects.all().order_by('display_order', 'name')
    serializer_class = ServiceSerializer
    permission_classes = [AccessPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['slug']
    search_fields = ['name', 'description']
    ordering_fields = ['display_order', 'name', 'duration_minutes', 'created_at']
    ordering = ['display_order', 'name']

    def get_queryset(self) -> QuerySet:
        if not self.request.user.is_authenticated:
            return Service.objects.none()
        queryset = Service.objects.all().order_by('display_order', 'name')
        if not _is_front_desk(self.request.user):
            queryset = queryset.all()
        return queryset


class DoctorProfileViewSet(AccessMixin, viewsets.ModelViewSet):
    """Public list of the clinic's doctors with specialty and bio."""
    access_model = 'DoctorProfile'

    queryset = DoctorProfile.objects.select_related('user').order_by('display_order', 'full_name')
    serializer_class = DoctorProfileSerializer
    permission_classes = [AccessPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['user', 'accepts_new_patients', 'specialty']
    search_fields = ['full_name', 'specialty', 'bio']
    ordering_fields = ['display_order', 'full_name', 'specialty', 'created_at']
    ordering = ['display_order', 'full_name']

    def get_queryset(self) -> QuerySet:
        return DoctorProfile.objects.select_related('user').order_by('display_order', 'full_name')


class ClinicHourViewSet(AccessMixin, viewsets.ModelViewSet):
    """Weekly opening hours, one row per day (0 = Monday ... 6 = Sunday)."""
    access_model = 'ClinicHour'

    queryset = ClinicHour.objects.all().order_by('day_of_week')
    serializer_class = ClinicHourSerializer
    permission_classes = [AccessPermission]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['day_of_week', 'is_closed']
    ordering_fields = ['day_of_week', 'opens_at', 'closes_at']
    ordering = ['day_of_week']

    def get_queryset(self) -> QuerySet:
        return ClinicHour.objects.all().order_by('day_of_week')


class ContactMessageViewSet(AccessMixin, viewsets.ModelViewSet):
    """Contact form inbox.

    Anyone (including visitors who are not signed in) may send a message.
    Reading, updating and deleting messages is limited to reception staff.
    """
    access_model = 'ContactMessage'
    permission_classes = [AccessPermission]

    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = ContactMessageSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_handled']
    search_fields = ['name', 'message']
    ordering_fields = ['created_at', 'name', 'is_handled']
    ordering = ['-created_at']

    def get_queryset(self) -> QuerySet:
        return ContactMessage.objects.all().order_by('-created_at')

    @action(detail=True, methods=['post'], url_path='mark-handled')
    def mark_handled(self, request, pk=None):
        """Reception marks a message as answered."""
        message = self.get_object()
        message.is_handled = True
        message.save(update_fields=['is_handled', 'updated_at'])
        serializer = self.get_serializer(message)
        return Response(serializer.data, status=status.HTTP_200_OK)