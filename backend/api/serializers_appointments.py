from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.utils import timezone
from datetime import timedelta
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from api.models import Appointment, DoctorProfile, Service

User = get_user_model()

DEFAULT_DURATION_MINUTES = 30


def _display_name(user):
    """Return a human readable name for a user, falling back to the email."""
    if user is None:
        return ''
    full = '{} {}'.format(user.first_name or '', user.last_name or '').strip()
    return full or user.email


class UserSerializer(serializers.ModelSerializer):
    """Read-only patient/user representation used by the patients directory."""

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'phone',
            'date_of_birth',
            'email_verified',
            'created_at',
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return _display_name(obj)


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    patient_email = serializers.EmailField(source='patient.email', read_only=True)
    doctor_name = serializers.SerializerMethodField()
    doctor_specialty = serializers.SerializerMethodField()
    service_name = serializers.CharField(source='service.name', read_only=True, default='')
    booked_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id',
            'patient',
            'patient_name',
            'patient_email',
            'doctor',
            'doctor_name',
            'doctor_specialty',
            'service',
            'service_name',
            'start_time',
            'end_time',
            'status',
            'reason',
            'checked_in_at',
            'booked_by',
            'booked_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'status',
            'checked_in_at',
            'booked_by',
            'created_at',
            'updated_at',
        ]
        extra_kwargs = {
            'patient': {'required': False},
            'end_time': {'required': False},
        }

    # ------------------------------------------------------------------
    # Read helpers
    # ------------------------------------------------------------------
    def get_patient_name(self, obj):
        return _display_name(obj.patient)

    def get_doctor_name(self, obj):
        profile = DoctorProfile.objects.filter(user=obj.doctor).first()
        if profile and profile.full_name:
            return profile.full_name
        return _display_name(obj.doctor)

    def get_doctor_specialty(self, obj):
        profile = DoctorProfile.objects.filter(user=obj.doctor).first()
        return profile.specialty if profile else ''

    def get_booked_by_name(self, obj):
        return _display_name(obj.booked_by) if obj.booked_by else ''

    # ------------------------------------------------------------------
    # Validation
    # ------------------------------------------------------------------
    def _request_user(self):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if user is not None and user.is_authenticated:
            return user
        return None

    def _default_duration(self, doctor, service):
        if service is not None and service.duration_minutes:
            return service.duration_minutes
        profile = DoctorProfile.objects.filter(user=doctor).first()
        if profile and profile.consultation_minutes:
            return profile.consultation_minutes
        return DEFAULT_DURATION_MINUTES

    def validate_doctor(self, value):
        if value.role != 'doctor':
            raise serializers.ValidationError('The selected user is not a doctor.')
        return value

    def validate_patient(self, value):
        if value.role != 'patient':
            raise serializers.ValidationError('The selected user is not a patient.')
        return value

    def validate_service(self, value):
        if value is not None and not value.is_active:
            raise serializers.ValidationError('This service is no longer offered.')
        return value

    def validate(self, attrs):
        instance = self.instance
        user = self._request_user()
        role = getattr(user, 'role', None)

        # --- Who is booking and for whom --------------------------------
        if instance is None:
            if user is None:
                raise PermissionDenied('Please sign in to book an appointment.')
            if role == 'patient':
                if not user.email_verified:
                    raise PermissionDenied(
                        'Please verify your email address before booking an appointment.'
                    )
                attrs['patient'] = user
            elif role == 'receptionist':
                if not attrs.get('patient'):
                    raise serializers.ValidationError(
                        {'patient': 'Choose the patient this appointment is for.'}
                    )
            else:
                raise PermissionDenied(
                    'Only patients and reception staff can book appointments.'
                )
        else:
            # Patients can never hand an appointment to someone else.
            if role == 'patient':
                attrs.pop('patient', None)
                attrs.pop('doctor', None)

        # --- Resolve effective values -----------------------------------
        doctor = attrs.get('doctor', instance.doctor if instance else None)
        service = attrs.get('service', instance.service if instance else None)
        start = attrs.get('start_time', instance.start_time if instance else None)
        end = attrs.get('end_time')

        if doctor is None:
            raise serializers.ValidationError({'doctor': 'Choose a doctor.'})
        if start is None:
            raise serializers.ValidationError({'start_time': 'Choose a start time.'})

        start_changed = instance is None or start != instance.start_time

        if start_changed and start <= timezone.now():
            raise serializers.ValidationError(
                {'start_time': 'Appointments must be booked for a future time.'}
            )

        # --- Work out the end time --------------------------------------
        if end is None:
            if instance is not None and not start_changed and 'service' not in attrs:
                end = instance.end_time
            elif instance is not None and start_changed and 'service' not in attrs:
                end = start + (instance.end_time - instance.start_time)
            else:
                end = start + timedelta(minutes=self._default_duration(doctor, service))
            attrs['end_time'] = end

        if end <= start:
            raise serializers.ValidationError(
                {'end_time': 'The end time must be after the start time.'}
            )

        # --- Double booking ---------------------------------------------
        conflicts = (
            Appointment.objects.filter(
                doctor=doctor,
                start_time__lt=end,
                end_time__gt=start,
            )
            .exclude(status='cancelled')
        )
        if instance is not None:
            conflicts = conflicts.exclude(pk=instance.pk)
        if conflicts.exists():
            raise serializers.ValidationError(
                {'start_time': 'This doctor is already booked at that time. Please pick another slot.'}
            )

        return attrs

    # ------------------------------------------------------------------
    # Writes
    # ------------------------------------------------------------------
    def create(self, validated_data):
        user = self._request_user()
        if user is not None:
            validated_data['booked_by'] = user
        try:
            with transaction.atomic():
                return super().create(validated_data)
        except IntegrityError:
            raise serializers.ValidationError(
                {'start_time': 'This doctor is already booked at that time. Please pick another slot.'}
            )

    def update(self, instance, validated_data):
        try:
            with transaction.atomic():
                return super().update(instance, validated_data)
        except IntegrityError:
            raise serializers.ValidationError(
                {'start_time': 'This doctor is already booked at that time. Please pick another slot.'}
            )


class AvailabilitySerializer(serializers.Serializer):
    """Validates the query parameters of the availability endpoint."""

    doctor = serializers.IntegerField(required=False, default=0)
    date = serializers.DateField()
    service = serializers.IntegerField(required=False, allow_null=True)

    def validate_doctor(self, value):
        if not User.objects.filter(pk=value, role='doctor').exists():
            raise serializers.ValidationError('Doctor not found.')
        return value

    def validate_date(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError('Choose today or a future date.')
        return value

    def validate_service(self, value):
        if value is not None and not Service.objects.filter(pk=value, is_active=True).exists():
            raise serializers.ValidationError('Service not found.')
        return value