from calendar import monthrange
from datetime import datetime, time

from django.utils import timezone
from rest_framework import serializers

from api.models import Appointment, Invoice


def _display_name(user):
    """Return a readable name for a user, falling back to the email address."""
    if user is None:
        return ''
    full_name = f"{getattr(user, 'first_name', '')} {getattr(user, 'last_name', '')}".strip()
    return full_name or getattr(user, 'email', '') or str(user)


def month_bounds(year, month):
    """Return timezone-aware (start, end) datetimes covering the whole month.

    start is the first instant of the month, end is the last microsecond of its last day.
    """
    last_day = monthrange(year, month)[1]
    current_tz = timezone.get_current_timezone()
    start = timezone.make_aware(datetime.combine(datetime(year, month, 1).date(), time.min), current_tz)
    end = timezone.make_aware(datetime.combine(datetime(year, month, last_day).date(), time.max), current_tz)
    return start, end


class MonthlyReportSerializer(serializers.ModelSerializer):
    """Report row for one appointment, and validator for the year/month the receptionist picks.

    Used with data=request.query_params it validates `year` and `month` (both default to the
    current month). Used on Appointment instances it renders the columns of the CSV report.
    """

    year = serializers.IntegerField(write_only=True, required=False, min_value=2000, max_value=2100)
    month = serializers.IntegerField(write_only=True, required=False, min_value=1, max_value=12)
    patient_name = serializers.SerializerMethodField()
    patient_email = serializers.SerializerMethodField()
    doctor_name = serializers.SerializerMethodField()
    service_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    invoice_total = serializers.SerializerMethodField()
    invoice_status = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id',
            'year',
            'month',
            'patient_name',
            'patient_email',
            'doctor_name',
            'service_name',
            'start_time',
            'end_time',
            'status',
            'status_display',
            'reason',
            'checked_in_at',
            'invoice_total',
            'invoice_status',
        ]
        read_only_fields = [
            'id',
            'start_time',
            'end_time',
            'status',
            'reason',
            'checked_in_at',
        ]

    def get_patient_name(self, obj):
        return _display_name(obj.patient)

    def get_patient_email(self, obj):
        return getattr(obj.patient, 'email', '')

    def get_doctor_name(self, obj):
        profile = getattr(obj.doctor, 'doctor_profile', None)
        if profile is not None and getattr(profile, 'full_name', ''):
            return profile.full_name
        return _display_name(obj.doctor)

    def get_service_name(self, obj):
        return obj.service.name if obj.service_id else ''

    def get_invoice_total(self, obj):
        invoices = [inv for inv in obj.invoices.all() if inv.status != 'void']
        if not invoices:
            return None
        total = sum(inv.total_amount for inv in invoices)
        return str(total)

    def get_invoice_status(self, obj):
        invoices = [inv for inv in obj.invoices.all() if inv.status != 'void']
        if not invoices:
            return ''
        if all(inv.status == 'paid' for inv in invoices):
            return 'paid'
        return 'pending'

    def validate(self, attrs):
        today = timezone.localdate()
        attrs['year'] = attrs.get('year') or today.year
        attrs['month'] = attrs.get('month') or today.month
        return attrs


class MonthlyReportInvoiceSerializer(serializers.ModelSerializer):
    """Report row for one bill (invoice) created or paid within the chosen month."""

    patient_name = serializers.SerializerMethodField()
    patient_email = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Invoice
        fields = [
            'id',
            'patient_name',
            'patient_email',
            'appointment',
            'description',
            'total_amount',
            'status',
            'status_display',
            'due_date',
            'paid_at',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'appointment',
            'description',
            'total_amount',
            'status',
            'due_date',
            'paid_at',
            'created_at',
        ]

    def get_patient_name(self, obj):
        return _display_name(obj.user)

    def get_patient_email(self, obj):
        return getattr(obj.user, 'email', '')