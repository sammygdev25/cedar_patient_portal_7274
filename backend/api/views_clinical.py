from django.db import transaction
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import SAFE_METHODS, BasePermission, IsAuthenticated
from rest_framework.response import Response

from api.models import Appointment, Prescription, Product, VisitNote
from api.serializers_clinical import PrescriptionSerializer, VisitNoteSerializer
from api.access import AccessMixin, AccessPermission  # Shikshya's access table


def _role(user):
    return getattr(user, 'role', None)


class IsPatientOrDoctor(BasePermission):
    """Patients may read their own records, doctors read and write their own.

    Receptionists (and any other role) have no access to clinical data.
    """

    message = 'Clinical records are available to patients and doctors only.'

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            return False
        role = _role(user)
        if role == 'doctor':
            return True
        if role == 'patient':
            return request.method in SAFE_METHODS
        return False


def _doctor_appointment(user, appointment_id):
    """Return the appointment only if it is booked with this doctor."""
    if appointment_id in (None, ''):
        return None
    try:
        appointment = Appointment.objects.select_related('patient').filter(
            pk=int(appointment_id), doctor=user
        ).first()
    except (TypeError, ValueError):
        raise ValidationError({'appointment': 'Invalid appointment.'})
    if appointment is None:
        raise PermissionDenied(
            'You can only write records for patients booked with you.'
        )
    return appointment


def _mark_completed(appointment):
    if appointment.status != 'completed':
        appointment.status = 'completed'
        appointment.save(update_fields=['status', 'updated_at'])


class VisitNoteViewSet(AccessMixin, viewsets.ModelViewSet):
    access_model = 'VisitNote'
    queryset = VisitNote.objects.select_related(
        'appointment', 'patient', 'doctor'
    ).order_by('-created_at')
    serializer_class = VisitNoteSerializer
    permission_classes = [AccessPermission]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ['patient', 'doctor', 'appointment']
    search_fields = ['chief_complaint', 'diagnosis', 'notes']
    ordering_fields = ['created_at', 'updated_at', 'chief_complaint']

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return super().get_queryset().none()
        qs = super().get_queryset()
        user = self.request.user
        role = _role(user)
        if role == 'doctor':
            return qs.filter(doctor=user)
        if role == 'patient':
            return qs.filter(patient=user)
        return qs.none()

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        appointment = _doctor_appointment(request.user, data.get('appointment'))
        if appointment is None:
            raise ValidationError({'appointment': 'This field is required.'})
        if appointment.status == 'cancelled':
            raise ValidationError(
                {'appointment': 'Cannot write a visit note for a cancelled appointment.'}
            )

        data['appointment'] = appointment.pk
        data['patient'] = appointment.patient_id
        data['doctor'] = request.user.pk

        existing = VisitNote.objects.filter(appointment=appointment).first()
        with transaction.atomic():
            if existing is not None:
                serializer = self.get_serializer(existing, data=data, partial=True)
                serializer.is_valid(raise_exception=True)
                serializer.save(
                    appointment=appointment,
                    patient=appointment.patient,
                    doctor=request.user,
                )
                _mark_completed(appointment)
                return Response(serializer.data, status=status.HTTP_200_OK)

            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save(
                appointment=appointment,
                patient=appointment.patient,
                doctor=request.user,
            )
            _mark_completed(appointment)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_update(self, serializer):
        instance = serializer.instance
        with transaction.atomic():
            serializer.save(
                appointment=instance.appointment,
                patient=instance.patient,
                doctor=instance.doctor,
            )
            _mark_completed(instance.appointment)


class PrescriptionViewSet(AccessMixin, viewsets.ModelViewSet):
    access_model = 'Prescription'
    queryset = Prescription.objects.select_related(
        'patient', 'doctor', 'appointment', 'product'
    ).order_by('-created_at')
    serializer_class = PrescriptionSerializer
    permission_classes = [AccessPermission]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ['patient', 'doctor', 'appointment', 'product']
    search_fields = ['medicine_name', 'dosage', 'instructions']
    ordering_fields = ['created_at', 'updated_at', 'medicine_name']

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return super().get_queryset().none()
        qs = super().get_queryset()
        user = self.request.user
        role = _role(user)
        if role == 'doctor':
            return qs.filter(doctor=user)
        if role == 'patient':
            return qs.filter(patient=user)
        return qs.none()

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        doctor = request.user
        appointment = _doctor_appointment(doctor, data.get('appointment'))

        if appointment is not None:
            patient = appointment.patient
        else:
            patient_id = data.get('patient')
            if patient_id in (None, ''):
                raise ValidationError({'patient': 'This field is required.'})
            try:
                booked = Appointment.objects.select_related('patient').filter(
                    doctor=doctor, patient_id=int(patient_id)
                ).first()
            except (TypeError, ValueError):
                raise ValidationError({'patient': 'Invalid patient.'})
            if booked is None:
                raise PermissionDenied(
                    'You can only write prescriptions for patients booked with you.'
                )
            patient = booked.patient

        product_id = data.get('product')
        if product_id not in (None, ''):
            try:
                product_ok = Product.objects.filter(pk=int(product_id)).exists()
            except (TypeError, ValueError):
                product_ok = False
            if not product_ok:
                raise ValidationError({'product': 'Selected pharmacy product does not exist.'})

        data['patient'] = patient.pk
        data['doctor'] = doctor.pk
        if appointment is not None:
            data['appointment'] = appointment.pk

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(patient=patient, doctor=doctor, appointment=appointment)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_update(self, serializer):
        instance = serializer.instance
        serializer.save(
            patient=instance.patient,
            doctor=instance.doctor,
            appointment=instance.appointment,
        )