from django.conf import settings
"""
Models for cedar_patient_portal_7274 — auto-generated from ProjectContract.
DO NOT EDIT — regenerate from contract if changes needed.
"""
from django.db import models


from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    role = models.CharField(max_length=20, choices=[['patient', 'Patient'], ['doctor', 'Doctor'], ['receptionist', 'Receptionist']], default='patient')
    phone = models.CharField(max_length=30, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    email_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return str(self.email)


class Service(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField()
    duration_minutes = models.IntegerField(default=30)
    icon = models.CharField(max_length=50, blank=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'name']

    def __str__(self):
        return str(self.name)


class DoctorProfile(models.Model):
    user = models.OneToOneField(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_profile')
    full_name = models.CharField(max_length=200)
    specialty = models.CharField(max_length=150)
    bio = models.TextField()
    photo = models.ImageField(upload_to='doctors/', null=True, blank=True)
    accepts_new_patients = models.BooleanField(default=True)
    consultation_minutes = models.IntegerField(default=30)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'full_name']

    def __str__(self):
        return str(self.full_name)


class ClinicHour(models.Model):
    day_of_week = models.IntegerField(unique=True)
    opens_at = models.TimeField(null=True, blank=True)
    closes_at = models.TimeField(null=True, blank=True)
    is_closed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['day_of_week']

    def __str__(self):
        return str(self.day_of_week)


class ContactMessage(models.Model):
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=30, blank=True)
    message = models.TextField()
    is_handled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return str(self.name)


class Appointment(models.Model):
    patient = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='doctor_appointments')
    service = models.ForeignKey(to='Service', on_delete=models.SET_NULL, related_name='appointments', null=True, blank=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=20, choices=[['scheduled', 'Scheduled'], ['checked_in', 'Checked in'], ['completed', 'Completed'], ['cancelled', 'Cancelled'], ['no_show', 'No show']], default='scheduled')
    reason = models.TextField(blank=True)
    checked_in_at = models.DateTimeField(null=True, blank=True)
    booked_by = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name='booked_appointments', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['start_time']
        constraints = [models.UniqueConstraint(fields=['doctor', 'start_time'], condition=~models.Q(status='cancelled'), name='unique_active_doctor_slot')]

    def __str__(self):
        return str(self.start_time)


class VisitNote(models.Model):
    appointment = models.OneToOneField(to='Appointment', on_delete=models.CASCADE, related_name='visit_note')
    patient = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='visit_notes')
    doctor = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='written_visit_notes')
    chief_complaint = models.CharField(max_length=255)
    diagnosis = models.TextField()
    notes = models.TextField()
    follow_up_instructions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return str(self.chief_complaint)


class Prescription(models.Model):
    patient = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='prescriptions')
    doctor = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='written_prescriptions')
    appointment = models.ForeignKey(to='Appointment', on_delete=models.SET_NULL, related_name='prescriptions', null=True, blank=True)
    product = models.ForeignKey(to='Product', on_delete=models.SET_NULL, related_name='prescriptions', null=True, blank=True)
    medicine_name = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100)
    instructions = models.TextField()
    notes = models.TextField(blank=True)
    refills_allowed = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return str(self.medicine_name)


class MedicalDocument(models.Model):
    patient = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=200)
    document_type = models.CharField(max_length=20, choices=[['insurance', 'Insurance card'], ['lab_result', 'Lab result'], ['other', 'Other']], default='other')
    file = models.FileField(upload_to='documents/%Y/%m/')
    content_type = models.CharField(max_length=100, blank=True)
    size_bytes = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return str(self.title)


class Invoice(models.Model):
    user = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='invoices')
    appointment = models.ForeignKey(to='Appointment', on_delete=models.SET_NULL, related_name='invoices', null=True, blank=True)
    created_by = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name='created_invoices', null=True, blank=True)
    description = models.CharField(max_length=255)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=[['pending', 'Pending'], ['paid', 'Paid'], ['void', 'Void']], default='pending')
    due_date = models.DateField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    stripe_session_id = models.CharField(max_length=255, null=True, blank=True, unique=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return str(self.description)


class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    stock_quantity = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    requires_prescription = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return str(self.name)


class Order(models.Model):
    user = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='pharmacy_orders')
    prescription = models.ForeignKey(to='Prescription', on_delete=models.SET_NULL, related_name='orders', null=True, blank=True)
    order_type = models.CharField(max_length=20, choices=[['otc', 'Over the counter'], ['prescription', 'Prescription']], default='otc')
    fulfillment_method = models.CharField(max_length=20, choices=[['pickup', 'Pickup'], ['delivery', 'Home delivery']], default='pickup')
    status = models.CharField(max_length=30, choices=[['pending_payment', 'Pending payment'], ['received', 'Received'], ['approved', 'Approved'], ['packed', 'Packed'], ['out_for_delivery', 'Out for delivery'], ['delivered', 'Delivered'], ['rejected', 'Rejected'], ['cancelled', 'Cancelled']], default='pending_payment')
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_fee = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    delivery_address = models.TextField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    notes = models.TextField(blank=True)
    approved_by = models.ForeignKey(to=settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, related_name='approved_orders', null=True, blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    stripe_session_id = models.CharField(max_length=255, null=True, blank=True, unique=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return str(self.status)


class OrderItem(models.Model):
    order = models.ForeignKey(to='Order', on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(to='Product', on_delete=models.SET_NULL, related_name='order_items', null=True, blank=True)
    medicine_name = models.CharField(max_length=200)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['id']

    def __str__(self):
        return str(self.medicine_name)

