from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied

from api.models import Appointment, Prescription, Product, VisitNote


def _display_name(user):
    """Full name of a user, falling back to the email address."""
    if user is None:
        return ''
    full = f'{user.first_name} {user.last_name}'.strip()
    return full or getattr(user, 'email', '') or str(user)


def _require_doctor(serializer):
    """Return the requesting user if they are a doctor, otherwise refuse."""
    request = serializer.context.get('request')
    user = getattr(request, 'user', None)
    if user is None or not user.is_authenticated:
        raise PermissionDenied('Authentication is required.')
    if getattr(user, 'role', None) != 'doctor':
        raise PermissionDenied('Only doctors can write clinical records.')
    return user


def _product_is_available(product):
    """Whether a product can be offered; tolerant of the Product schema."""
    if not getattr(product, 'is_active', True):
        return False
    for attr in ('stock_quantity', 'stock', 'quantity'):
        stock = getattr(product, attr, None)
        if stock is not None:
            return stock > 0
    in_stock = getattr(product, 'in_stock', None)
    if in_stock is not None:
        return bool(in_stock)
    return True


class VisitNoteSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    appointment_start_time = serializers.DateTimeField(
        source='appointment.start_time', read_only=True
    )
    appointment_status = serializers.CharField(
        source='appointment.status', read_only=True
    )

    class Meta:
        model = VisitNote
        fields = [
            'id',
            'appointment',
            'patient',
            'doctor',
            'patient_name',
            'doctor_name',
            'appointment_start_time',
            'appointment_status',
            'chief_complaint',
            'diagnosis',
            'notes',
            'follow_up_instructions',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'patient',
            'doctor',
            'patient_name',
            'doctor_name',
            'appointment_start_time',
            'appointment_status',
            'created_at',
            'updated_at',
        ]

    def get_patient_name(self, obj):
        return _display_name(obj.patient)

    def get_doctor_name(self, obj):
        return _display_name(obj.doctor)

    def validate(self, attrs):
        user = _require_doctor(self)

        if self.instance is not None:
            if self.instance.doctor_id != user.id:
                raise PermissionDenied('You can only edit your own visit notes.')
            # The appointment of an existing note never changes.
            attrs.pop('appointment', None)
            return attrs

        appointment = attrs.get('appointment')
        if appointment is None:
            raise serializers.ValidationError(
                {'appointment': 'An appointment is required for a visit note.'}
            )
        if appointment.doctor_id != user.id:
            raise PermissionDenied(
                'You can only write notes for patients booked with you.'
            )
        if appointment.status in ('cancelled', 'no_show'):
            raise serializers.ValidationError(
                {'appointment': 'Cannot write a visit note for a cancelled or missed appointment.'}
            )

        attrs['patient'] = appointment.patient
        attrs['doctor'] = user
        return attrs

    @staticmethod
    def _mark_completed(appointment):
        if appointment.status != 'completed':
            appointment.status = 'completed'
            appointment.save(update_fields=['status', 'updated_at'])

    def create(self, validated_data):
        with transaction.atomic():
            note = super().create(validated_data)
            self._mark_completed(note.appointment)
        return note

    def update(self, instance, validated_data):
        with transaction.atomic():
            note = super().update(instance, validated_data)
            self._mark_completed(note.appointment)
        return note


class PrescriptionSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(
        queryset=get_user_model().objects.all(), required=False
    )
    patient_name = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()
    product_price = serializers.SerializerMethodField()
    product_in_stock = serializers.SerializerMethodField()

    class Meta:
        model = Prescription
        fields = ['id', 'patient', 'doctor', 'appointment', 'product', 'patient_name', 'doctor_name', 'product_name', 'product_price', 'product_in_stock', 'medicine_name', 'dosage', 'instructions', 'notes', 'refills_allowed', 'created_at', 'updated_at']
        read_only_fields = [
            'doctor',
            'patient_name',
            'doctor_name',
            'product_name',
            'product_price',
            'product_in_stock',
            'created_at',
            'updated_at',
        ]
        extra_kwargs = {
            'medicine_name': {'required': False},
        }

    def get_patient_name(self, obj):
        return _display_name(obj.patient)

    def get_doctor_name(self, obj):
        return _display_name(obj.doctor)

    def get_product_name(self, obj):
        return obj.product.name if obj.product_id else None

    def get_product_price(self, obj):
        return str(obj.product.price) if obj.product_id else None

    def get_product_in_stock(self, obj):
        if not obj.product_id:
            return False
        return _product_is_available(obj.product)

    def validate_refills_allowed(self, value):
        if value < 0:
            raise serializers.ValidationError('Refills cannot be negative.')
        return value

    def validate_product(self, value):
        if value is not None and not getattr(value, 'is_active', True):
            raise serializers.ValidationError('This product is no longer available.')
        return value

    def validate(self, attrs):
        user = _require_doctor(self)

        if self.instance is not None:
            if self.instance.doctor_id != user.id:
                raise PermissionDenied('You can only edit your own prescriptions.')
            # Ownership links never change after creation.
            attrs.pop('patient', None)
            attrs.pop('appointment', None)
            return attrs

        appointment = attrs.get('appointment')
        patient = attrs.get('patient')

        if appointment is not None:
            if appointment.doctor_id != user.id:
                raise PermissionDenied(
                    'You can only prescribe for patients booked with you.'
                )
            if patient is not None and patient.id != appointment.patient_id:
                raise serializers.ValidationError(
                    {'patient': 'Patient does not match the appointment.'}
                )
            patient = appointment.patient
        else:
            if patient is None:
                raise serializers.ValidationError(
                    {'patient': 'A patient or an appointment is required.'}
                )
            if not Appointment.objects.filter(doctor=user, patient=patient).exists():
                raise PermissionDenied(
                    'You can only prescribe for patients booked with you.'
                )

        medicine_name = (attrs.get('medicine_name') or '').strip()
        product = attrs.get('product')
        if not medicine_name:
            if product is not None:
                medicine_name = product.name
            else:
                raise serializers.ValidationError(
                    {'medicine_name': 'Enter a medicine name or choose a pharmacy product.'}
                )
        attrs['medicine_name'] = medicine_name
        attrs['patient'] = patient
        attrs['doctor'] = user
        return attrs
