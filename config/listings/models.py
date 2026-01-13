from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
import uuid

class PickupLocation(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Listing(models.Model):
    CATEGORY_CHOICES = [
        ('Books', 'Books'),
        ('Electronics', 'Electronics'),
        ('Fashion', 'Fashion'),
        ('Furniture', 'Furniture'),
        ('Services', 'Services'),
        ('Food & Beverages', 'Food & Beverages'),
        ('Other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('active', 'Active'),
        ('pending', 'Pending Review'),
        ('sold', 'Sold'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Basic Information
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)
    
    # Pricing & Inventory
    price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)],
        null=True,
        blank=True
    )
    suggested_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True, 
        blank=True
    )
    quantity = models.PositiveIntegerField(default=1)
    
    # Location
    pickup_locations = models.ManyToManyField(PickupLocation, blank=True)
    custom_location = models.CharField(max_length=255, blank=True)
    
    # Media
    images = models.JSONField(default=list, blank=True)  # Store image URLs
    
    # Metadata
    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='listings'
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='draft'
    )
    ai_generated = models.BooleanField(default=False)
    is_available = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['category', 'status']),
            models.Index(fields=['seller', 'status']),
            models.Index(fields=['created_at']),
            models.Index(fields=['price']),
        ]
        verbose_name = "Listing"
        verbose_name_plural = "Listings"
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"
    
    @property
    def display_price(self):
        """Get price to display, fallback to suggested price"""
        return self.price or self.suggested_price
    
    @property
    def pickup_display(self):
        """Display pickup locations as comma-separated string"""
        locations = list(self.pickup_locations.values_list('name', flat=True))
        if self.custom_location:
            locations.append(f"Custom: {self.custom_location}")
        return ", ".join(locations) if locations else "Not specified"
    
    def save(self, *args, **kwargs):
        # If price is not set but suggested_price is, use suggested_price
        if not self.price and self.suggested_price:
            self.price = self.suggested_price
        super().save(*args, **kwargs)