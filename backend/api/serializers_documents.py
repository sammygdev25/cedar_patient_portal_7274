from rest_framework import serializers

from api.models import MedicalDocument
from api.picture_field import PictureField, StoredFileField


MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

# Extension -> content types accepted for that extension
ALLOWED_DOCUMENT_TYPES = {
    '.pdf': {'application/pdf'},
    '.jpg': {'image/jpeg'},
    '.jpeg': {'image/jpeg'},
    '.png': {'image/png'},
    '.webp': {'image/webp'},
}


def _sniff_kind(head):
    """Identify the real file kind from its first bytes."""
    if head.startswith(b'%PDF'):
        return 'application/pdf'
    if head.startswith(b'\xff\xd8\xff'):
        return 'image/jpeg'
    if head.startswith(b'\x89PNG\r\n\x1a\n'):
        return 'image/png'
    if head[:4] == b'RIFF' and head[8:12] == b'WEBP':
        return 'image/webp'
    return None


class MedicalDocumentSerializer(serializers.ModelSerializer):
    file = StoredFileField(required=False)
    class Meta:
        model = MedicalDocument
        fields = [
            'id',
            'patient',
            'title',
            'document_type',
            'file',
            'content_type',
            'size_bytes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'patient',
            'content_type',
            'size_bytes',
            'created_at',
            'updated_at',
        ]

    def validate_file(self, value):
        name = (getattr(value, 'name', '') or '').lower()
        extension = ''
        if '.' in name:
            extension = '.' + name.rsplit('.', 1)[-1]

        if extension not in ALLOWED_DOCUMENT_TYPES:
            raise serializers.ValidationError(
                'Unsupported file type. Please upload a PDF, JPEG, PNG or WebP file.'
            )

        size = getattr(value, 'size', 0) or 0
        if size <= 0:
            raise serializers.ValidationError('The uploaded file is empty.')
        if size > MAX_DOCUMENT_SIZE_BYTES:
            raise serializers.ValidationError('File is too large. The maximum size is 10 MB.')

        declared = (getattr(value, 'content_type', '') or '').split(';')[0].strip().lower()
        if declared not in ALLOWED_DOCUMENT_TYPES[extension]:
            raise serializers.ValidationError(
                'File content type does not match an allowed format (PDF, JPEG, PNG or WebP).'
            )

        # Verify the actual file contents match the declared type
        try:
            head = value.read(16)
            value.seek(0)
        except Exception:
            raise serializers.ValidationError('Could not read the uploaded file.')

        actual = _sniff_kind(head)
        if actual is None or actual not in ALLOWED_DOCUMENT_TYPES[extension]:
            raise serializers.ValidationError(
                'The file contents do not match its extension. Please upload a valid PDF, JPEG, PNG or WebP file.'
            )

        return value

    def validate_title(self, value):
        value = (value or '').strip()
        if not value:
            raise serializers.ValidationError('Please give the document a title.')
        return value

    def _apply_file_metadata(self, validated_data):
        uploaded = validated_data.get('file')
        if uploaded is not None:
            validated_data['content_type'] = (
                (getattr(uploaded, 'content_type', '') or '').split(';')[0].strip().lower()
            )
            validated_data['size_bytes'] = getattr(uploaded, 'size', 0) or 0
        return validated_data

    def create(self, validated_data):
        request = self.context.get('request')
        if 'patient' not in validated_data and request is not None and request.user.is_authenticated:
            validated_data['patient'] = request.user
        validated_data = self._apply_file_metadata(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data = self._apply_file_metadata(validated_data)
        return super().update(instance, validated_data)