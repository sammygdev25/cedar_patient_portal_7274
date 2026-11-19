from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils.text import slugify
from rest_framework import serializers

from api.models import Order, OrderItem, Prescription, Product
from api.picture_field import PictureField
from api.picture_field import PictureField, StoredFileField

User = get_user_model()

DELIVERY_FEE = Decimal('4.99')
LOW_STOCK_THRESHOLD = 10


class ProductSerializer(serializers.ModelSerializer):
    image = PictureField(required=False)
    in_stock = serializers.SerializerMethodField()
    low_stock = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'description', 'category', 'price', 'stock_quantity', 'image', 'requires_prescription', 'in_stock', 'low_stock', 'created_at', 'updated_at']
        read_only_fields = ['id', 'in_stock', 'low_stock', 'created_at', 'updated_at']
        extra_kwargs = {
            'slug': {'required': False, 'allow_blank': True},
        }

    def get_in_stock(self, obj):
        return bool(getattr(obj, 'is_active', True)) and obj.stock_quantity > 0

    def get_low_stock(self, obj):
        return 0 < obj.stock_quantity <= LOW_STOCK_THRESHOLD

    def validate_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError('Price cannot be negative.')
        return value

    def _unique_slug(self, name, exclude_pk=None):
        base = slugify(name)[:190] or 'product'
        slug = base
        counter = 2
        queryset = Product.objects.all()
        if exclude_pk is not None:
            queryset = queryset.exclude(pk=exclude_pk)
        while queryset.filter(slug=slug).exists():
            slug = f'{base}-{counter}'
            counter += 1
        return slug

    def create(self, validated_data):
        if not validated_data.get('slug'):
            validated_data['slug'] = self._unique_slug(validated_data.get('name', ''))
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if 'slug' in validated_data and not validated_data['slug']:
            validated_data['slug'] = self._unique_slug(
                validated_data.get('name', instance.name), exclude_pk=instance.pk
            )
        return super().update(instance, validated_data)


class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True, default=None)
    product_stock = serializers.IntegerField(
        source='product.stock_quantity', read_only=True, default=None
    )
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'order',
            'product',
            'product_name',
            'product_stock',
            'medicine_name',
            'quantity',
            'unit_price',
            'line_total',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'order',
            'product_name',
            'product_stock',
            'medicine_name',
            'unit_price',
            'line_total',
            'created_at',
            'updated_at',
        ]

    def get_line_total(self, obj):
        return str((obj.unit_price or Decimal('0')) * obj.quantity)

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError('Quantity must be at least 1.')
        return value


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, required=False)
    user_name = serializers.SerializerMethodField()
    user_email = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    prescription_medicine_name = serializers.SerializerMethodField()
    is_paid = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'user',
            'user_name',
            'user_email',
            'prescription',
            'prescription_medicine_name',
            'order_type',
            'fulfillment_method',
            'status',
            'subtotal',
            'delivery_fee',
            'total_amount',
            'delivery_address',
            'phone',
            'notes',
            'approved_by',
            'approved_by_name',
            'approved_at',
            'paid_at',
            'is_paid',
            'items',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'user',
            'user_name',
            'user_email',
            'prescription_medicine_name',
            'status',
            'subtotal',
            'delivery_fee',
            'total_amount',
            'approved_by',
            'approved_by_name',
            'approved_at',
            'paid_at',
            'is_paid',
            'created_at',
            'updated_at',
        ]

    def get_user_name(self, obj):
        user = obj.user
        full = f'{user.first_name} {user.last_name}'.strip()
        return full or user.email

    def get_user_email(self, obj):
        return obj.user.email

    def get_approved_by_name(self, obj):
        approver = obj.approved_by
        if approver is None:
            return None
        full = f'{approver.first_name} {approver.last_name}'.strip()
        return full or approver.email

    def get_prescription_medicine_name(self, obj):
        # Only the medicine name is exposed; prescription notes never leave the model.
        if obj.prescription_id is None:
            return None
        return obj.prescription.medicine_name

    def get_is_paid(self, obj):
        return obj.paid_at is not None

    def validate(self, attrs):
        if self.instance is not None:
            return attrs

        request = self.context.get('request')
        if request is None or not request.user.is_authenticated:
            raise serializers.ValidationError('You must be signed in to place an order.')
        user = request.user

        order_type = attrs.get('order_type', 'otc')
        fulfillment = attrs.get('fulfillment_method', 'pickup')

        if fulfillment == 'delivery':
            if not (attrs.get('delivery_address') or '').strip():
                raise serializers.ValidationError(
                    {'delivery_address': 'A delivery address is required for home delivery.'}
                )
            if not (attrs.get('phone') or '').strip():
                raise serializers.ValidationError(
                    {'phone': 'A contact phone number is required for home delivery.'}
                )

        if order_type == 'prescription':
            prescription = attrs.get('prescription')
            if prescription is None:
                raise serializers.ValidationError(
                    {'prescription': 'Choose one of your prescriptions to order.'}
                )
            if prescription.patient_id != user.id:
                raise serializers.ValidationError(
                    {'prescription': 'You can only order your own prescriptions.'}
                )
            if not prescription.is_active:
                raise serializers.ValidationError(
                    {'prescription': 'This prescription is no longer active.'}
                )
            product = prescription.product
            if product is not None and product.stock_quantity < 1:
                raise serializers.ValidationError(
                    {'prescription': f'{product.name} is currently out of stock.'}
                )
        else:
            attrs['prescription'] = None
            items = attrs.get('items') or []
            if not items:
                raise serializers.ValidationError({'items': 'Your cart is empty.'})
            for entry in items:
                product = entry.get('product')
                quantity = entry.get('quantity', 1)
                if product is None:
                    raise serializers.ValidationError(
                        {'items': 'Every cart item must reference a product.'}
                    )
                if not getattr(product, 'is_active', True):
                    raise serializers.ValidationError(
                        {'items': f'{product.name} is no longer available.'}
                    )
                if product.requires_prescription:
                    raise serializers.ValidationError(
                        {
                            'items': (
                                f'{product.name} requires a prescription and cannot be '
                                'added to an over-the-counter order.'
                            )
                        }
                    )
                if product.stock_quantity < quantity:
                    raise serializers.ValidationError(
                        {
                            'items': (
                                f'Only {product.stock_quantity} of {product.name} '
                                'left in stock.'
                            )
                        }
                    )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        request = self.context['request']
        items_data = validated_data.pop('items', [])
        order_type = validated_data.get('order_type', 'otc')
        fulfillment = validated_data.get('fulfillment_method', 'pickup')

        delivery_fee = DELIVERY_FEE if fulfillment == 'delivery' else Decimal('0.00')

        line_rows = []
        if order_type == 'prescription':
            prescription = validated_data['prescription']
            product = prescription.product
            unit_price = product.price if product is not None else Decimal('0.00')
            line_rows.append(
                {
                    'product': product,
                    'medicine_name': prescription.medicine_name,
                    'quantity': 1,
                    'unit_price': unit_price,
                }
            )
        else:
            for entry in items_data:
                product = entry['product']
                line_rows.append(
                    {
                        'product': product,
                        'medicine_name': product.name,
                        'quantity': entry.get('quantity', 1),
                        'unit_price': product.price,
                    }
                )

        subtotal = sum(
            (row['unit_price'] * row['quantity'] for row in line_rows), Decimal('0.00')
        )

        order = Order.objects.create(
            user=request.user,
            status='pending_payment',
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            total_amount=subtotal + delivery_fee,
            **validated_data,
        )
        for row in line_rows:
            OrderItem.objects.create(order=order, **row)
        return order

    def update(self, instance, validated_data):
        # Items, order type, prescription and fulfilment are fixed once the order is placed.
        validated_data.pop('items', None)
        validated_data.pop('order_type', None)
        validated_data.pop('prescription', None)
        validated_data.pop('fulfillment_method', None)
        return super().update(instance, validated_data)
