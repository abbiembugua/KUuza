import uuid
from django.db import models
from django.conf import settings
from listings.models import Listing


class Transaction(models.Model):

    INTERACTION_TYPE_CHOICES = [
        ('purchase',    'Purchase'),
        ('service_use', 'Service Use'),
    ]

    PAYMENT_METHOD_CHOICES = [
        ('mpesa',             'M-Pesa'),
        ('cash_on_pickup',    'Cash on Pickup'),
        ('pay_after_service', 'Pay After Service'),
    ]

    STATUS_CHOICES = [
        ('pending',        'Pending'),
        ('completed',      'Completed'),
        ('auto_completed', 'Auto Completed'),
        ('cancelled',      'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    listing = models.ForeignKey(
        Listing,
        on_delete=models.SET_NULL,
        null=True,
        related_name='transactions'
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='purchases'
    )
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sales'
    )

    interaction_type = models.CharField(
        max_length=15,
        choices=INTERACTION_TYPE_CHOICES
    )
    agreed_price = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    scheduled_date     = models.DateField()
    auto_complete_date = models.DateField(null=True, blank=True)

    # Goods only
    inquiry_note = models.TextField(blank=True)

    # M-Pesa
    mpesa_phone   = models.CharField(max_length=20, blank=True)
    mpesa_receipt = models.CharField(max_length=50, blank=True)

    completed_at = models.DateTimeField(null=True, blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['buyer']),
            models.Index(fields=['seller']),
            models.Index(fields=['status']),
            models.Index(fields=['listing']),
        ]

    def __str__(self):
        return f"{self.interaction_type} — {self.buyer} → {self.seller} ({self.status})"

    def save(self, *args, **kwargs):
        # Auto-set auto_complete_date to 7 days after scheduled_date
        if self.scheduled_date and not self.auto_complete_date:
            from datetime import timedelta
            self.auto_complete_date = self.scheduled_date + timedelta(days=7)

        super().save(*args, **kwargs)

        # If this is a completed purchase of a good, mark the listing as sold
        if (
            self.status == 'completed'
            and self.interaction_type == 'purchase'
            and self.listing
            and self.listing.status == 'active'
        ):
            self.listing.mark_sold()

        # If this is a completed service use, increment usage count
        if (
            self.status in ('completed', 'auto_completed')
            and self.interaction_type == 'service_use'
            and self.listing
        ):
            self.listing.increment_usage()

        if (
            self.status in ('completed', 'auto_completed')
            and self.buyer_id
            and self.listing_id
        ):
            from Cart.models import CartItem

            CartItem.objects.filter(
                cart__user=self.buyer,
                listing_id=self.listing_id,
            ).delete()


class Notification(models.Model):
    TYPE_CHOICES = [
        ('purchase_created', 'Purchase Created'),
        ('receipt_ready', 'Receipt Ready'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_notifications'
    )
    transaction = models.ForeignKey(
        Transaction,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(max_length=32, choices=TYPE_CHOICES)
    title = models.CharField(max_length=255)
    body = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"{self.notification_type} for {self.recipient}"
