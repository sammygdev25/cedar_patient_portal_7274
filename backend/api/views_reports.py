import csv
from datetime import datetime
from decimal import Decimal

from django.db.models import Sum
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import Appointment, Invoice
from api.serializers_reports import MonthlyReportSerializer


RECEPTION_ROLES = ('receptionist',)

APPOINTMENT_HEADER = [
    'Appointment ID',
    'Date',
    'Start',
    'End',
    'Patient',
    'Patient email',
    'Doctor',
    'Service',
    'Status',
    'Checked in at',
    'Reason',
]

BILL_HEADER = [
    'Invoice ID',
    'Created',
    'Patient',
    'Patient email',
    'Description',
    'Appointment ID',
    'Total amount (USD)',
    'Status',
    'Due date',
    'Paid at',
    'Created by',
]


def _safe(value):
    """Return a CSV-safe string; neutralise spreadsheet formula injection."""
    if value is None:
        return ''
    text = str(value).replace('\r', ' ').replace('\n', ' ').strip()
    if text and text[0] in ('=', '+', '-', '@', '\t'):
        text = "'" + text
    return text


def _person_name(user):
    if user is None:
        return ''
    first = getattr(user, 'first_name', '') or ''
    last = getattr(user, 'last_name', '') or ''
    full = f'{first} {last}'.strip()
    return full or getattr(user, 'email', '') or str(user.pk)


def _local(dt):
    if dt is None:
        return None
    if timezone.is_aware(dt):
        return timezone.localtime(dt)
    return dt


def _month_bounds(year, month):
    start = timezone.make_aware(datetime(year, month, 1))
    if month == 12:
        end = timezone.make_aware(datetime(year + 1, 1, 1))
    else:
        end = timezone.make_aware(datetime(year, month + 1, 1))
    return start, end


class MonthlyReportView(APIView):
    """Receptionist-only CSV report of a month's appointments and bills.

    GET /api/reports/monthly/?year=2025&month=3
    """

    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request):
        user = request.user
        if not user or not user.is_authenticated:
            return Response(
                {'detail': 'Authentication credentials were not provided.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        role = getattr(user, 'role', '')
        if role not in RECEPTION_ROLES and not user.is_superuser:
            return Response(
                {'detail': 'Only reception staff can download clinic reports.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = MonthlyReportSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        year = int(serializer.validated_data['year'])
        month = int(serializer.validated_data['month'])

        start, end = _month_bounds(year, month)

        appointments = (
            Appointment.objects.filter(start_time__gte=start, start_time__lt=end)
            .select_related('patient', 'doctor', 'service')
            .order_by('start_time')
        )
        invoices = (
            Invoice.objects.filter(created_at__gte=start, created_at__lt=end)
            .select_related('user', 'appointment', 'created_by')
            .order_by('created_at')
        )

        filename = f'cedar-hollow-report-{year}-{month:02d}.csv'
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        response.write('\ufeff')
        writer = csv.writer(response)

        writer.writerow(['Cedar Hollow Health - Monthly report'])
        writer.writerow(['Period', f'{year}-{month:02d}'])
        writer.writerow(['Generated', _local(timezone.now()).strftime('%Y-%m-%d %H:%M')])
        writer.writerow([])

        # Appointments section
        appointment_list = list(appointments)
        writer.writerow(['APPOINTMENTS'])
        writer.writerow(APPOINTMENT_HEADER)
        status_counts = {}
        for appt in appointment_list:
            start_local = _local(appt.start_time)
            end_local = _local(appt.end_time)
            checked_in = _local(appt.checked_in_at)
            status_counts[appt.status] = status_counts.get(appt.status, 0) + 1
            writer.writerow([
                appt.pk,
                start_local.strftime('%Y-%m-%d') if start_local else '',
                start_local.strftime('%H:%M') if start_local else '',
                end_local.strftime('%H:%M') if end_local else '',
                _safe(_person_name(appt.patient)),
                _safe(getattr(appt.patient, 'email', '')),
                _safe(_person_name(appt.doctor)),
                _safe(appt.service.name if appt.service else ''),
                _safe(appt.get_status_display()),
                checked_in.strftime('%Y-%m-%d %H:%M') if checked_in else '',
                _safe(appt.reason),
            ])
        if not appointment_list:
            writer.writerow(['No appointments in this period'])
        writer.writerow([])

        # Bills section
        invoice_list = list(invoices)
        writer.writerow(['BILLS'])
        writer.writerow(BILL_HEADER)
        for inv in invoice_list:
            created_local = _local(inv.created_at)
            paid_local = _local(inv.paid_at)
            writer.writerow([
                inv.pk,
                created_local.strftime('%Y-%m-%d %H:%M') if created_local else '',
                _safe(_person_name(inv.user)),
                _safe(getattr(inv.user, 'email', '')),
                _safe(inv.description),
                inv.appointment_id or '',
                f'{inv.total_amount:.2f}',
                _safe(inv.get_status_display()),
                inv.due_date.isoformat() if inv.due_date else '',
                paid_local.strftime('%Y-%m-%d %H:%M') if paid_local else '',
                _safe(_person_name(inv.created_by) if inv.created_by else ''),
            ])
        if not invoice_list:
            writer.writerow(['No bills in this period'])
        writer.writerow([])

        # Summary section
        def _total(status_value):
            result = invoices.filter(status=status_value).aggregate(total=Sum('total_amount'))
            return result['total'] or Decimal('0.00')

        writer.writerow(['SUMMARY'])
        writer.writerow(['Total appointments', len(appointment_list)])
        for value, label in Appointment._meta.get_field('status').choices:
            writer.writerow([f'Appointments - {label}', status_counts.get(value, 0)])
        writer.writerow(['Total bills', len(invoice_list)])
        writer.writerow(['Billed - paid (USD)', f'{_total("paid"):.2f}'])
        writer.writerow(['Billed - pending (USD)', f'{_total("pending"):.2f}'])
        writer.writerow(['Billed - void (USD)', f'{_total("void"):.2f}'])

        return response