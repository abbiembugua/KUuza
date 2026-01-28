from django.db import models
from django.contrib.auth.models import User
from django.conf import settings


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

    CONDITION_CHOICES = [
        ('New', 'New'),
        ('Like New', 'Like New'),
        ('Used', 'Used'),
        ('Fair', 'Fair'),
    ]

    CONTACT_CHOICES = [
        ('email', 'Email'),
        ('whatsapp', 'WhatsApp'),
    ]

    seller = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # <- use this instead of auth.User
        on_delete=models.CASCADE
    )
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    negotiable = models.BooleanField(default=False)
    quantity = models.PositiveIntegerField(default=1)
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, blank=True)
    area_of_operation = models.CharField(max_length=255)
    contact_preference = models.CharField(max_length=20, choices=CONTACT_CHOICES)
    whatsapp_number = models.CharField(max_length=20, blank=True)
    is_draft = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class ListingImage(models.Model):
    listing = models.ForeignKey(
        Listing,
        related_name='images',
        on_delete=models.CASCADE
    )
    image = models.ImageField(upload_to='listings/')
