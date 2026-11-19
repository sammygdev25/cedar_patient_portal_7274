from django.contrib.auth import get_user_model
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from api.models import Invoice
from api.serializers_billing import InvoiceSerializer

User = get_user_model()


def _is_receptionist(user):
    return bool(
        user
        and user.is_authenticated
        and getattr(user, 'role', None) == 'receptionist'
    )


# NOTE: canonical definition is in views_core.py (duplicate removed by IntegrationAgent._dedup_duplicate_classes)
from .views_core import IsReceptionist
from api.access import AccessMixin, AccessPermission  # Shikshya's access table


class InvoiceViewSet(AccessMixin, viewsets.ModelViewSet):
    """
    Bills for Cedar Hollow Health.

    - Receptionists see every bill, create bills for any patient and can void
      bills that are not yet paid.
    - Everyone else (patients, doctors) only sees bills addressed to them.
    - Payment is handled by the scaffold's Stripe checkout; a bill only becomes
      "paid" when the payment webhook confirms it, never through this API.
    """
    access_model = 'Invoice'

    queryset = Invoice.objects.all().order_by('-created_at')
    serializer_class = InvoiceSerializer
    permission_classes = [AccessPermission]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ['user', 'appointment', 'created_by', 'status']
    search_fields = [
        'description',
        'user__email',
        'user__first_name',
        'user__last_name',
    ]
    ordering_fields = ['created_at', 'due_date', 'total_amount', 'status', 'paid_at']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = (
            Invoice.objects.select_related('user', 'appointment', 'created_by')
            .all()
            .order_by('-created_at')
        )
        user = self.request.user
        if not user.is_authenticated:
            return queryset.none()
        if _is_receptionist(user):
            return queryset
        return queryset.filter(user=user)

    def _validate_appointment_belongs_to_patient(self, serializer, instance=None):
        data = serializer.validated_data
        patient = data.get('user', getattr(instance, 'user', None))
        appointment = data.get('appointment', getattr(instance, 'appointment', None))
        if appointment is not None and patient is not None:
            if appointment.patient_id != patient.pk:
                raise ValidationError(
                    {'appointment': 'This appointment does not belong to the selected patient.'}
                )

    def perform_create(self, serializer):
        self._validate_appointment_belongs_to_patient(serializer)
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        instance = serializer.instance
        if instance.status == 'paid':
            raise ValidationError({'detail': 'A paid bill can no longer be edited.'})
        self._validate_appointment_belongs_to_patient(serializer, instance=instance)
        serializer.save()

    @action(detail=True, methods=['post'], url_path='void')
    def void(self, request, pk=None):
        """Cancel a bill that has not been paid yet."""
        invoice = self.get_object()
        if invoice.status == 'paid':
            return Response(
                {'detail': 'A paid bill cannot be voided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if invoice.status != 'void':
            invoice.status = 'void'
            invoice.save(update_fields=['status', 'updated_at'])
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)