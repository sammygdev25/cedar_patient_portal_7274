from django.core.exceptions import ValidationError as DjangoValidationError
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, serializers, viewsets
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import BasePermission, IsAuthenticated

from api.models import MedicalDocument
from api.serializers_documents import MedicalDocumentSerializer
from api.access import AccessMixin, AccessPermission  # Shikshya's access table


MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB

ALLOWED_EXTENSIONS = {'.pdf', '.jpg', '.jpeg', '.png', '.webp'}

ALLOWED_CONTENT_TYPES = {
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
}

# Extensions that are valid for each accepted content type.
EXTENSIONS_BY_CONTENT_TYPE = {
    'application/pdf': {'.pdf'},
    'image/jpeg': {'.jpg', '.jpeg'},
    'image/png': {'.png'},
    'image/webp': {'.webp'},
}


class IsPatientUser(BasePermission):
    """Only authenticated users with the patient role may use the documents API.

    Doctors and receptionists have no access to patient uploads.
    """

    message = 'Only patients can manage their own documents.'

    def has_permission(self, request, view):
        user = request.user
        return bool(
            user
            and user.is_authenticated
            and getattr(user, 'role', None) == 'patient'
        )

    def has_object_permission(self, request, view, obj):
        return obj.patient_id == request.user.id


def validate_uploaded_file(upload):
    """Validate size, extension and declared content type of an uploaded file."""
    if upload is None:
        raise serializers.ValidationError({'file': 'A file is required.'})

    name = (getattr(upload, 'name', '') or '').lower()
    extension = ''
    if '.' in name:
        extension = '.' + name.rsplit('.', 1)[-1]

    if extension not in ALLOWED_EXTENSIONS:
        raise serializers.ValidationError(
            {'file': 'Unsupported file extension. Upload a PDF, JPEG, PNG or WebP file.'}
        )

    content_type = (getattr(upload, 'content_type', '') or '').split(';')[0].strip().lower()
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise serializers.ValidationError(
            {'file': 'Unsupported file type. Upload a PDF, JPEG, PNG or WebP file.'}
        )

    if extension not in EXTENSIONS_BY_CONTENT_TYPE.get(content_type, set()):
        raise serializers.ValidationError(
            {'file': 'The file extension does not match its content type.'}
        )

    size = getattr(upload, 'size', 0) or 0
    if size <= 0:
        raise serializers.ValidationError({'file': 'The uploaded file is empty.'})
    if size > MAX_UPLOAD_BYTES:
        raise serializers.ValidationError({'file': 'File is too large. The maximum size is 10 MB.'})

    return content_type, size


class MedicalDocumentViewSet(AccessMixin, viewsets.ModelViewSet):
    """Patient document uploads (insurance cards, lab results).

    A patient can list, upload, view and delete only their own files.
    Staff roles (doctor, receptionist) have no access to this endpoint.
    """
    access_model = 'MedicalDocument'

    queryset = MedicalDocument.objects.all().order_by('-created_at')
    serializer_class = MedicalDocumentSerializer
    permission_classes = [AccessPermission]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ['patient', 'document_type']
    search_fields = ['title']
    ordering_fields = ['created_at', 'title', 'size_bytes']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return MedicalDocument.objects.none()
        return (
            MedicalDocument.objects
            .filter(patient=user)
            .order_by('-created_at')
        )

    def perform_create(self, serializer):
        upload = serializer.validated_data.get('file')
        content_type, size = validate_uploaded_file(upload)
        serializer.save(
            patient=self.request.user,
            content_type=content_type,
            size_bytes=size,
        )

    def perform_destroy(self, instance):
        stored_file = instance.file
        instance.delete()
        if stored_file:
            try:
                stored_file.delete(save=False)
            except (OSError, DjangoValidationError):
                # The database record is already gone; a missing file on disk is not fatal.
                pass