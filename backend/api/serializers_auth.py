"""Auth serializers -- deterministic scaffold. Sign-up runs the project's password validators; the profile says the
user's role and whether they are staff (is_staff, or one of the plan's staff roles), both read only. One email
belongs to one account: sign-up and a profile edit refuse an email another account has, in any case."""
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

User = get_user_model()
ROLE_FIELD = 'role'
STAFF_ROLES = ('doctor', 'receptionist')
EMAIL_TAKEN = 'An account with this email already exists.'


def email_taken(value, user=None):
    """True when another account has this email, in any case; a blank email is never taken."""
    if not value:
        return False
    others = User.objects.filter(email__iexact=value)
    if user is not None:
        others = others.exclude(pk=user.pk)
    return others.exists()


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name']

    def validate_email(self, value):
        if email_taken(value):
            raise serializers.ValidationError(EMAIL_TAKEN)
        return value

    def validate(self, attrs):
        candidate = User(**{k: attrs.get(k, '') for k in ('username', 'email', 'first_name', 'last_name')})
        try:
            validate_password(attrs['password'], user=candidate)
        except DjangoValidationError as exc:
            raise serializers.ValidationError({'password': list(exc.messages)})
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(required=False)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    date_joined = serializers.DateTimeField(read_only=True)
    role = serializers.SerializerMethodField()
    is_staff = serializers.SerializerMethodField()

    def validate_email(self, value):
        if email_taken(value, self.instance):
            raise serializers.ValidationError(EMAIL_TAKEN)
        return value

    def get_role(self, obj):
        return getattr(obj, ROLE_FIELD, None) if ROLE_FIELD else None

    def get_is_staff(self, obj):
        role = getattr(obj, ROLE_FIELD, None) if ROLE_FIELD else None
        return bool(obj.is_staff or obj.is_superuser or role in STAFF_ROLES)

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance
