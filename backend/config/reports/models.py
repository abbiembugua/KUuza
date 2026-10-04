import uuid
from django.db import models
from django.conf import settings


class Report(models.Model):
    REASON_CHOICES = [
        ('fake_misleading',  'Fake or misleading listing'),
        ('prohibited_item',  'Prohibited item'),
        ('suspected_scam',   'Suspected scam'),
        ('inappropriate_content', 'Inappropriate content'),
        ('delivery_dispute', 'Delivery dispute'),
        ('other',            'Other'),
    ]

    STATUS_CHOICES = [
        ('pending',       'Pending'),
        ('in_mediation',  'Parties Asked to Resolve'),
        ('dismissed',     'Dismissed'),
        ('acted',         'Acted On'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transaction = models.ForeignKey(
        'transactions.Transaction',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports'
    )
    listing = models.ForeignKey(
        'listings.Listing',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports'
    )
    reported_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports_against'
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports_submitted'
    )
    reason = models.CharField(max_length=30, choices=REASON_CHOICES)
    details = models.TextField(blank=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Report by {self.reporter.email} — {self.get_reason_display()}"
