from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.db.models import F, Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from api.models import Order, OrderItem, Prescription, Product
from api.serializers_pharmacy import OrderSerializer, ProductSerializer
from api.access import AccessMixin, AccessPermission  # Shikshya's access table
from api.lookups import IdOrSlugLookupMixin


DELIVERY_FEE = Decimal('4.99')
PRESCRIPTION_DISPENSING_FEE = Decimal('12.00')

ORDER_TYPES = ('otc', 'prescription')
FULFILLMENT_METHODS = ('pickup', 'delivery')
CLOSED_STATUSES = ('rejected', 'cancelled')

# Receptionist-driven flow once an order has been paid (received).
STATUS_TRANSITIONS = {
    'received': ['approved'],
    'approved': ['packed'],
    'packed': ['out_for_delivery', 'delivered'],
    'out_for_delivery': ['delivered'],
}


def user_role(user):
    return getattr(user, 'role', '') or ''


def is_reception(user):
    return bool(
        user
        and user.is_authenticated
        and (user_role(user) == 'receptionist' or user.is_superuser)
    )


def is_doctor(user):
    return bool(user and user.is_authenticated and user_role(user) == 'doctor')


def restore_stock(order):
    """Give reserved stock back when an order is cancelled or rejected."""
    for item in order.items.all():
        if item.product_id:
            Product.objects.filter(pk=item.product_id).update(
                stock_quantity=F('stock_quantity') + item.quantity
            )


class IsReceptionOrReadOnly(permissions.BasePermission):
    """Anyone can read the catalog; only reception staff change it."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return is_reception(request.user)


class ProductViewSet(AccessMixin, IdOrSlugLookupMixin, viewsets.ModelViewSet):
    """OTC / pharmacy catalog with photos, prices and stock."""
    access_model = 'Product'

    queryset = Product.objects.all().order_by('name')
    serializer_class = ProductSerializer
    permission_classes = [AccessPermission]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'requires_prescription']
    search_fields = ['name', 'description', 'category']
    ordering_fields = ['name', 'price', 'stock_quantity', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Product.objects.none()
        queryset = Product.objects.all().order_by('name')
        if not is_reception(self.request.user):
            queryset = queryset.all()
        in_stock = self.request.query_params.get('in_stock')
        if in_stock in ('1', 'true', 'True'):
            queryset = queryset.filter(stock_quantity__gt=0)
        return queryset

    def perform_destroy(self, instance):
        # Past order lines keep their history, so retire the product instead of deleting it.
        instance.is_active = False
        instance.save(update_fields=['updated_at'])

    @action(detail=True, methods=['post'], url_path='mark_out_of_stock')
    def mark_out_of_stock(self, request, pk=None):
        product = self.get_object()
        product.stock_quantity = 0
        product.save(update_fields=['stock_quantity', 'updated_at'])
        return Response(self.get_serializer(product).data)

    @action(detail=True, methods=['post'], url_path='restock')
    def restock(self, request, pk=None):
        product = self.get_object()
        try:
            quantity = int(request.data.get('quantity', 0))
        except (TypeError, ValueError):
            raise ValidationError({'quantity': 'Quantity must be a whole number.'})
        if quantity < 1:
            raise ValidationError({'quantity': 'Quantity must be at least 1.'})
        Product.objects.filter(pk=product.pk).update(
            stock_quantity=F('stock_quantity') + quantity
        )
        product.refresh_from_db()
        return Response(self.get_serializer(product).data)


class OrderViewSet(AccessMixin, viewsets.ModelViewSet):
    """Pharmacy orders: patients order, doctors approve prescriptions, reception fulfils."""
    access_model = 'Order'

    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [AccessPermission]
    http_method_names = ['get', 'post', 'head', 'options']
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'status', 'order_type', 'fulfillment_method', 'user', 'prescription', 'approved_by',
    ]
    search_fields = ['user__first_name', 'user__last_name', 'user__email']
    ordering_fields = ['created_at', 'updated_at', 'total_amount', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        if not self.request.user.is_authenticated:
            return Order.objects.none()
        user = self.request.user
        queryset = (
            Order.objects.all()
            .select_related('user', 'prescription', 'approved_by')
            .prefetch_related('items')
            .order_by('-created_at')
        )
        if is_reception(user):
            return queryset
        if is_doctor(user):
            return queryset.filter(Q(user=user) | Q(prescription__doctor=user)).distinct()
        return queryset.filter(user=user)

    # ------------------------------------------------------------------ create

    def create(self, request, *args, **kwargs):
        data = request.data
        order_type = data.get('order_type') or 'otc'
        fulfillment = data.get('fulfillment_method') or 'pickup'
        address = (data.get('delivery_address') or '').strip()
        phone = (data.get('phone') or '').strip()
        notes = (data.get('notes') or '').strip()

        if order_type not in ORDER_TYPES:
            raise ValidationError({'order_type': 'Choose over the counter or prescription.'})
        if fulfillment not in FULFILLMENT_METHODS:
            raise ValidationError({'fulfillment_method': 'Choose pickup or home delivery.'})
        if fulfillment == 'delivery':
            if not address:
                raise ValidationError({'delivery_address': 'A delivery address is required for home delivery.'})
            if not phone:
                raise ValidationError({'phone': 'A contact phone is required for home delivery.'})
        else:
            address = ''

        delivery_fee = DELIVERY_FEE if fulfillment == 'delivery' else Decimal('0.00')

        with transaction.atomic():
            if order_type == 'prescription':
                prescription, lines = self._prepare_prescription_lines(request.user, data.get('prescription'))
            else:
                prescription = None
                lines = self._prepare_otc_lines(data.get('items'))

            subtotal = sum((line['unit_price'] * line['quantity'] for line in lines), Decimal('0.00'))
            order = Order.objects.create(
                user=request.user,
                prescription=prescription,
                order_type=order_type,
                fulfillment_method=fulfillment,
                status='pending_payment',
                subtotal=subtotal,
                delivery_fee=delivery_fee,
                total_amount=subtotal + delivery_fee,
                delivery_address=address,
                phone=phone,
                notes=notes,
            )
            OrderItem.objects.bulk_create([
                OrderItem(
                    order=order,
                    product=line['product'],
                    medicine_name=line['medicine_name'],
                    quantity=line['quantity'],
                    unit_price=line['unit_price'],
                )
                for line in lines
            ])
            # Reserve stock so two patients cannot buy the last box.
            for line in lines:
                if line['product'] is not None:
                    Product.objects.filter(pk=line['product'].pk).update(
                        stock_quantity=F('stock_quantity') - line['quantity']
                    )

        order = self.get_queryset().get(pk=order.pk)
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _prepare_otc_lines(self, raw_items):
        if not isinstance(raw_items, (list, tuple)) or not raw_items:
            raise ValidationError({'items': 'Your cart is empty.'})

        wanted = {}
        for entry in raw_items:
            if not isinstance(entry, dict):
                raise ValidationError({'items': 'Each cart line needs a product and a quantity.'})
            product_id = entry.get('product', entry.get('product_id'))
            try:
                product_id = int(product_id)
                quantity = int(entry.get('quantity', 1))
            except (TypeError, ValueError):
                raise ValidationError({'items': 'Each cart line needs a numeric product and quantity.'})
            if quantity < 1:
                raise ValidationError({'items': 'Quantities must be at least 1.'})
            wanted[product_id] = wanted.get(product_id, 0) + quantity

        products = {
            p.pk: p
            for p in Product.objects.select_for_update().filter(pk__in=wanted.keys())
        }
        lines = []
        for product_id, quantity in wanted.items():
            product = products.get(product_id)
            if product is None:
                raise ValidationError({'items': 'One of the products is no longer available.'})
            if product.requires_prescription:
                raise ValidationError({
                    'items': '%s needs a prescription. Order it from your prescriptions instead.' % product.name
                })
            if product.stock_quantity < quantity:
                raise ValidationError({
                    'items': '%s is out of stock or has fewer than %d left.' % (product.name, quantity)
                })
            lines.append({
                'product': product,
                'medicine_name': product.name,
                'quantity': quantity,
                'unit_price': product.price,
            })
        return lines

    def _prepare_prescription_lines(self, user, prescription_id):
        try:
            prescription_id = int(prescription_id)
        except (TypeError, ValueError):
            raise ValidationError({'prescription': 'Choose one of your prescriptions.'})

        prescription = (
            Prescription.objects.select_for_update()
            .select_related('product')
            .filter(pk=prescription_id)
            .first()
        )
        # A prescription belonging to someone else looks the same as a missing one.
        if prescription is None or prescription.patient_id != user.id:
            raise ValidationError({'prescription': 'Choose one of your own prescriptions.'})
        if not prescription.is_active:
            raise ValidationError({'prescription': 'This prescription is no longer active.'})

        used = Order.objects.filter(prescription=prescription).exclude(status__in=CLOSED_STATUSES).count()
        if used >= 1 + prescription.refills_allowed:
            raise ValidationError({'prescription': 'This prescription has no refills left.'})

        product = prescription.product
        unit_price = PRESCRIPTION_DISPENSING_FEE
        quantity = 1
        if product is not None:
            product = Product.objects.select_for_update().get(pk=product.pk)
            if product.stock_quantity < quantity:
                raise ValidationError({
                    'prescription': '%s is out of stock right now.' % product.name
                })
            unit_price = product.price + PRESCRIPTION_DISPENSING_FEE
            medicine_name = product.name
        else:
            medicine_name = getattr(prescription, 'medicine_name', '') or 'Prescription medicine'

        lines = [{
            'product': product,
            'medicine_name': medicine_name,
            'quantity': quantity,
            'unit_price': unit_price,
        }]
        return prescription, lines

    # ----------------------------------------------------------------- actions

    @action(detail=True, methods=['post'], url_path='pay')
    def pay(self, request, pk=None):
        order = self.get_object()
        if order.user_id != request.user.id and not is_reception(request.user):
            raise PermissionDenied('You can only pay for your own orders.')
        if order.status != 'pending_payment':
            raise ValidationError({'status': 'This order is not waiting for payment.'})
        order.status = 'received'
        order.save(update_fields=['status', 'updated_at'])
        return Response(self.get_serializer(order).data)

    @action(detail=True, methods=['post'], url_path='advance')
    def advance(self, request, pk=None):
        if not is_reception(request.user):
            raise PermissionDenied('Only reception staff can update order progress.')
        order = self.get_object()
        new_status = request.data.get('status')
        allowed = STATUS_TRANSITIONS.get(order.status, [])
        if new_status not in allowed:
            raise ValidationError({'status': 'Cannot move this order from %s to %s.' % (order.status, new_status)})
        if new_status == 'out_for_delivery' and order.fulfillment_method != 'delivery':
            raise ValidationError({'status': 'Only delivery orders can go out for delivery.'})
        order.status = new_status
        update_fields = ['status', 'updated_at']
        if new_status == 'approved':
            order.approved_by = request.user
            update_fields.append('approved_by')
        order.save(update_fields=update_fields)
        return Response(self.get_serializer(order).data)

    @action(detail=True, methods=['post'], url_path='cancel')
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.user_id != request.user.id and not is_reception(request.user):
            raise PermissionDenied('You cannot cancel this order.')
        if order.status not in ('pending_payment', 'received'):
            raise ValidationError({'status': 'This order can no longer be cancelled.'})
        with transaction.atomic():
            restore_stock(order)
            order.status = 'cancelled'
            order.save(update_fields=['status', 'updated_at'])
        return Response(self.get_serializer(order).data)

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        if not (is_reception(request.user) or is_doctor(request.user)):
            raise PermissionDenied('Only staff can reject orders.')
        order = self.get_object()
        if order.status in CLOSED_STATUSES or order.status in ('delivered', 'out_for_delivery'):
            raise ValidationError({'status': 'This order can no longer be rejected.'})
        with transaction.atomic():
            restore_stock(order)
            order.status = 'rejected'
            order.save(update_fields=['status', 'updated_at'])
        return Response(self.get_serializer(order).data)
