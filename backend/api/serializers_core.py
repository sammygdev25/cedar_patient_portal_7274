from django.contrib.auth import get_user_model
from rest_framework import serializers

from api.models import ClinicHour, ContactMessage, DoctorProfile, Service
from api.picture_field import PictureField
from api.picture_field import PictureField, StoredFileField

User = get_user_model()

DAY_NAMES = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
]


def _is_clinic_staff(request):
    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
        return False
    return getattr(user, 'role', '') in ('doctor', 'receptionist')


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name', 'slug', 'description', 'duration_minutes', 'icon', 'display_order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_duration_minutes(self, value):
        if value <= 0:
            raise serializers.ValidationError('Duration must be at least one minute.')
        if value > 480:
            raise serializers.ValidationError('Duration cannot exceed 8 hours.')
        return value


class DoctorProfileSerializer(serializers.ModelSerializer):
    photo = PictureField(required=False)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = DoctorProfile
        fields = [
            'id',
            'user',
            'user_email',
            'full_name',
            'specialty',
            'bio',
            'photo',
            'accepts_new_patients',
            'consultation_minutes',
            'display_order',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user_email', 'created_at', 'updated_at']

    def validate_consultation_minutes(self, value):
        if value <= 0:
            raise serializers.ValidationError('Consultation length must be at least one minute.')
        if value > 240:
            raise serializers.ValidationError('Consultation length cannot exceed 4 hours.')
        return value


class ClinicHourSerializer(serializers.ModelSerializer):
    day_name = serializers.SerializerMethodField()

    class Meta:
        model = ClinicHour
        fields = [
            'id',
            'day_of_week',
            'day_name',
            'opens_at',
            'closes_at',
            'is_closed',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'day_name', 'created_at', 'updated_at']

    def get_day_name(self, obj):
        index = obj.day_of_week
        if isinstance(index, int) and 0 <= index < len(DAY_NAMES):
            return DAY_NAMES[index]
        return ''

    def validate_day_of_week(self, value):
        if value < 0 or value > 6:
            raise serializers.ValidationError('Day of week must be between 0 (Monday) and 6 (Sunday).')
        return value

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)
        is_closed = attrs.get('is_closed', instance.is_closed if instance else False)
        opens_at = attrs.get('opens_at', instance.opens_at if instance else None)
        closes_at = attrs.get('closes_at', instance.closes_at if instance else None)

        if is_closed:
            attrs['opens_at'] = None
            attrs['closes_at'] = None
            return attrs

        if opens_at is None or closes_at is None:
            raise serializers.ValidationError(
                'Opening and closing times are required for days the clinic is open.'
            )
        if closes_at <= opens_at:
            raise serializers.ValidationError('Closing time must be after opening time.')
        return attrs


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'phone', 'message', 'is_handled', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_message(self, value):
        cleaned = value.strip()
        if len(cleaned) < 10:
            raise serializers.ValidationError(
                'Please tell us a little more so the Cedar Hollow Health team can help.'
            )
        return cleaned

    def validate_name(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError('Please enter your name.')
        return cleaned

    def create(self, validated_data):
        request = self.context.get('request')
        if not _is_clinic_staff(request):
            validated_data.pop('is_handled', None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get('request')
        if not _is_clinic_staff(request):
            validated_data.pop('is_handled', None)
        return super().update(instance, validated_data)