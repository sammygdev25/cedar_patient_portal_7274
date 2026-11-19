from django.contrib.auth import get_user_model
from rest_framework import serializers

from api.models import Appointment, Invoice

User = get_user_model()


class InvoiceSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role='patient')
    )
    appointment = serializers.PrimaryKeyRelatedField(
        queryset=Appointment.objects.all(),
        required=False,
        allow_null=True,
    )
    user_name = serializers.SerializerMethodField()
    user_email = serializers.EmailField(source='user.email', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    appointment_label = serializers.SerializerMethodField()

    class Meta:
        model = Invoice
        fields = [
            'id',
            'user',
            'user_name',
            'user_email',
            'appointment',
            'appointment_label',
            'created_by',
            'created_by_name',
            'description',
            'total_amount',
            'status',
            'due_date',
            'paid_at',
            'created_at',
            'updated_at',
            'stripe_session_id',
        ]
        read_only_fields = [
            'id',
            'created_by',
            'status',
            'paid_at',
            'created_at',
            'updated_at',
            'stripe_session_id',
        ]

    def get_user_name(self, obj):
        patient = obj.user
        full_name = '{} {}'.format(patient.first_name, patient.last_name).strip()
        return full_name or patient.email

    def get_created_by_name(self, obj):
        creator = obj.created_by
        if creator is None:
            return ''
        full_name = '{} {}'.format(creator.first_name, creator.last_name).strip()
        return full_name or creator.email

    def get_appointment_label(self, obj):
        appointment = obj.appointment
        if appointment is None:
            return ''
        service_name = appointment.service.name if appointment.service else 'Appointment'
        return '{} on {}'.format(
            service_name, appointment.start_time.strftime('%b %d, %Y')
        )

    def validate_total_amount(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError('The bill total must be greater than zero.')
        return value

    def validate_description(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('Please describe what this bill is for.')
        return value

    def validate(self, attrs):
        patient = attrs.get('user')
        if patient is None and self.instance is not None:
            patient = self.instance.user
        appointment = attrs.get('appointment')
        if appointment is not None and patient is not None:
            if appointment.patient_id != patient.id:
                raise serializers.ValidationError(
                    {'appointment': 'This appointment does not belong to the selected patient.'}
                )
        return attrs