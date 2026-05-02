import uuid
from django.db import models
from django.conf import settings


class Listing(models.Model):

    LISTING_TYPE_CHOICES = [
        ('good', 'Good'),
        ('service', 'Service'),
    ]

    CATEGORY_CHOICES = [
        ('books', 'Books'),
        ('electronics', 'Electronics'),
        ('fashion', 'Fashion'),
        ('furniture', 'Furniture'),
        ('food_beverages', 'Food & Beverages'),
        ('beauty', 'Beauty'),
        ('other', 'Other'),
    ]

    CONDITION_CHOICES = [
        ('new', 'New'),
        ('like_new', 'Like New'),
        ('used', 'Used'),
        ('fair', 'Fair'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('sold', 'Sold'),
        ('deactivated', 'Deactivated'),
    ]

    CONTACT_CHOICES = [
        ('email', 'Email'),
        ('whatsapp', 'WhatsApp'),
    ]

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='listings'
    )

    # The two most important fields for branching behaviour
    listing_type = models.CharField(
        max_length=10,
        choices=LISTING_TYPE_CHOICES,
        default='good'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='active'
    )

    title = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)

    # Pricing
    price = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    negotiable = models.BooleanField(default=False)
    min_discount_percent = models.PositiveSmallIntegerField(null=True, blank=True)

    # Goods only
    condition = models.CharField(
        max_length=10, choices=CONDITION_CHOICES, blank=True
    )
    quantity = models.PositiveIntegerField(default=1)

    # Services only
    usage_count = models.PositiveIntegerField(default=0)

    # Shared
    area_of_operation = models.CharField(max_length=255)
    contact_preference = models.CharField(
        max_length=10, choices=CONTACT_CHOICES, default='email'
    )
    contact_value = models.CharField(
        max_length=255,
        help_text='Email address or WhatsApp number. Only revealed after transaction.'
    )

    is_draft = models.BooleanField(default=False)
    views_count = models.PositiveIntegerField(default=0)
    ai_assisted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['listing_type']),
            models.Index(fields=['category']),
            models.Index(fields=['status']),
            models.Index(fields=['seller']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f"[{self.get_listing_type_display()}] {self.title}"

    def mark_sold(self, quantity_sold=1):
        if self.listing_type != 'good':
            return

        from django.db.models import F
        Listing.objects.filter(pk=self.pk).update(
            quantity=F('quantity') - quantity_sold
        )
        self.refresh_from_db(fields=['quantity', 'status'])

        if self.quantity <= 0:
            self.quantity = 0
            self.status = 'sold'
            self.save(update_fields=['quantity', 'status', 'updated_at'])

    def increment_usage(self):
        if self.listing_type == 'service':
            self.usage_count += 1
            self.save(update_fields=['usage_count', 'updated_at'])


class ListingImage(models.Model):
    listing = models.ForeignKey(
        Listing,
        related_name='images',
        on_delete=models.CASCADE
    )
    image = models.ImageField(upload_to='listings/')
    display_order = models.PositiveIntegerField(default=1)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order']