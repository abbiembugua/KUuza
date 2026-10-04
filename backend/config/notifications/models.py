import uuid
from django.db import models
from django.conf import settings


class Notification(models.Model):
    TYPE_CHOICES = [
        # Transaction events
        ('purchase_created',    'Purchase Created'),
        ('receipt_ready',       'Receipt Ready'),
        ('delivery_marked',     'Delivery Marked'),
        ('receipt_confirmed',   'Receipt Confirmed'),
        ('delivery_disputed',   'Delivery Disputed'),
        # Account events
        ('seller_verified',     'Seller Verified'),
        ('seller_revoked',      'Seller Status Revoked'),
        ('account_suspended',   'Account Suspended'),
        ('account_reactivated', 'Account Reactivated'),
        # Social events
        ('review_received',     'Review Received'),
        # Report events
        ('report_acted',        'Report Acted On'),
        ('report_dismissed',    'Report Dismissed'),
        # Listing events
        ('listing_archived',    'Listing Archived'),
        # Dispute events
        ('dispute_resolved',    'Dispute Resolved'),
        # Q&A events
        ('question_asked',      'Question Asked'),
        ('question_answered',   'Question Answered'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_notifications'
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='user_sent_notifications'
    )
    transaction = models.ForeignKey(
        'transactions.Transaction',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='tx_notifications'
    )
    listing = models.ForeignKey(
        'listings.Listing',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='listing_notifications'
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
