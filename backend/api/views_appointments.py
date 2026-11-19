from datetime import datetime, timedelta

from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework import status as http_status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from django_filters.rest_framework import DjangoFilterBackend

from api.models import Appointment, ClinicHour, DoctorProfile, Service
from api.serializers_appointments import (
    AppointmentSerializer,
    AvailabilitySerializer,
    UserSerializer,
)
from api.access import AccessMixin, AccessPermission  # Shikshya's access table

User = get_user_model()

ACTIVE_STATUSES = ['scheduled', 'checked_in']
DEFAULT_SLOT_MINUTES = 30


def get_role(user):
    """Return the clinic role of a user ('patient', 'doctor', 'receptionist') or None."""
    if not user or not user.is_authenticated:
        return None
    if user.is_superuser:
        return 'receptionist'
    return getattr(user, 'role', 'patient')


def parse_aware_datetime(value):
    """Parse an ISO datetime string into an aware datetime, or return None."""
    if not value:
        return None
    raw = str(value).strip()
    parsed = parse_datetime(raw)
    if parsed is None and ' ' in raw:
        # A '+' in a query string arrives as a space ("2024-01-01T10:00:00 00:00")
        parsed = parse_datetime(raw.replace(' ', '+'))
    if parsed is None:
        return None
    if timezone.is_naive(parsed):
        parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
    return parsed


def get_duration_minutes(doctor_id=None, service_id=None):
    """Appointment length: service duration first, then the doctor's consultation length."""
    if service_id not in (None, ''):
        try:
            service = Service.objects.filter(pk=service_id).first()
        except (ValueError, TypeError):
            service = None
        if service and service.duration_minutes:
            return service.duration_minutes
    if doctor_id not in (None, ''):
        try:
            profile = DoctorProfile.objects.filter(user_id=doctor_id).first()
        except (ValueError, TypeError):
            profile = None
        if profile and profile.consultation_minutes:
            return profile.consultation_minutes
    return DEFAULT_SLOT_MINUTES


def clinic_window(day):
    """Return (opens, closes) as aware datetimes for a date, or None when the clinic is closed."""
    hour = ClinicHour.objects.filter(day_of_week=day.weekday()).first()
    if not hour or hour.is_closed or not hour.opens_at or not hour.closes_at:
        return None
    tz = timezone.get_current_timezone()
    opens = timezone.make_aware(datetime.combine(day, hour.opens_at), tz)
    closes = timezone.make_aware(datetime.combine(day, hour.closes_at), tz)
    return opens, closes


def within_clinic_hours(start, end):
    window = clinic_window(timezone.localtime(start).date())
    if window is None:
        return False
    return start >= window[0] and end <= window[1]


class AppointmentViewSet(AccessMixin, ModelViewSet):
    access_model = 'Appointment'
    queryset = Appointment.objects.select_related(
        'patient', 'doctor', 'service', 'booked_by'
    ).order_by('start_time')
    serializer_class = AppointmentSerializer
    permission_classes = [AccessPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['patient', 'doctor', 'service', 'booked_by', 'status']
    search_fields = [
        'patient__first_name',
        'patient__last_name',
        'patient__email',
        'doctor__first_name',
        'doctor__last_name',
        'service__name',
        'reason',
    ]
    ordering_fields = ['start_time', 'end_time', 'created_at', 'updated_at', 'status']
    ordering = ['start_time']

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return super().get_queryset().none()
        user = self.request.user
        role = get_role(user)
        queryset = super().get_queryset()

        if role is None:
            return queryset.none()
        if role == 'patient':
            queryset = queryset.filter(patient=user)
        elif role == 'doctor':
            queryset = queryset.filter(doctor=user)

        if self.action == 'list':
            queryset = self._apply_list_filters(queryset)
        return queryset

    def _apply_list_filters(self, queryset):
        params = self.request.query_params

        updated_since = parse_aware_datetime(params.get('updated_since'))
        if updated_since:
            queryset = queryset.filter(updated_at__gt=updated_since)

        day = parse_date(params.get('date') or '')
        if day:
            queryset = queryset.filter(start_time__date=day)

        date_from = parse_date(params.get('from') or '')
        if date_from:
            queryset = queryset.filter(start_time__date__gte=date_from)

        date_to = parse_date(params.get('to') or '')
        if date_to:
            queryset = queryset.filter(start_time__date__lte=date_to)

        if (params.get('upcoming') or '').lower() in ('1', 'true', 'yes'):
            queryset = queryset.filter(
                start_time__gte=timezone.now(), status__in=ACTIVE_STATUSES
            )
        return queryset

    def _prepare_data(self, request, role):
        data = {key: value for key, value in request.data.items()}
        if role == 'patient':
            data['patient'] = request.user.pk
        if not data.get('end_time'):
            start = parse_aware_datetime(data.get('start_time'))
            if start:
                minutes = get_duration_minutes(data.get('doctor'), data.get('service'))
                data['end_time'] = (start + timedelta(minutes=minutes)).isoformat()
        return data

    def create(self, request, *args, **kwargs):
        role = get_role(request.user)
        if role is None:
            return Response(
                {'detail': 'Authentication credentials were not provided.'},
                status=http_status.HTTP_401_UNAUTHORIZED,
            )
        if role == 'doctor':
            return Response(
                {'detail': 'Doctors cannot book appointments. Please contact reception.'},
                status=http_status.HTTP_403_FORBIDDEN,
            )
        if role == 'patient' and not request.user.email_verified:
            return Response(
                {'detail': 'Please verify your email address before booking an appointment.'},
                status=http_status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=self._prepare_data(request, role))
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                self.perform_create(serializer)
        except IntegrityError:
            return Response(
                {'start_time': ['This time slot has just been booked. Please choose another.']},
                status=http_status.HTTP_409_CONFLICT,
            )
        return Response(serializer.data, status=http_status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        user = self.request.user
        if get_role(user) == 'patient':
            serializer.save(patient=user, booked_by=user)
        else:
            serializer.save(booked_by=user)

    def update(self, request, *args, **kwargs):
        role = get_role(request.user)
        if role is None:
            return Response(
                {'detail': 'Authentication credentials were not provided.'},
                status=http_status.HTTP_401_UNAUTHORIZED,
            )

        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        if role == 'doctor':
            data = {
                key: value for key, value in request.data.items()
                if key in ('status',)
            }
            if not data:
                return Response(
                    {'detail': 'Doctors can only update the appointment status.'},
                    status=http_status.HTTP_403_FORBIDDEN,
                )
            partial = True
        else:
            if role == 'patient' and instance.status not in ACTIVE_STATUSES:
                return Response(
                    {'detail': 'Only upcoming appointments can be changed.'},
                    status=http_status.HTTP_400_BAD_REQUEST,
                )
            data = self._prepare_data(request, role)

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        try:
            with transaction.atomic():
                serializer.save()
        except IntegrityError:
            return Response(
                {'start_time': ['This time slot has just been booked. Please choose another.']},
                status=http_status.HTTP_409_CONFLICT,
            )
        return Response(serializer.data)

    def partial_update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return self.update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        role = get_role(request.user)
        if role is None:
            return Response(
                {'detail': 'Authentication credentials were not provided.'},
                status=http_status.HTTP_401_UNAUTHORIZED,
            )
        if role != 'receptionist':
            return Response(
                {'detail': 'Only reception can delete appointments. Please cancel instead.'},
                status=http_status.HTTP_403_FORBIDDEN,
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        role = get_role(request.user)
        if role is None:
            return Response(
                {'detail': 'Authentication credentials were not provided.'},
                status=http_status.HTTP_401_UNAUTHORIZED,
            )
        appointment = self.get_object()
        if appointment.status not in ACTIVE_STATUSES:
            return Response(
                {'detail': 'This appointment can no longer be cancelled.'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        appointment.status = 'cancelled'
        appointment.save()
        return Response(self.get_serializer(appointment).data)

    @action(detail=True, methods=['post'], url_path='check-in')
    def check_in(self, request, pk=None):
        role = get_role(request.user)
        if role is None:
            return Response(
                {'detail': 'Authentication credentials were not provided.'},
                status=http_status.HTTP_401_UNAUTHORIZED,
            )
        if role == 'patient':
            return Response(
                {'detail': 'Please check in at the reception desk.'},
                status=http_status.HTTP_403_FORBIDDEN,
            )
        appointment = self.get_object()
        if appointment.status != 'scheduled':
            return Response(
                {'detail': 'Only scheduled appointments can be checked in.'},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        appointment.status = 'checked_in'
        appointment.save()
        return Response(self.get_serializer(appointment).data)


class AvailabilityView(APIView):
    """List free appointment slots for a doctor on a given day."""

    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        params = request.query_params
        doctor_id = params.get('doctor')
        service_id = params.get('service')
        day = parse_date(params.get('date') or '')

        errors = {}
        if not doctor_id:
            errors['doctor'] = ['This parameter is required.']
        if not day:
            errors['date'] = ['A valid date (YYYY-MM-DD) is required.']
        if errors:
            return Response(errors, status=http_status.HTTP_400_BAD_REQUEST)

        minutes = get_duration_minutes(doctor_id, service_id)
        window = clinic_window(day)
        payload = {
            'doctor': doctor_id,
            'date': day.isoformat(),
            'duration_minutes': minutes,
            'slots': [],
        }
        if window is None:
            return Response(payload)

        opens, closes = window
        booked = list(
            Appointment.objects.filter(
                doctor_id=doctor_id,
                status__in=ACTIVE_STATUSES,
                start_time__lt=closes,
                end_time__gt=opens,
            ).values_list('start_time', 'end_time')
        )

        step = timedelta(minutes=minutes)
        now = timezone.now()
        slot_start = opens
        while slot_start + step <= closes:
            slot_end = slot_start + step
            overlaps = any(
                slot_start < b_end and slot_end > b_start for b_start, b_end in booked
            )
            if not overlaps and slot_start > now:
                payload['slots'].append({
                    'start_time': slot_start.isoformat(),
                    'end_time': slot_end.isoformat(),
                })
            slot_start = slot_end

        return Response(payload)


class DoctorListView(APIView):
    """List the doctors available for booking."""

    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        doctors = User.objects.filter(role='doctor').order_by(
            'last_name', 'first_name'
        )
        return Response(UserSerializer(doctors, many=True).data)